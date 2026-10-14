import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET() {
  try {
    return NextResponse.json({ config: await store.config() });
  } catch {
    return NextResponse.json({ config: { rates: { gratuito: 0.1, corporativo: 0.05, premium: 0 } } });
  }
}
