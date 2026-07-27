import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type AppNotification = Database["public"]["Tables"]["notifications"]["Row"];

export async function listNotifications(userId: string): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(60);
  if (error) throw error;
  return data ?? [];
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
  if (error) throw error;
}

export async function markAllRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);
  if (error) throw error;
}

export async function createNotification(
  userId: string,
  input: { title: string; body?: string; category?: string },
): Promise<void> {
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    title: input.title,
    body: input.body ?? "",
    category: input.category ?? "update",
  });
  if (error) throw error;
}
