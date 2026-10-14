import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { requireAdmin } from "@/lib/server-auth";

export async function GET() {
  const gate = await requireAdmin();
  if ("error" in gate) return NextResponse.json({ error: gate.error }, { status: gate.status });
  return NextResponse.json({ config: await store.config() });
}

export async function PATCH(req: Request) {
  const gate = await requireAdmin();
  if ("error" in gate) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const { rates } = await req.json().catch(() => ({}));
  const cfg = await store.config();
  for (const k of ["gratuito", "corporativo", "premium"] as const) {
    const v = Number(rates?.[k]);
    if (Number.isFinite(v) && v >= 0 && v <= 0.5) cfg.rates[k] = v;
  }
  await store.saveConfig(cfg);
  return NextResponse.json({ config: cfg });
}
