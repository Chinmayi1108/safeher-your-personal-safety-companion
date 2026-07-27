import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface ReportDraftInput {
  title: string;
  incidentType: string;
  description: string;
  occurredAt: string | null;
  location: string | null;
  suspectDetails: string | null;
  evidence: Array<{ kind: string; fileName: string }>;
  reporterName: string | null;
}

export const generateIncidentReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: ReportDraftInput) => {
    if (!input || typeof input.description !== "string" || input.description.trim().length < 15) {
      throw new Error("Please describe the incident in at least a couple of sentences.");
    }
    return input;
  })
  .handler(async ({ data }) => {
    const { chatCompletion, reportSystemPrompt } = await import("./ai-gateway.server");
    const evidenceLines = data.evidence.length
      ? data.evidence.map((item, index) => `${index + 1}. ${item.kind}: ${item.fileName}`).join("\n")
      : "None uploaded";

    const report = await chatCompletion([
      { role: "system", content: reportSystemPrompt() },
      {
        role: "user",
        content: [
          `Complainant: ${data.reporterName || "Not provided"}`,
          `Report title: ${data.title || "Not provided"}`,
          `Incident type: ${data.incidentType}`,
          `Date and time: ${data.occurredAt || "Not provided"}`,
          `Location: ${data.location || "Not provided"}`,
          `Suspect details: ${data.suspectDetails || "Not provided"}`,
          `Evidence files:\n${evidenceLines}`,
          `Account in the complainant's own words:\n${data.description}`,
        ].join("\n\n"),
      },
    ]);

    return { report };
  });

export const askAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { messages: Array<{ role: "user" | "assistant"; content: string }> }) => {
    if (!input?.messages?.length) throw new Error("Please type a question first.");
    return { messages: input.messages.slice(-14) };
  })
  .handler(async ({ data }) => {
    const { chatCompletion, assistantSystemPrompt } = await import("./ai-gateway.server");
    const reply = await chatCompletion(
      [{ role: "system" as const, content: assistantSystemPrompt() }, ...data.messages],
      0.6,
    );
    return { reply };
  });

export const transcribeComplaint = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { audioBase64: string; mimeType: string }) => {
    if (!input?.audioBase64 || input.audioBase64.length < 2000) {
      throw new Error("That recording was too short. Please record again.");
    }
    if (input.audioBase64.length > 12_000_000) {
      throw new Error("That recording is too long. Please keep it under about 3 minutes.");
    }
    return input;
  })
  .handler(async ({ data }) => {
    const { transcribeAudio } = await import("./ai-gateway.server");
    const binary = Uint8Array.from(atob(data.audioBase64), (char) => char.charCodeAt(0));
    const text = await transcribeAudio(binary, "complaint.wav", data.mimeType || "audio/wav");
    return { text };
  });
