import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Incident = Database["public"]["Tables"]["incidents"]["Row"];
export type IncidentInsert = Database["public"]["Tables"]["incidents"]["Insert"];
export type IncidentUpdate = Database["public"]["Tables"]["incidents"]["Update"];
export type Evidence = Database["public"]["Tables"]["incident_evidence"]["Row"];

export const INCIDENT_TYPES = [
  { value: "harassment", label: "Harassment" },
  { value: "stalking", label: "Stalking / following" },
  { value: "assault", label: "Physical assault" },
  { value: "cyber", label: "Online / cyber abuse" },
  { value: "theft", label: "Theft or robbery" },
  { value: "domestic", label: "Domestic abuse" },
  { value: "other", label: "Other" },
] as const;

export function incidentTypeLabel(value: string): string {
  return INCIDENT_TYPES.find((type) => type.value === value)?.label ?? "Incident";
}

export async function listIncidents(userId: string): Promise<Incident[]> {
  const { data, error } = await supabase
    .from("incidents")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getIncident(id: string): Promise<Incident | null> {
  const { data, error } = await supabase.from("incidents").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createIncident(userId: string, input: Omit<IncidentInsert, "user_id">): Promise<Incident> {
  const { data, error } = await supabase
    .from("incidents")
    .insert({ ...input, user_id: userId })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateIncident(id: string, patch: IncidentUpdate): Promise<Incident> {
  const { data, error } = await supabase.from("incidents").update(patch).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}

export async function deleteIncident(id: string): Promise<void> {
  const { error } = await supabase.from("incidents").delete().eq("id", id);
  if (error) throw error;
}

export async function listEvidence(incidentId: string): Promise<Evidence[]> {
  const { data, error } = await supabase
    .from("incident_evidence")
    .select("*")
    .eq("incident_id", incidentId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export function evidenceKindFor(file: File): Database["public"]["Enums"]["evidence_kind"] {
  if (file.type.startsWith("image/")) return "photo";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  return "document";
}

export async function uploadEvidence(userId: string, incidentId: string, file: File): Promise<Evidence> {
  const safeName = file.name.replace(/[^\w.\-]+/g, "_");
  const path = `${userId}/${incidentId}/${Date.now()}-${safeName}`;
  const { error: uploadError } = await supabase.storage.from("evidence").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from("incident_evidence")
    .insert({
      incident_id: incidentId,
      user_id: userId,
      kind: evidenceKindFor(file),
      storage_path: path,
      file_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function removeEvidence(item: Evidence): Promise<void> {
  await supabase.storage.from("evidence").remove([item.storage_path]);
  const { error } = await supabase.from("incident_evidence").delete().eq("id", item.id);
  if (error) throw error;
}

export async function signedEvidenceUrl(path: string, expiresIn = 3600): Promise<string | null> {
  const { data, error } = await supabase.storage.from("evidence").createSignedUrl(path, expiresIn);
  if (error) return null;
  return data.signedUrl;
}
