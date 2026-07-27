import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface TriggerSosInput {
  latitude: number | null;
  longitude: number | null;
  locationLabel: string | null;
  message: string;
}

export const triggerSos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: TriggerSosInput) => ({
    latitude: typeof input?.latitude === "number" ? input.latitude : null,
    longitude: typeof input?.longitude === "number" ? input.longitude : null,
    locationLabel: input?.locationLabel?.slice(0, 200) ?? null,
    message: (input?.message?.trim() || "I need help right now. Please reach me immediately.").slice(0, 500),
  }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { sendSosEmails } = await import("./sos.server");

    const [{ data: profile }, { data: contacts }] = await Promise.all([
      supabase.from("profiles").select("full_name, phone").eq("id", userId).maybeSingle(),
      supabase
        .from("emergency_contacts")
        .select("name, email, phone")
        .eq("user_id", userId)
        .eq("notify_on_sos", true)
        .order("priority"),
    ]);

    const mapsUrl =
      data.latitude != null && data.longitude != null
        ? `https://www.google.com/maps?q=${data.latitude},${data.longitude}`
        : null;

    const { sent, error } = await sendSosEmails({
      reporterName: profile?.full_name || "A SafeHer user",
      reporterPhone: profile?.phone ?? null,
      message: data.message,
      locationLabel: data.locationLabel,
      mapsUrl,
      contacts: contacts ?? [],
    });

    const { data: alert, error: insertError } = await supabase
      .from("sos_alerts")
      .insert({
        user_id: userId,
        latitude: data.latitude,
        longitude: data.longitude,
        location_label: data.locationLabel,
        message: data.message,
        status: "active",
        contacts_notified: sent,
        notification_error: error,
      })
      .select("*")
      .single();
    if (insertError) throw new Error(insertError.message);

    await supabase.from("notifications").insert({
      user_id: userId,
      title: "SOS alert activated",
      body:
        sent > 0
          ? `${sent} emergency contact${sent === 1 ? "" : "s"} were emailed with your location.`
          : "Your alert was recorded. No contacts were emailed.",
      category: "emergency",
    });

    return {
      alert,
      contactsNotified: sent,
      totalContacts: contacts?.length ?? 0,
      warning: error,
    };
  });
