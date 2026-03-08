import { supabase } from "@/integrations/supabase/client";
import { logAuditEvent } from "./auditLog";
import { createNotification } from "./notifications";
import { updateWorkflowStatus } from "./workflowStatus";

export interface CamReport {
  id: string;
  application_id: string;
  company_overview: string | null;
  financial_analysis: string | null;
  risk_analysis: string | null;
  recommendation: string | null;
  suggested_loan_limit: string | null;
  interest_rate: string | null;
  created_at: string;
}

export async function getCamReport(applicationId: string): Promise<CamReport | null> {
  const { data, error } = await supabase
    .from("cam_reports")
    .select("*")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: false })
    .maybeSingle();

  if (error || !data) return null;
  return data as CamReport;
}

export async function saveCamReport(
  applicationId: string,
  report: {
    company_overview: string;
    financial_analysis: string;
    risk_analysis: string;
    recommendation: string;
    suggested_loan_limit: string;
    interest_rate: string;
  }
): Promise<CamReport | null> {
  // Upsert - update if exists, insert if not
  const existing = await getCamReport(applicationId);

  let data;
  if (existing) {
    const { data: updated, error } = await supabase
      .from("cam_reports")
      .update({ ...report })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw error;
    data = updated;
  } else {
    const { data: inserted, error } = await supabase
      .from("cam_reports")
      .insert({ application_id: applicationId, ...report })
      .select()
      .single();
    if (error) throw error;
    data = inserted;
  }

  // Update workflow
  await updateWorkflowStatus(applicationId, "CAM Generated");
  await logAuditEvent("CAM Generated", "Credit Appraisal Memo generated", applicationId, "Credit Officer");
  await createNotification("CAM Report Ready", `CAM report generated for application`, "info", applicationId);

  return data as CamReport;
}
