import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { requireAdmin } from "@/lib/server-auth";
import { PROVIDERS, testConnection } from "@/lib/ai";

function masked(cfg: { provider: string; model: string; apiKey: string; baseUrl: string; updatedAt: string }) {
  const meta = PROVIDERS.find((p) => p.id === cfg.provider);
  return {
    provider: cfg.provider,
    model: cfg.model || meta?.defaultModel || "",
    hasKey: cfg.apiKey.length > 0,
    keyHint: cfg.apiKey ? `••••${cfg.apiKey.slice(-4)}` : "",
    baseUrl: cfg.baseUrl || meta?.baseUrl || "",
    updatedAt: cfg.updatedAt,
    providers: PROVIDERS,
  };
}

export async function GET() {
  const gate = await requireAdmin();
  if ("error" in gate) return NextResponse.json({ error: gate.error }, { status: gate.status });
  return NextResponse.json({ config: masked(await store.aiConfig()) });
}

export async function PATCH(req: Request) {
  const gate = await requireAdmin();
  if ("error" in gate) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const { provider, model, apiKey, baseUrl } = await req.json().catch(() => ({}));
  const meta = PROVIDERS.find((p) => p.id === provider);
  if (!meta) return NextResponse.json({ error: "Proveedor inválido." }, { status: 400 });
  const prev = await store.aiConfig();
  const next = {
    provider,
    model: String(model ?? prev.model ?? ""),
    apiKey: typeof apiKey === "string" && apiKey.length ? apiKey : prev.apiKey,
    baseUrl: String(baseUrl ?? prev.baseUrl ?? ""),
    updatedAt: new Date().toISOString(),
  };
  await store.saveAiConfig(next);
  return NextResponse.json({ config: masked(next) });
}

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if ("error" in gate) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const { action, provider, model, apiKey, baseUrl } = await req.json().catch(() => ({}));
  if (action !== "test") return NextResponse.json({ error: "Acción inválida." }, { status: 400 });
  const saved = await store.aiConfig();
  try {
    const reply = await testConnection(
      provider ?? saved.provider,
      model ?? saved.model,
      apiKey ?? saved.apiKey,
      baseUrl ?? saved.baseUrl,
    );
    return NextResponse.json({ ok: true, reply });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "Falló la conexión." }, { status: 502 });
  }
}
