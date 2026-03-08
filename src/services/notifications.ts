import { supabase } from "@/integrations/supabase/client";

export type NotificationRole = "manager" | "credit_officer";
export type NotificationType = "application_submitted" | "manager_decision" | "review_required" | "approval_completed" | "info";

export interface Notification {
  id: string;
  application_id: string | null;
  title: string;
  description: string;
  severity: string;
  is_read: boolean;
  created_at: string;
  role: NotificationRole | null;
  notification_type: NotificationType | null;
}

export async function createNotification(
  title: string,
  description: string,
  severity: "info" | "warning" | "error" = "info",
  applicationId?: string,
  role: NotificationRole = "manager",
  notificationType: NotificationType = "info"
): Promise<void> {
  try {
    await supabase.from("notifications").insert({
      application_id: applicationId || null,
      title,
      description,
      severity,
      role,
      notification_type: notificationType,
    } as any);
  } catch (e) {
    console.error("Notification error:", e);
  }
}

export async function getNotifications(limit = 20, role?: NotificationRole): Promise<Notification[]> {
  let query = supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (role) {
    query = query.eq("role", role);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }

  return (data || []).map((n: any) => ({
    id: n.id,
    application_id: n.application_id,
    title: n.title,
    description: n.description,
    severity: n.severity,
    is_read: n.is_read,
    created_at: n.created_at,
    role: n.role || null,
    notification_type: n.notification_type || null,
  }));
}

export async function markNotificationRead(id: string): Promise<void> {
  await supabase.from("notifications").update({ is_read: true }).eq("id", id);
}

export async function markAllNotificationsRead(role?: NotificationRole): Promise<void> {
  let query = supabase.from("notifications").update({ is_read: true }).eq("is_read", false);
  if (role) {
    query = query.eq("role", role);
  }
  await query;
}

export function subscribeToNotifications(callback: (notifications: Notification[]) => void, role?: NotificationRole) {
  return supabase
    .channel("notifications_channel")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, async (payload: any) => {
      // Only refetch if the notification matches the role filter
      if (role && payload.new?.role !== role) return;
      const notifs = await getNotifications(20, role);
      callback(notifs);
    })
    .subscribe();
}
