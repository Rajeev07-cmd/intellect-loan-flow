import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { application_id } = await req.json();
    if (!application_id) throw new Error("application_id is required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch application data
    const { data: app } = await supabase
      .from("applications")
      .select("*")
      .eq("id", application_id)
      .single();

    if (!app) throw new Error("Application not found");

    // Fetch risk results
    const { data: riskData } = await supabase
      .from("risk_results")
      .select("*")
      .eq("application_id", application_id)
      .maybeSingle();

    // Fetch financial features
    const { data: financials } = await supabase
      .from("financial_features")
      .select("*")
      .eq("application_id", application_id)
      .maybeSingle();

    // Fetch AML results
    const { data: amlData } = await supabase
      .from("aml_results")
      .select("*")
      .eq("application_id", application_id)
      .maybeSingle();

    const prompt = `Generate a SWOT analysis for a corporate credit assessment.

Company: ${app.company_name}
Sector: ${app.sector}
Loan Amount: ₹${app.loan_amount} Cr
CIBIL Score: ${app.cibil_score || "N/A"}
Risk Score: ${riskData?.risk_score || app.risk_score || "N/A"}
Risk Category: ${riskData?.risk_category || app.risk_category || "N/A"}
Default Probability: ${riskData?.default_probability || app.default_probability || "N/A"}
Recommendation: ${app.recommendation || "Under Review"}
AML Risk: ${amlData?.aml_risk_level || "Not screened"}
Revenue Growth: ${financials?.revenue_growth || "N/A"}
Profit Margin: ${financials?.profit_margin || "N/A"}
Debt Ratio: ${financials?.debt_ratio || "N/A"}
Interest Coverage: ${financials?.interest_coverage_ratio || "N/A"}

Return a JSON object with exactly this structure (3-5 items per category):
{
  "strengths": ["point 1", "point 2", ...],
  "weaknesses": ["point 1", "point 2", ...],
  "opportunities": ["point 1", "point 2", ...],
  "threats": ["point 1", "point 2", ...]
}

Make the analysis specific, data-driven, and relevant to corporate credit assessment in the Indian banking context. Each point should be 1-2 sentences.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a senior credit analyst. Return ONLY valid JSON, no markdown." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_swot",
            description: "Generate SWOT analysis",
            parameters: {
              type: "object",
              properties: {
                strengths: { type: "array", items: { type: "string" } },
                weaknesses: { type: "array", items: { type: "string" } },
                opportunities: { type: "array", items: { type: "string" } },
                threats: { type: "array", items: { type: "string" } },
              },
              required: ["strengths", "weaknesses", "opportunities", "threats"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "generate_swot" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let swot;

    if (toolCall?.function?.arguments) {
      swot = JSON.parse(toolCall.function.arguments);
    } else {
      // Fallback: try to parse content
      const content = aiData.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) swot = JSON.parse(jsonMatch[0]);
      else throw new Error("Could not parse SWOT from AI response");
    }

    // Save to database
    await supabase.from("swot_reports").upsert({
      application_id,
      strengths: swot.strengths,
      weaknesses: swot.weaknesses,
      opportunities: swot.opportunities,
      threats: swot.threats,
    }, { onConflict: "application_id" });

    return new Response(JSON.stringify({ success: true, ...swot }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("SWOT generation error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
