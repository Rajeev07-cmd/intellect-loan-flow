import { apiClient } from "./api";

export interface RiskAnalysisInput {
  revenue_growth: number;
  profit_margin: number;
  debt_ratio: number;
  interest_coverage_ratio: number;
  litigation_count: number;
  sector_risk: number;
  collateral_score: number;
}

export interface RiskAnalysisResult {
  risk_score: number;
  risk_category: "Low" | "Medium" | "High";
  default_probability: number;
  explanation: string[];
}

export async function runRiskAnalysis(input: RiskAnalysisInput): Promise<RiskAnalysisResult> {
  return apiClient.post<RiskAnalysisResult>("/api/risk-analysis", input);
}
