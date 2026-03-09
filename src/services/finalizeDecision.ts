import { supabase } from "@/integrations/supabase/client";

export interface FinalizeDecisionPayload {
  application_id: string;
  decision: "approve" | "reject" | "conditional" | "review";
  approved_limit?: string;
  interest_rate?: string;
  officer_name?: string;
  reasons?: string[];
}

export interface FinalizeDecisionResult {
  success: boolean;
  final_status: string;
  cam_generated: boolean;
  notifications_sent: boolean;
  message: string;
}

export async function finalizeDecision(
  payload: FinalizeDecisionPayload
): Promise<FinalizeDecisionResult> {
  const { data, error } = await supabase.functions.invoke("finalize-decision", {
    body: payload,
  });

  if (error) {
    console.error("Finalize decision error:", error);
    throw new Error(error.message || "Failed to finalize decision");
  }

  return data as FinalizeDecisionResult;
}
