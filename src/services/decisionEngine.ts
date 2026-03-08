import { supabase } from "@/integrations/supabase/client";
import { logAuditEvent } from "./auditLog";
import { createNotification } from "./notifications";
import { updateWorkflowStatus, type WorkflowStage } from "./workflowStatus";

export type CreditOfficerDecision = "approve" | "conditional" | "reject";
export type ManagerDecision = "approve" | "reject" | "review";

export interface DecisionState {
  credit_officer_decision: string | null;
  manager_decision: string | null;
  final_status: string | null;
}

// Compute final status based on both decisions
export function computeFinalStatus(
  coDecision: CreditOfficerDecision | null,
  mgrDecision: ManagerDecision | null
): string | null {
  if (!coDecision || !mgrDecision) return null;

  // Rule 5: Both reject → Rejected
  if (coDecision === "reject" && mgrDecision === "reject") return "Rejected";

  // Rule 1: Both approve → Approved
  if (coDecision === "approve" && mgrDecision === "approve") return "Approved";

  // Rule 2: CO conditional + Manager approve → Approved with Conditions
  if (coDecision === "conditional" && mgrDecision === "approve") return "Approved with Conditions";

  // Rule 3: CO reject + Manager approve → Review Required
  if (coDecision === "reject" && mgrDecision === "approve") return "Under Review";

  // Rule 4: Either reject (but not both) → Under Review
  if (coDecision === "reject" || mgrDecision === "reject") return "Under Review";

  // Manager sends for review
  if (mgrDecision === "review") return "Under Review";

  // Fallback

  return "Under Review";
}

// Credit Officer submits their decision
export async function submitCreditOfficerDecision(
  applicationId: string,
  decision: CreditOfficerDecision,
  companyName: string
): Promise<void> {
  const label = decision === "approve" ? "Approve" : decision === "conditional" ? "Conditional Approval" : "Reject";

  await supabase
    .from("applications")
    .update({
      credit_officer_decision: decision,
      status: "Manager Review",
      updated_at: new Date().toISOString(),
    } as any)
    .eq("id", applicationId);

  await updateWorkflowStatus(applicationId, "Manager Review");

  await logAuditEvent(
    "Credit Officer Decision",
    `Credit Officer recommends: ${label} for ${companyName}`,
    applicationId,
    "Credit Officer"
  );

  // Notify manager
  await createNotification(
    "Credit Officer Decision Submitted",
    `${companyName} — Credit Officer recommends: ${label}. Awaiting your review.`,
    decision === "reject" ? "error" : decision === "conditional" ? "warning" : "info",
    applicationId,
    "manager",
    "application_submitted"
  );
}

// Manager submits their decision
export async function submitManagerDecision(
  applicationId: string,
  mgrDecision: ManagerDecision,
  companyName: string
): Promise<void> {
  // Get CO decision first
  const { data: appData } = await supabase
    .from("applications")
    .select("credit_officer_decision")
    .eq("id", applicationId)
    .single();

  const coDecision = (appData as any)?.credit_officer_decision as CreditOfficerDecision | null;
  const finalStatus = computeFinalStatus(coDecision, mgrDecision);

  const mgrLabel = mgrDecision === "approve" ? "Approve" : mgrDecision === "reject" ? "Reject" : "Send for Review";

  // Determine workflow stage
  let workflowStage: WorkflowStage = "Manager Review";
  if (finalStatus === "Approved" || finalStatus === "Approved with Conditions") {
    workflowStage = "Approved";
  } else if (finalStatus === "Rejected") {
    workflowStage = "Rejected";
  }

  await supabase
    .from("applications")
    .update({
      manager_decision: mgrDecision,
      final_status: finalStatus,
      status: finalStatus || "Under Review",
      updated_at: new Date().toISOString(),
    } as any)
    .eq("id", applicationId);

  await updateWorkflowStatus(applicationId, workflowStage);

  await logAuditEvent(
    "Manager Decision",
    `Manager decision: ${mgrLabel} — Final Status: ${finalStatus}`,
    applicationId,
    "Credit Manager"
  );

  // Notify credit officer about the final decision
  await createNotification(
    `Loan ${finalStatus}`,
    `${companyName} — Manager decision: ${mgrLabel}. Final status: ${finalStatus}`,
    finalStatus === "Rejected" ? "error" : finalStatus === "Approved" ? "info" : "warning",
    applicationId
  );
}

// Get decision state for an application
export async function getDecisionState(applicationId: string): Promise<DecisionState> {
  const { data } = await supabase
    .from("applications")
    .select("credit_officer_decision, manager_decision, final_status")
    .eq("id", applicationId)
    .single();

  return {
    credit_officer_decision: (data as any)?.credit_officer_decision || null,
    manager_decision: (data as any)?.manager_decision || null,
    final_status: (data as any)?.final_status || null,
  };
}
