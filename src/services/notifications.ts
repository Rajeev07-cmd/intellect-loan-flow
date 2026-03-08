import { supabase } from "@/integrations/supabase/client";

export interface Notification {
  id: string;
  application_id: string | null;
  title: string;
  description: string;
  severity: string;
  is_read: boolean;
  created_at: string;
}

export async function createNotification(
  title: string,
  description: string,
  severity: "info" | "warning" | "error" = "info",
  applicationId?: string
): Promise<void> {
  try {
    await supabase.from("notifications").insert({
      application_id: applicationId || null,
      title,
      description,
      severity,
    });
  } catch (e) {
    console.error("Notification error:", e);
  }
}

export async function getNotifications(limit = 20): Promise<Notification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }

  return (data || []).map(n => ({
    id: n.id,
    application_id: n.application_id,
    title: n.title,
    description: n.description,
    severity: n.severity,
    is_read: n.is_read,
    created_at: n.created_at,
  }));
}

export async function markNotificationRead(id: string): Promise<void> {
  await supabase.from("notifications").update({ is_read: true }).eq("id", id);
}

export async function markAllNotificationsRead(): Promise<void> {
  await supabase.from("notifications").update({ is_read: true }).eq("is_read", false);
}

export function subscribeToNotifications(callback: (notifications: Notification[]) => void) {
  return supabase
    .channel("notifications_channel")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, async () => {
      const notifs = await getNotifications();
      callback(notifs);
    })
    .subscribe();
}
