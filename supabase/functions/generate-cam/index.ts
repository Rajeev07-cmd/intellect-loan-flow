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
    const { application_id } = await req.json();
    if (!application_id) throw new Error("application_id required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    // Fetch all application data
    const [appRes, finRes, riskRes, docsRes, fieldsRes] = await Promise.all([
      sb.from("applications").select("*").eq("id", application_id).single(),
      sb.from("financial_features").select("*").eq("application_id", application_id).maybeSingle(),
      sb.from("risk_results").select("*").eq("application_id", application_id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      sb.from("documents").select("document_name, document_type, verification_status").eq("application_id", application_id),
      sb.from("document_extracted_fields").select("field_name, field_value, confidence_score").eq("application_id", application_id),
    ]);

    const app = appRes.data;
    if (!app) throw new Error("Application not found");

    const fin = finRes.data;
    const risk = riskRes.data;
    const docs = docsRes.data || [];
    const fields = fieldsRes.data || [];

    // Build context for LLM
    const extractedFieldsSummary = fields
      .filter((f: any) => f.field_value)
      .map((f: any) => `${f.field_name}: ${f.field_value} (confidence: ${((f.confidence_score || 0) * 100).toFixed(0)}%)`)
      .join("\n");

    const prompt = `Generate a professional Credit Appraisal Memo (CAM) for a corporate loan application.

## Application Details
- Company: ${app.company_name}
- Sector: ${app.sector}
- CIN: ${app.cin || "Not provided"}
- Loan Amount: ₹${app.loan_amount} Crore
- CIBIL Score: ${app.cibil_score ?? "Not available"}
- Year of Incorporation: ${app.incorporation_year || "Not provided"}
- Promoter Group: ${app.promoter_group || "Not provided"}
- Registered Address: ${app.registered_address || "Not provided"}

## Financial Features
${fin ? `- Revenue Growth: ${fin.revenue_growth != null ? (fin.revenue_growth * 100).toFixed(1) + "%" : "N/A"}
- Profit Margin: ${fin.profit_margin != null ? (fin.profit_margin * 100).toFixed(1) + "%" : "N/A"}
- Debt Ratio: ${fin.debt_ratio != null ? (fin.debt_ratio * 100).toFixed(1) + "%" : "N/A"}
- Interest Coverage Ratio: ${fin.interest_coverage_ratio != null ? fin.interest_coverage_ratio.toFixed(2) + "x" : "N/A"}
- Collateral Score: ${fin.collateral_score ?? "N/A"}
- Litigation Count: ${fin.litigation_count ?? 0}
- Sector Risk: ${fin.sector_risk ?? "N/A"}` : "No financial features available"}

## Risk Analysis
${risk ? `- Risk Score: ${risk.risk_score}/100
- Risk Category: ${risk.risk_category}
- Default Probability: ${risk.default_probability != null ? (risk.default_probability * 100).toFixed(2) + "%" : "N/A"}
- Key Factors: ${Array.isArray(risk.explanation) ? risk.explanation.join("; ") : "N/A"}` : "Risk analysis not yet performed"}

## Documents
${docs.length > 0 ? docs.map((d: any) => `- ${d.document_name} (${d.document_type}) — ${d.verification_status}`).join("\n") : "No documents uploaded"}

## Extracted Fields
${extractedFieldsSummary || "No fields extracted yet"}

You MUST return the CAM using the generate_cam tool with these exact sections:
1. company_overview: Comprehensive overview of the company, its background, management, and sector position
2. financial_analysis: Detailed analysis of financial health, ratios, trends, and capacity
3. risk_analysis: Risk assessment including all risk factors, mitigants, and collateral evaluation
4. recommendation: Clear recommendation (Approve/Reject/Conditional) with rationale, suggested limit, and interest rate
5. suggested_loan_limit: The recommended loan limit (e.g., "₹50 Cr")
6. interest_rate: Recommended interest rate (e.g., "11.5%")

Be specific, data-driven, and professional. Use markdown formatting within sections.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a senior credit analyst at a financial institution. Generate professional Credit Appraisal Memos based on data provided. Be thorough, data-driven, and precise." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_cam",
            description: "Generate a structured Credit Appraisal Memo",
            parameters: {
              type: "object",
              properties: {
                company_overview: { type: "string", description: "Company background, management, and sector analysis" },
                financial_analysis: { type: "string", description: "Financial health, ratios, and trends analysis" },
                risk_analysis: { type: "string", description: "Risk assessment with factors and mitigants" },
                recommendation: { type: "string", description: "Clear recommendation with rationale" },
                suggested_loan_limit: { type: "string", description: "Recommended loan limit e.g. ₹50 Cr" },
                interest_rate: { type: "string", description: "Recommended interest rate e.g. 11.5%" },
              },
              required: ["company_overview", "financial_analysis", "risk_analysis", "recommendation", "suggested_loan_limit", "interest_rate"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "generate_cam" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI CAM generation failed");
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No CAM result from AI");

    const cam = JSON.parse(toolCall.function.arguments);

    // Save CAM to database
    await sb.from("cam_reports").upsert({
      application_id,
      company_overview: cam.company_overview,
      financial_analysis: cam.financial_analysis,
      risk_analysis: cam.risk_analysis,
      recommendation: cam.recommendation,
      suggested_loan_limit: cam.suggested_loan_limit,
      interest_rate: cam.interest_rate,
    }, { onConflict: "application_id" });

    // Update application
    await sb.from("applications").update({
      recommendation: cam.recommendation.includes("Approve") ? "Approve" : cam.recommendation.includes("Reject") ? "Reject" : "Conditional",
      suggested_limit: cam.suggested_loan_limit,
      interest_rate: cam.interest_rate,
      status: "CAM Generated",
      updated_at: new Date().toISOString(),
    }).eq("id", application_id);

    // Update workflow
    await sb.from("workflow_status").upsert({
      application_id,
      current_stage: "CAM Generated",
      updated_at: new Date().toISOString(),
    }, { onConflict: "application_id" });

    // Notifications
    await sb.from("audit_logs").insert({
      event_type: "CAM Generated",
      event_description: `AI-generated Credit Appraisal Memo for ${app.company_name}`,
      application_id,
      user_name: "AI Engine",
    });

    await sb.from("notifications").insert({
      title: "CAM Report Ready",
      description: `AI-generated CAM report for ${app.company_name} is ready for review.`,
      severity: "info",
      application_id,
      notification_type: "cam_generated",
      role: "credit_officer",
    });

    return new Response(JSON.stringify({ success: true, cam }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-cam error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
