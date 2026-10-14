import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET() {
  const ads = (await store.ads()).filter((a) => a.active);
  return NextResponse.json({ ads });
}
