import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import { Send } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHead } from "@/components/layout/PageHead";
import { Button } from "@/components/common/Button";
import { askAssistant } from "@/lib/ai.functions";
import { errorMessage } from "@/utils/format";

export const Route = createFileRoute("/_authenticated/assistant")({
  head: () => ({
    meta: [
      { title: "SafeHer AI assistant" },
      { name: "description", content: "Ask SafeHer about safety planning, evidence and how to file a complaint." },
      { property: "og:title", content: "SafeHer AI assistant" },
      { property: "og:description", content: "Calm, practical safety guidance any time." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Assistant,
});

type Message = { role: "user" | "assistant"; content: string };

const starters = [
  "How do I file a police complaint for harassment?",
  "What evidence should I collect?",
  "I feel unsafe walking home — what should I do?",
];

function Assistant() {
  const ask = useServerFn(askAssistant);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi, I'm SafeHer. I can help you plan for safety, understand your options, or prepare a complaint. If you are in danger right now, please use the SOS button or call 112.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    const next: Message[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const { reply } = await ask({ data: { messages: next.filter((m) => m.role !== "assistant" || m.content) } });
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="container page">
        <PageHead title="SafeHer assistant" subtitle="Private guidance, available any time." />
        <div className="chat-thread">
          {messages.map((message, index) => (
            <div key={index} className={`bubble ${message.role === "user" ? "bubble-user" : "bubble-ai"}`}>
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          ))}
          {busy ? <div className="bubble bubble-ai">Thinking…</div> : null}
        </div>

        {messages.length === 1 ? (
          <div className="row wrap mt-sm">
            {starters.map((starter) => (
              <button key={starter} className="chip" onClick={() => void send(starter)}>
                {starter}
              </button>
            ))}
          </div>
        ) : null}

        <form
          className="chat-composer"
          onSubmit={(event) => {
            event.preventDefault();
            void send(input);
          }}
        >
          <input
            className="input"
            placeholder="Ask anything about your safety…"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            aria-label="Message"
          />
          <Button type="submit" loading={busy} aria-label="Send" icon={<Send size={18} />}>
            Send
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
