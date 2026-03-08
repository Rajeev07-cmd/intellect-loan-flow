import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { application_id, messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Fetch application context from DB
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    let contextBlock = "";

    if (application_id) {
      const [appRes, finRes, riskRes, camRes, wfRes] = await Promise.all([
        sb.from("applications").select("*").eq("id", application_id).maybeSingle(),
        sb.from("financial_features").select("*").eq("application_id", application_id).maybeSingle(),
        sb.from("risk_results").select("*").eq("application_id", application_id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        sb.from("cam_reports").select("*").eq("application_id", application_id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        sb.from("workflow_status").select("*").eq("application_id", application_id).maybeSingle(),
      ]);

      const app = appRes.data;
      const fin = finRes.data;
      const risk = riskRes.data;
      const cam = camRes.data;
      const wf = wfRes.data;

      if (app) {
        contextBlock += `\n## Company Application\n`;
        contextBlock += `Company: ${app.company_name}\nSector: ${app.sector}\nLoan Amount: ₹${app.loan_amount} Cr\n`;
        contextBlock += `Status: ${app.status}\nRisk Score: ${app.risk_score ?? "N/A"}\nRisk Category: ${app.risk_category ?? "N/A"}\n`;
        contextBlock += `Default Probability: ${app.default_probability ?? "N/A"}\nCIBIL Score: ${app.cibil_score ?? "N/A"}\n`;
        contextBlock += `Recommendation: ${app.recommendation ?? "Pending"}\nCredit Officer Decision: ${app.credit_officer_decision ?? "Pending"}\n`;
        contextBlock += `Manager Decision: ${app.manager_decision ?? "Pending"}\nFinal Status: ${app.final_status ?? "Pending"}\n`;
        if (app.promoter_group) contextBlock += `Promoter Group: ${app.promoter_group}\n`;
        if (app.business_description) contextBlock += `Business Description: ${app.business_description}\n`;
      }

      if (fin) {
        contextBlock += `\n## Financial Features\n`;
        contextBlock += `Revenue Growth: ${fin.revenue_growth ?? "N/A"}\nProfit Margin: ${fin.profit_margin ?? "N/A"}\n`;
        contextBlock += `Debt Ratio: ${fin.debt_ratio ?? "N/A"}\nInterest Coverage: ${fin.interest_coverage_ratio ?? "N/A"}\n`;
        contextBlock += `Litigation Count: ${fin.litigation_count ?? 0}\nSector Risk: ${fin.sector_risk ?? "N/A"}\n`;
        contextBlock += `Collateral Score: ${fin.collateral_score ?? "N/A"}\n`;
      }

      if (risk) {
        contextBlock += `\n## Risk Analysis Results\n`;
        contextBlock += `Risk Score: ${risk.risk_score}\nRisk Category: ${risk.risk_category}\nDefault Probability: ${risk.default_probability}\n`;
        if (risk.explanation) {
          const expl = Array.isArray(risk.explanation) ? risk.explanation : [risk.explanation];
          contextBlock += `Explanations:\n${expl.map((e: any) => `- ${typeof e === "string" ? e : JSON.stringify(e)}`).join("\n")}\n`;
        }
      }

      if (cam) {
        contextBlock += `\n## CAM Report\n`;
        if (cam.company_overview) contextBlock += `Company Overview: ${cam.company_overview}\n`;
        if (cam.financial_analysis) contextBlock += `Financial Analysis: ${cam.financial_analysis}\n`;
        if (cam.risk_analysis) contextBlock += `Risk Analysis: ${cam.risk_analysis}\n`;
        if (cam.recommendation) contextBlock += `Recommendation: ${cam.recommendation}\n`;
        if (cam.suggested_loan_limit) contextBlock += `Suggested Loan Limit: ${cam.suggested_loan_limit}\n`;
        if (cam.interest_rate) contextBlock += `Interest Rate: ${cam.interest_rate}\n`;
      }

      if (wf) {
        contextBlock += `\n## Workflow\nCurrent Stage: ${wf.current_stage}\n`;
      }
    }

    const systemPrompt = `You are the AI Credit Copilot for Intelli-Credit, an enterprise corporate credit decisioning platform used by Credit Officers and Managers at financial institutions.

Your role:
- Analyze corporate loan applications using the data provided below.
- Explain risk scores, financial metrics, and credit recommendations clearly.
- Provide actionable insights for credit decisions.
- Never hallucinate data — only use information from the context below. If data is missing, say so.
- Be concise, professional, and use bullet points where appropriate.
- Format monetary values in Indian Rupees (₹ Cr).

${contextBlock ? `# Current Application Context\n${contextBlock}` : "No application is currently selected. Ask the user to select an application first."}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("Gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-copilot error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
