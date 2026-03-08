import { apiClient } from "./api";

export interface CamReport {
  company_overview: string;
  financial_analysis: string;
  risk_analysis: string;
  recommendation: string;
  suggested_loan_limit: string;
  interest_rate: string;
}

export async function generateCam(applicationId: string): Promise<CamReport> {
  return apiClient.post<CamReport>("/api/generate-cam", {
    application_id: applicationId,
  });
}
