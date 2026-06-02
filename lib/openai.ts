import OpenAI from "openai";
import { getAgentContext } from "@/lib/queries";

export const AGENT_MODEL = "gpt-5-mini";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPT = `You are the assistant built into the Site Maturity Dashboard, a tool that tracks how far each customer site has progressed through a four-phase robot-deployment maturity model. The goal of the dashboard is to make it visible where on-site 4am shifts can safely be reduced.

Answer questions using ONLY the data provided in the DASHBOARD DATA block below. Treat that data as the single source of truth. Do not invent sites, numbers, or events. If a question cannot be answered from the data, say so plainly and explain what is missing.

Rules:
- Use the provided reference date for any "how long" or "in the last N days" reasoning. Never use today's real date.
- The phase progression criteria and the readiness computation are already in the data. When asked why a site has not progressed, cite its unmet criteria and its blockers.
- When asked about 4am shift reductions, reason from the readiness data: a site can only reduce on-site 4am coverage once it is genuinely eligible to progress (ready_now = true). If no site is eligible, say zero and explain why.
- Be concise and operational. Lead with the answer, then the supporting detail. Use British spelling. Do not use em-dashes in prose. Avoid filler and hedge words.
- Numbers like autonomy are stored as fractions (0.85 = 85%). Present them as percentages.`;

function buildContextMessage(): string {
  const context = getAgentContext();
  return `DASHBOARD DATA (JSON, the only source of truth):\n${JSON.stringify(
    context
  )}`;
}

export async function runAgent(history: ChatMessage[]): Promise<string> {
  const client = new OpenAI();

  const response = await client.chat.completions.create({
    model: AGENT_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "system", content: buildContextMessage() },
      ...history.map((m) => ({ role: m.role, content: m.content })),
    ],
  });

  return (
    response.choices[0]?.message?.content?.trim() ??
    "I could not produce an answer for that."
  );
}
