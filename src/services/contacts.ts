import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type EmergencyContact = Database["public"]["Tables"]["emergency_contacts"]["Row"];
export type ContactInput = {
  name: string;
  relationship: string | null;
  phone: string;
  email: string | null;
  priority: number;
  notify_on_sos: boolean;
};

export async function listContacts(userId: string): Promise<EmergencyContact[]> {
  const { data, error } = await supabase
    .from("emergency_contacts")
    .select("*")
    .eq("user_id", userId)
    .order("priority", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createContact(userId: string, input: ContactInput): Promise<EmergencyContact> {
  const { data, error } = await supabase
    .from("emergency_contacts")
    .insert({ ...input, user_id: userId })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateContact(id: string, input: Partial<ContactInput>): Promise<EmergencyContact> {
  const { data, error } = await supabase
    .from("emergency_contacts")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteContact(id: string): Promise<void> {
  const { error } = await supabase.from("emergency_contacts").delete().eq("id", id);
  if (error) throw error;
}
