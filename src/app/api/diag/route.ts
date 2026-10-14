import { NextResponse } from "next/server";

// Diagnóstico sin secretos: indica qué ve el Worker en producción.
export async function GET() {
  const out: Record<string, unknown> = { ok: true, time: new Date().toISOString() };
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const env = ((await import("@opennextjs/cloudflare").then(() => getCloudflareContext()))?.env ?? {}) as Record<string, unknown>;
    const db = env.DB as { prepare?: unknown } | undefined;
    out.d1Bound = !!(db && typeof db.prepare === "function");
    out.hasSetupKey = typeof env.ADMIN_SETUP_KEY === "string" && (env.ADMIN_SETUP_KEY as string).length > 0;
    out.hasR2 = !!(env.UPLOADS && typeof (env.UPLOADS as { put?: unknown }).put === "function");
    if (out.d1Bound) {
      try {
        const d = db as { prepare: (q: string) => { bind: (...a: unknown[]) => { first: <T>(c?: string) => Promise<T | null> } } };
        const tables = await d.prepare("SELECT name FROM sqlite_master WHERE type='table'").bind().first<string>("name").catch(() => null);
        out.tablesProbe = tables ?? null;
        const all = await d.prepare("SELECT name FROM sqlite_master WHERE type='table'").bind();
        void all;
        out.kvRead = await d.prepare("SELECT v FROM kv_store WHERE k=?").bind("users").first<string>("v").then((v) => (typeof v === "string" ? `ok:${v.length}` : "empty")).catch((e: unknown) => `error:${e instanceof Error ? e.message.slice(0, 120) : "?"}`);
      } catch (e) {
        out.d1Error = e instanceof Error ? e.message.slice(0, 200) : "?";
      }
    }
  } catch (e) {
    out.ctxError = e instanceof Error ? e.message.slice(0, 200) : "?";
  }
  return NextResponse.json(out);
}
