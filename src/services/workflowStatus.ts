import { supabase } from "@/integrations/supabase/client";

export type WorkflowStage = 
  | "Application Created"
  | "Documents Uploaded"
  | "Verification Completed"
  | "Risk Analysis Completed"
  | "CAM Generated"
  | "Manager Review"
  | "Approved"
  | "Rejected";

export interface WorkflowStep {
  stage: WorkflowStage;
  status: "completed" | "active" | "pending";
  date: string;
}

const WORKFLOW_STAGES: WorkflowStage[] = [
  "Application Created",
  "Documents Uploaded",
  "Verification Completed",
  "Risk Analysis Completed",
  "CAM Generated",
  "Manager Review",
  "Approved",
];

// Get workflow status from database
export async function getWorkflowStatus(applicationId: string): Promise<WorkflowStep[]> {
  // Try to get from workflow_status table
  const { data: workflowData } = await supabase
    .from("workflow_status")
    .select("current_stage, stage_history, updated_at")
    .eq("application_id", applicationId)
    .maybeSingle();

  // Get application status as fallback
  const { data: appData } = await supabase
    .from("applications")
    .select("status, created_at, updated_at")
    .eq("id", applicationId)
    .maybeSingle();

  const currentStage = (workflowData?.current_stage || appData?.status || "Application Created") as WorkflowStage;
  const stageHistory = (workflowData?.stage_history as Array<{ stage: string; date: string }>) || [];
  const currentStageIndex = WORKFLOW_STAGES.indexOf(currentStage);

  return WORKFLOW_STAGES.map((stage, index) => {
    const historyEntry = stageHistory.find((h) => h.stage === stage);
    
    let status: "completed" | "active" | "pending";
    if (index < currentStageIndex) {
      status = "completed";
    } else if (index === currentStageIndex) {
      status = "active";
    } else {
      status = "pending";
    }

    return {
      stage,
      status,
      date: historyEntry?.date || (status === "completed" || status === "active" 
        ? new Date().toISOString() 
        : ""),
    };
  });
}

// Update workflow status
export async function updateWorkflowStatus(
  applicationId: string,
  newStage: WorkflowStage
): Promise<void> {
  // Get current workflow
  const { data: existing } = await supabase
    .from("workflow_status")
    .select("stage_history")
    .eq("application_id", applicationId)
    .maybeSingle();

  const stageHistory = (existing?.stage_history as Array<{ stage: string; date: string }>) || [];
  stageHistory.push({
    stage: newStage,
    date: new Date().toISOString(),
  });

  if (existing) {
    await supabase
      .from("workflow_status")
      .update({
        current_stage: newStage,
        stage_history: stageHistory,
        updated_at: new Date().toISOString(),
      })
      .eq("application_id", applicationId);
  } else {
    await supabase.from("workflow_status").insert({
      application_id: applicationId,
      current_stage: newStage,
      stage_history: stageHistory,
    });
  }

  // Also update application status
  await supabase
    .from("applications")
    .update({ status: newStage })
    .eq("id", applicationId);
}

// Initialize workflow for new application
export async function initializeWorkflow(applicationId: string): Promise<void> {
  await supabase.from("workflow_status").insert({
    application_id: applicationId,
    current_stage: "Application Created",
    stage_history: [{ stage: "Application Created", date: new Date().toISOString() }],
  });
}

// Subscribe to real-time workflow updates
export function subscribeToWorkflowStatus(
  applicationId: string,
  callback: (steps: WorkflowStep[]) => void
) {
  return supabase
    .channel(`workflow:${applicationId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "workflow_status",
        filter: `application_id=eq.${applicationId}`,
      },
      async () => {
        const steps = await getWorkflowStatus(applicationId);
        callback(steps);
      }
    )
    .subscribe();
}
