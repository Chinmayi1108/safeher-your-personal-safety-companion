const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1";
const CHAT_MODEL = "google/gemini-3.5-flash";
const TRANSCRIBE_MODEL = "openai/gpt-4o-mini-transcribe";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

function apiKey(): string {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("The AI service is not configured yet.");
  return key;
}

function describeStatus(status: number, body: string): string {
  if (status === 429) return "The AI service is busy right now. Please try again in a moment.";
  if (status === 402) return "AI credits have run out. Please top up to keep using AI features.";
  if (status === 403 || status === 404) return "AI features are not enabled for this workspace.";
  return `AI request failed (${status}): ${body.slice(0, 300)}`;
}

export async function chatCompletion(messages: ChatMessage[], temperature = 0.4): Promise<string> {
  const response = await fetch(`${GATEWAY_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: CHAT_MODEL, messages, temperature }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(describeStatus(response.status, body));
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("The AI returned an empty response. Please try again.");
  return content;
}

export async function transcribeAudio(bytes: Uint8Array, fileName: string, mimeType: string): Promise<string> {
  const form = new FormData();
  form.append("model", TRANSCRIBE_MODEL);
  form.append("file", new Blob([bytes as unknown as BlobPart], { type: mimeType }), fileName);

  const response = await fetch(`${GATEWAY_URL}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey()}` },
    body: form,
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(describeStatus(response.status, body));
  }

  const payload = (await response.json()) as { text?: string };
  const text = payload.text?.trim();
  if (!text) throw new Error("We could not hear anything in that recording. Please record again.");
  return text;
}

export function reportSystemPrompt(): string {
  return [
    "You are SafeHer's incident documentation assistant.",
    "You turn a survivor's account into a clear, factual, professional incident report that can be handed to police or legal support.",
    "Rules: never invent facts, never add legal conclusions, keep a calm and respectful tone,",
    "mark anything the user did not provide as 'Not provided'.",
    "Return plain text (no markdown symbols) using exactly these sections:",
    "INCIDENT REPORT",
    "1. Summary",
    "2. Date and Time",
    "3. Location",
    "4. Detailed Account",
    "5. Suspect Description",
    "6. Evidence Attached",
    "7. Impact on the Complainant",
    "8. Requested Action",
  ].join(" ");
}

export function assistantSystemPrompt(): string {
  return [
    "You are SafeHer's safety assistant, supporting women who may be distressed.",
    "Be warm, brief and practical. Use short paragraphs and simple language.",
    "Always prioritise immediate physical safety; if there is danger right now, tell the user to press the SOS button or call emergency services (112 / 100 / 1091).",
    "You can explain how to document an incident, what evidence helps, how to file a police complaint, and general safety planning.",
    "You are not a lawyer or therapist; suggest professional help when appropriate. Never ask for passwords or financial details.",
  ].join(" ");
}
