import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type SosAlert = Database["public"]["Tables"]["sos_alerts"]["Row"];

export async function listSosAlerts(userId: string): Promise<SosAlert[]> {
  const { data, error } = await supabase
    .from("sos_alerts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) throw error;
  return data ?? [];
}

export async function resolveSosAlert(id: string, status: "resolved" | "cancelled"): Promise<void> {
  const { error } = await supabase
    .from("sos_alerts")
    .update({ status, resolved_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
