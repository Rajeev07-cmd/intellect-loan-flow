import { supabase } from "@/integrations/supabase/client";

export interface CamReport {
  company_overview: string;
  financial_analysis: string;
  risk_analysis: string;
  recommendation: string;
  suggested_loan_limit: string;
  interest_rate: string;
}

// Generate CAM via AI edge function
export async function generateCam(applicationId: string): Promise<CamReport> {
  const { data, error } = await supabase.functions.invoke("generate-cam", {
    body: { application_id: applicationId },
  });

  if (error) {
    console.error("CAM generation error:", error);
    throw new Error(error.message || "CAM generation failed");
  }

  if (data.error) throw new Error(data.error);

  return data.cam as CamReport;
}

// Save CAM report to database
export async function saveCamReport(
  applicationId: string,
  report: CamReport
): Promise<void> {
  const { error } = await supabase.from("cam_reports").upsert({
    application_id: applicationId,
    company_overview: report.company_overview,
    financial_analysis: report.financial_analysis,
    risk_analysis: report.risk_analysis,
    recommendation: report.recommendation,
    suggested_loan_limit: report.suggested_loan_limit,
    interest_rate: report.interest_rate,
  }, { onConflict: "application_id" });

  if (error) console.error("Error saving CAM report:", error);

  await supabase.from("applications").update({
    recommendation: report.recommendation,
    suggested_limit: report.suggested_loan_limit,
    interest_rate: report.interest_rate,
    status: "CAM Generated",
  }).eq("id", applicationId);
}

// Get CAM report from database
export async function getCamReport(
  applicationId: string
): Promise<CamReport | null> {
  const { data, error } = await supabase
    .from("cam_reports")
    .select("*")
    .eq("application_id", applicationId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    company_overview: data.company_overview || "",
    financial_analysis: data.financial_analysis || "",
    risk_analysis: data.risk_analysis || "",
    recommendation: data.recommendation || "",
    suggested_loan_limit: data.suggested_loan_limit || "",
    interest_rate: data.interest_rate || "",
  };
}

// Check if CAM exists for application
export async function hasCamReport(applicationId: string): Promise<boolean> {
  const { data } = await supabase
    .from("cam_reports")
    .select("id")
    .eq("application_id", applicationId)
    .maybeSingle();

  return !!data;
}
