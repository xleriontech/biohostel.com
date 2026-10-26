import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { requireAdmin } from "@/lib/server-auth";
import { DEFAULT_SITE_SETTINGS, mergeSiteSettings } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await requireAdmin();
  if ("error" in gate) return NextResponse.json({ error: gate.error }, { status: gate.status });
  return NextResponse.json({ settings: await store.siteSettings(), defaults: DEFAULT_SITE_SETTINGS });
}

export async function PATCH(req: Request) {
  const gate = await requireAdmin();
  if ("error" in gate) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const body = await req.json().catch(() => ({}));
  const current = await store.siteSettings();
  const settings = mergeSiteSettings(body, current);
  settings.updatedAt = new Date().toISOString();
  await store.saveSiteSettings(settings);
  return NextResponse.json({ settings });
}

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if ("error" in gate) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const { action } = await req.json().catch(() => ({}));
  if (action !== "reset") return NextResponse.json({ error: "Acción inválida." }, { status: 400 });
  const settings = mergeSiteSettings(DEFAULT_SITE_SETTINGS);
  settings.updatedAt = new Date().toISOString();
  await store.saveSiteSettings(settings);
  return NextResponse.json({ settings });
}
