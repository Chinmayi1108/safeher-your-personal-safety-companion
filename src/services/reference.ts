import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type SafetyTip = Database["public"]["Tables"]["safety_tips"]["Row"];
export type NearbyService = Database["public"]["Tables"]["nearby_services"]["Row"];

export async function listSafetyTips(): Promise<SafetyTip[]> {
  const { data, error } = await supabase.from("safety_tips").select("*").order("sort_order");
  if (error) throw error;
  return data ?? [];
}

export async function listNearbyServices(): Promise<NearbyService[]> {
  const { data, error } = await supabase.from("nearby_services").select("*").order("sort_order");
  if (error) throw error;
  return data ?? [];
}
