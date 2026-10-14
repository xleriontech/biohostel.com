import { NextResponse } from "next/server";
import { readTable, writeTable } from "@/lib/storage";
import { FALLBACK_RATES } from "@/lib/currencies";

export const dynamic = "force-dynamic";

const WANT = ["USD", "EUR", "MXN", "BRL", "ARS", "CLP", "PEN", "GBP", "CAD", "JPY", "CHF"];
const TTL_MS = 12 * 3600 * 1000;

type CacheRow = { rates: Record<string, number>; date: string; fetchedAt: number };

export async function GET() {
  try {
    const cached = (await readTable<CacheRow>("rates-cache", () => []))[0];
    if (cached && Date.now() - cached.fetchedAt < TTL_MS) {
      return NextResponse.json({ base: "COP", rates: cached.rates, date: cached.date, live: true, cached: true });
    }
  } catch { /* sigue a live */ }

  try {
    const res = await fetch("https://open.er-api.com/v6/latest/COP", { signal: AbortSignal.timeout(10000) });
    const d = await res.json();
    if (d?.result !== "success" || !d?.rates) throw new Error("API sin datos");
    const rates: Record<string, number> = {};
    for (const code of WANT) {
      const perCop = Number(d.rates[code]);
      if (perCop > 0) rates[code] = 1 / perCop;
    }
    const date: string = d.time_last_update_utc ?? new Date().toUTCString();
    await writeTable("rates-cache", [{ rates, date, fetchedAt: Date.now() }]).catch(() => null);
    return NextResponse.json({ base: "COP", rates, date, live: true, cached: false });
  } catch {
    return NextResponse.json({ base: "COP", rates: FALLBACK_RATES, date: "referencia", live: false, cached: false });
  }
}
