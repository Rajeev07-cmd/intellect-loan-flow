import { apiClient } from "./api";

export interface ApplicationSummary {
  id: string;
  company_name: string;
  sector: string;
  loan_amount: number;
  risk_score: number;
  status: string;
}

export async function getApplications(): Promise<ApplicationSummary[]> {
  return apiClient.get<ApplicationSummary[]>("/api/applications");
}
