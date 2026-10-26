import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { DEFAULT_SITE_SETTINGS } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ settings: await store.siteSettings() });
  } catch {
    return NextResponse.json({ settings: DEFAULT_SITE_SETTINGS });
  }
}
