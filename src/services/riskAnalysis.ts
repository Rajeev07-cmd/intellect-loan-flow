import { supabase } from "@/integrations/supabase/client";

export interface RiskAnalysisInput {
  revenue_growth: number;
  profit_margin: number;
  debt_ratio: number;
  interest_coverage_ratio: number;
  litigation_count: number;
  sector_risk: number;
  collateral_score: number;
}

export interface FiveCsScore {
  name: string;
  score: number;
  weight: number;
  contribution: number;
  explanation: string;
}

export interface RiskAnalysisResult {
  risk_score: number;
  risk_category: "Low" | "Medium" | "High";
  default_probability: number;
  explanation: string[];
  five_cs_scores?: FiveCsScore[];
}

// Run risk analysis via edge function
export async function runRiskAnalysis(
  input: RiskAnalysisInput,
  applicationId?: string
): Promise<RiskAnalysisResult> {
  const { data, error } = await supabase.functions.invoke("run-risk-analysis", {
    body: { ...input, application_id: applicationId },
  });

  if (error) {
    console.error("Risk analysis error:", error);
    throw new Error(error.message || "Risk analysis failed");
  }

  if (data.error) throw new Error(data.error);
  return data as RiskAnalysisResult;
}

// Save financial features to database
export async function saveFinancialFeatures(
  applicationId: string,
  features: RiskAnalysisInput
): Promise<void> {
  const { error } = await supabase.from("financial_features").upsert({
    application_id: applicationId,
    profit_margin: features.profit_margin,
    debt_ratio: features.debt_ratio,
    interest_coverage_ratio: features.interest_coverage_ratio,
    revenue_growth: features.revenue_growth,
    sector_risk: features.sector_risk,
    collateral_score: features.collateral_score,
    litigation_count: features.litigation_count,
  }, { onConflict: "application_id" });

  if (error) console.error("Error saving financial features:", error);
}

// Get financial features from database
export async function getFinancialFeatures(
  applicationId: string
): Promise<RiskAnalysisInput | null> {
  const { data, error } = await supabase
    .from("financial_features")
    .select("*")
    .eq("application_id", applicationId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    revenue_growth: Number(data.revenue_growth) || 0,
    profit_margin: Number(data.profit_margin) || 0,
    debt_ratio: Number(data.debt_ratio) || 0,
    interest_coverage_ratio: Number(data.interest_coverage_ratio) || 0,
    litigation_count: data.litigation_count || 0,
    sector_risk: Number(data.sector_risk) || 0,
    collateral_score: Number(data.collateral_score) || 0,
  };
}

// Get risk results from database
export async function getRiskResults(
  applicationId: string
): Promise<RiskAnalysisResult | null> {
  const { data, error } = await supabase
    .from("risk_results")
    .select("*")
    .eq("application_id", applicationId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    risk_score: data.risk_score || 0,
    risk_category: (data.risk_category as "Low" | "Medium" | "High") || "Medium",
    default_probability: Number(data.default_probability) || 0,
    explanation: (data.explanation as string[]) || [],
  };
}

// Subscribe to real-time risk result updates
export function subscribeToRiskResults(
  applicationId: string,
  callback: (result: RiskAnalysisResult) => void
) {
  return supabase
    .channel(`risk_results:${applicationId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "risk_results",
        filter: `application_id=eq.${applicationId}`,
      },
      (payload) => {
        if (payload.new) {
          const data = payload.new as any;
          callback({
            risk_score: data.risk_score,
            risk_category: data.risk_category,
            default_probability: data.default_probability,
            explanation: data.explanation || [],
          });
        }
      }
    )
    .subscribe();
}
