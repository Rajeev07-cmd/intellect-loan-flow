import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RiskInput {
  revenue_growth: number;
  profit_margin: number;
  debt_ratio: number;
  interest_coverage_ratio: number;
  litigation_count: number;
  sector_risk: number;
  collateral_score: number;
}

interface RiskResult {
  risk_score: number;
  risk_category: "Low" | "Medium" | "High";
  default_probability: number;
  explanation: string[];
  five_cs_scores: { name: string; score: number; weight: number; contribution: number; explanation: string }[];
}

function computeRiskScore(input: RiskInput): RiskResult {
  const explanation: string[] = [];

  // --- Feature scoring (0-100 scale, higher = better/safer) ---
  // Profit margin score
  const profitScore = input.profit_margin >= 0.20 ? 90
    : input.profit_margin >= 0.10 ? 70
    : input.profit_margin >= 0.05 ? 50
    : input.profit_margin >= 0 ? 30 : 10;
  if (profitScore <= 30) explanation.push(`Low profit margin (${(input.profit_margin * 100).toFixed(1)}%) indicates weak earnings capacity`);

  // Debt ratio score (lower debt = better)
  const debtScore = input.debt_ratio <= 0.3 ? 90
    : input.debt_ratio <= 0.5 ? 70
    : input.debt_ratio <= 0.7 ? 45
    : input.debt_ratio <= 0.9 ? 25 : 10;
  if (debtScore <= 45) explanation.push(`High debt ratio (${(input.debt_ratio * 100).toFixed(1)}%) raises leverage concerns`);

  // Interest coverage score
  const coverageScore = input.interest_coverage_ratio >= 4 ? 95
    : input.interest_coverage_ratio >= 2.5 ? 75
    : input.interest_coverage_ratio >= 1.5 ? 55
    : input.interest_coverage_ratio >= 1 ? 30 : 10;
  if (coverageScore <= 30) explanation.push(`Interest coverage ratio (${input.interest_coverage_ratio.toFixed(2)}x) below safe threshold`);

  // Revenue growth score
  const growthScore = input.revenue_growth >= 0.15 ? 90
    : input.revenue_growth >= 0.08 ? 70
    : input.revenue_growth >= 0.02 ? 50
    : input.revenue_growth >= 0 ? 35 : 15;
  if (growthScore <= 35) explanation.push(`Stagnant/negative revenue growth (${(input.revenue_growth * 100).toFixed(1)}%)`);

  // Litigation score (fewer = better)
  const litigationScore = input.litigation_count === 0 ? 95
    : input.litigation_count <= 1 ? 75
    : input.litigation_count <= 3 ? 50
    : input.litigation_count <= 5 ? 30 : 10;
  if (litigationScore <= 50) explanation.push(`${input.litigation_count} active litigations flagged`);

  // Sector risk score (input is 0-1, lower = safer)
  const sectorScore = Math.round((1 - input.sector_risk) * 100);
  if (sectorScore <= 40) explanation.push(`Sector classified as high-risk (score: ${sectorScore})`);

  // Collateral score (input is 0-1, higher = better)
  const collateralScore = Math.round(input.collateral_score * 100);
  if (collateralScore <= 40) explanation.push(`Weak collateral coverage (score: ${collateralScore})`);

  // --- Five Cs framework ---
  const fiveCs = [
    {
      name: "Character",
      score: Math.round((litigationScore * 0.6 + growthScore * 0.4)),
      weight: 20,
      explanation: `Based on litigation history (${input.litigation_count} cases) and business track record`,
    },
    {
      name: "Capacity",
      score: Math.round((coverageScore * 0.5 + profitScore * 0.3 + growthScore * 0.2)),
      weight: 25,
      explanation: `Debt servicing ability: ICR ${input.interest_coverage_ratio.toFixed(2)}x, margin ${(input.profit_margin * 100).toFixed(1)}%`,
    },
    {
      name: "Capital",
      score: Math.round((100 - debtScore * 0) + debtScore),
      weight: 20,
      explanation: `Leverage assessment: debt ratio ${(input.debt_ratio * 100).toFixed(1)}%`,
    },
    {
      name: "Collateral",
      score: collateralScore,
      weight: 15,
      explanation: `Collateral quality and coverage assessment`,
    },
    {
      name: "Conditions",
      score: Math.round((sectorScore * 0.6 + growthScore * 0.4)),
      weight: 20,
      explanation: `Sector outlook and macroeconomic conditions`,
    },
  ];

  // Calculate weighted composite
  const compositeScore = fiveCs.reduce((sum, c) => sum + (c.score * c.weight / 100), 0);
  const riskScore = Math.round(Math.max(0, Math.min(100, compositeScore)));

  // Default probability (inverse relationship with score)
  const defaultProbability = Math.round(Math.max(0.01, Math.min(0.95,
    1 - (riskScore / 100) * 0.85 - 0.05
  )) * 100) / 100;

  const riskCategory: "Low" | "Medium" | "High" =
    riskScore >= 65 ? "Low" : riskScore >= 40 ? "Medium" : "High";

  if (explanation.length === 0) {
    explanation.push("Financial profile within acceptable parameters");
  }

  const fiveCsWithContribution = fiveCs.map(c => ({
    ...c,
    contribution: Math.round((c.score * c.weight / 100) * 10) / 10,
  }));

  return { risk_score: riskScore, risk_category: riskCategory, default_probability: defaultProbability, explanation, five_cs_scores: fiveCsWithContribution };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { application_id, ...inputFields } = body;

    const input: RiskInput = {
      revenue_growth: inputFields.revenue_growth ?? 0.1,
      profit_margin: inputFields.profit_margin ?? 0.1,
      debt_ratio: inputFields.debt_ratio ?? 0.5,
      interest_coverage_ratio: inputFields.interest_coverage_ratio ?? 2,
      litigation_count: inputFields.litigation_count ?? 0,
      sector_risk: inputFields.sector_risk ?? 0.5,
      collateral_score: inputFields.collateral_score ?? 0.5,
    };

    const result = computeRiskScore(input);

    // If application_id provided, persist to DB
    if (application_id) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const sb = createClient(supabaseUrl, supabaseKey);

      // Save financial features
      await sb.from("financial_features").upsert({
        application_id,
        profit_margin: input.profit_margin,
        debt_ratio: input.debt_ratio,
        interest_coverage_ratio: input.interest_coverage_ratio,
        revenue_growth: input.revenue_growth,
        sector_risk: input.sector_risk,
        collateral_score: input.collateral_score,
        litigation_count: input.litigation_count,
      }, { onConflict: "application_id" });

      // Save risk results
      await sb.from("risk_results").upsert({
        application_id,
        risk_score: result.risk_score,
        risk_category: result.risk_category,
        default_probability: result.default_probability,
        explanation: result.explanation,
      }, { onConflict: "application_id" });

      // Update applications table
      await sb.from("applications").update({
        risk_score: result.risk_score,
        risk_category: result.risk_category,
        default_probability: result.default_probability,
        status: "Risk Analysis Completed",
        updated_at: new Date().toISOString(),
      }).eq("id", application_id);

      // Update workflow
      await sb.from("workflow_status").upsert({
        application_id,
        current_stage: "Risk Analysis Completed",
        updated_at: new Date().toISOString(),
      }, { onConflict: "application_id" });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("run-risk-analysis error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
