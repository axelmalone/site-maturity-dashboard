"use client";

import { useRef, useState } from "react";
import { Send, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const EXAMPLES = [
  "How many sites are in Phase 2?",
  "What's the average autonomy across Phase 3 sites?",
  "Which sites have been in Phase 1 the longest?",
  "Which site is most ready to progress to Phase 2?",
  "How many 4am shifts could we drop this month if we progressed every eligible site?",
  "Why is Tesco Express Hammersmith still in Phase 1?",
];

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const next = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(next);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
      } else {
        setMessages([
          ...next,
          { role: "assistant", content: data.reply as string },
        ]);
      }
    } catch {
      setError("Could not reach the agent.");
    } finally {
      setLoading(false);
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: "smooth",
        });
      });
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <div
        ref={scrollRef}
        className="flex max-h-80 min-h-24 flex-col gap-3 overflow-y-auto"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col gap-2">
            <p className="text-muted-foreground text-sm">
              Ask in plain language. Answers are grounded in the dashboard data,
              not the model&apos;s general knowledge.
            </p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="bg-muted hover:bg-accent rounded-full px-3 py-1 text-xs"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                "max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
                m.role === "user"
                  ? "bg-primary text-primary-foreground self-end"
                  : "bg-muted self-start"
              )}
            >
              {m.content}
            </div>
          ))
        )}
        {loading && (
          <div className="text-muted-foreground flex items-center gap-2 self-start text-sm">
            <Loader2 className="size-4 animate-spin" /> Thinking…
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <form
        className="flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          rows={1}
          placeholder="Ask about site maturity, blockers, autonomy, 4am shifts…"
          className="border-input focus-visible:ring-ring max-h-32 min-h-9 flex-1 resize-none rounded-md border bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2"
        />
        <Button type="submit" size="icon" disabled={loading || !input.trim()}>
          <Send />
        </Button>
      </form>
    </div>
  );
}
