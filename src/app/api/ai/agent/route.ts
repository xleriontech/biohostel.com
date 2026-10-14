import { NextResponse } from "next/server";
import { agentTurn, type AgentMsg } from "@/lib/agent";

export async function POST(req: Request) {
  const { messages } = await req.json().catch(() => ({}));
  if (!Array.isArray(messages) || !messages.length) {
    return NextResponse.json({ error: "Sin mensajes." }, { status: 400 });
  }
  const clean: AgentMsg[] = messages
    .filter((m) => m && typeof m.text === "string")
    .slice(-10)
    .map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", text: m.text.slice(0, 500) }));
  const r = await agentTurn(clean);
  return NextResponse.json(r);
}
