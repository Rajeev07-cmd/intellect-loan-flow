import { supabase } from "@/integrations/supabase/client";

export interface AuditLogEntry {
  id: string;
  application_id: string | null;
  event_type: string;
  event_description: string;
  user_name: string;
  created_at: string;
}

export async function logAuditEvent(
  eventType: string,
  eventDescription: string,
  applicationId?: string,
  userName: string = "System"
): Promise<void> {
  try {
    await supabase.from("audit_logs").insert({
      application_id: applicationId || null,
      event_type: eventType,
      event_description: eventDescription,
      user_name: userName,
    });
  } catch (e) {
    console.error("Audit log error:", e);
  }
}

export async function getAuditLogs(applicationId?: string, limit = 50): Promise<AuditLogEntry[]> {
  let query = supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (applicationId) {
    query = query.eq("application_id", applicationId);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching audit logs:", error);
    return [];
  }

  return (data || []).map(d => ({
    id: d.id,
    application_id: d.application_id,
    event_type: d.event_type,
    event_description: d.event_description,
    user_name: d.user_name || "System",
    created_at: d.created_at,
  }));
}

export function subscribeToAuditLogs(callback: (logs: AuditLogEntry[]) => void) {
  return supabase
    .channel("audit_logs_channel")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "audit_logs" }, async () => {
      const logs = await getAuditLogs();
      callback(logs);
    })
    .subscribe();
}
