export interface SosContact {
  name: string;
  email: string | null;
  phone: string;
}

export interface SosEmailInput {
  reporterName: string;
  reporterPhone: string | null;
  message: string;
  locationLabel: string | null;
  mapsUrl: string | null;
  contacts: SosContact[];
}

function emailHtml(input: SosEmailInput, contactName: string): string {
  const location = input.mapsUrl
    ? `<p style="margin:0 0 12px"><strong>Last known location:</strong> <a href="${input.mapsUrl}">${input.locationLabel ?? "Open in maps"}</a></p>`
    : `<p style="margin:0 0 12px"><strong>Last known location:</strong> ${input.locationLabel ?? "Not available"}</p>`;

  return `<div style="font-family:Segoe UI,Arial,sans-serif;color:#27374d;line-height:1.6">
  <div style="background:#ff4d4d;color:#fff;padding:20px 24px;border-radius:16px 16px 0 0">
    <h1 style="margin:0;font-size:20px">SafeHer emergency alert</h1>
  </div>
  <div style="border:1px solid #e6ecea;border-top:0;padding:24px;border-radius:0 0 16px 16px">
    <p style="margin:0 0 12px">Hello ${contactName},</p>
    <p style="margin:0 0 12px"><strong>${input.reporterName}</strong> has triggered an SOS alert on SafeHer and listed you as an emergency contact.</p>
    <p style="margin:0 0 12px"><strong>Message:</strong> ${input.message}</p>
    ${location}
    ${input.reporterPhone ? `<p style="margin:0 0 12px"><strong>Their phone:</strong> ${input.reporterPhone}</p>` : ""}
    <p style="margin:16px 0 0;color:#6b7c93;font-size:13px">Please try to reach them immediately. If you cannot, contact local emergency services.</p>
  </div>
</div>`;
}

export async function sendSosEmails(input: SosEmailInput): Promise<{ sent: number; error: string | null }> {
  const recipients = input.contacts.filter((contact) => !!contact.email);
  if (recipients.length === 0) return { sent: 0, error: null };

  const resendKey = process.env.RESEND_API_KEY;
  const lovableKey = process.env.LOVABLE_API_KEY;
  if (!resendKey || !lovableKey) {
    return { sent: 0, error: "Email alerts are not configured yet, so contacts were not emailed." };
  }

  let sent = 0;
  let error: string | null = null;

  for (const contact of recipients) {
    try {
      const response = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${lovableKey}`,
          "X-Connection-Api-Key": resendKey,
        },
        body: JSON.stringify({
          from: "SafeHer Alerts <onboarding@resend.dev>",
          to: [contact.email],
          subject: `Emergency SOS from ${input.reporterName}`,
          html: emailHtml(input, contact.name),
        }),
      });
      if (!response.ok) {
        error = `Email provider error (${response.status}): ${(await response.text().catch(() => "")).slice(0, 200)}`;
        continue;
      }
      sent += 1;
    } catch (cause) {
      error = cause instanceof Error ? cause.message : "Email delivery failed.";
    }
  }

  return { sent, error };
}
