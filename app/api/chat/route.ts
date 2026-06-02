import { NextResponse } from "next/server";
import { runAgent, type ChatMessage } from "@/lib/openai";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Cost protection: cap queries per client over a rolling 24h window.
// In-memory is fine for a single-instance prototype; it resets on redeploy.
const MAX_QUERIES = 100;
const WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_MESSAGES = 12;
const MAX_CONTENT_LENGTH = 4000;

const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimit(key: string): { ok: boolean; remaining: number } {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, remaining: MAX_QUERIES - 1 };
  }
  if (entry.count >= MAX_QUERIES) {
    return { ok: false, remaining: 0 };
  }
  entry.count += 1;
  return { ok: true, remaining: MAX_QUERIES - entry.count };
}

function clientKey(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "The agent is not configured (no OPENAI_API_KEY set)." },
      { status: 503 }
    );
  }

  const { ok, remaining } = rateLimit(clientKey(request));
  if (!ok) {
    return NextResponse.json(
      { error: "Query limit reached for this session. Try again later." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const messages = (body as { messages?: unknown }).messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: "Provide a non-empty messages array." },
      { status: 400 }
    );
  }

  const history: ChatMessage[] = messages
    .slice(-MAX_MESSAGES)
    .filter(
      (m): m is ChatMessage =>
        !!m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0
    )
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CONTENT_LENGTH) }));

  if (history.length === 0 || history[history.length - 1].role !== "user") {
    return NextResponse.json(
      { error: "The last message must be from the user." },
      { status: 400 }
    );
  }

  try {
    const reply = await runAgent(history);
    return NextResponse.json({ reply, remaining });
  } catch (err) {
    console.error("Agent error:", err);
    return NextResponse.json(
      { error: "The agent failed to respond. Please try again." },
      { status: 502 }
    );
  }
}
