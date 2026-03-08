import { apiClient } from "./api";

export interface WorkflowStep {
  stage: string;
  status: "completed" | "active" | "pending";
  date: string;
}

export async function getWorkflowStatus(applicationId: string): Promise<WorkflowStep[]> {
  return apiClient.get<WorkflowStep[]>(`/api/workflow-status/${applicationId}`);
}
