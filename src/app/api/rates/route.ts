import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { FALLBACK_RATES } from "@/lib/currencies";

export const dynamic = "force-dynamic";

const WANT = ["USD", "EUR", "MXN", "BRL", "ARS", "CLP", "PEN", "GBP", "CAD", "JPY", "CHF"];
const CACHE_FILE = path.join(process.cwd(), ".data", "rates.json");
const TTL_MS = 12 * 3600 * 1000;

async function readCache() {
  try {
    const raw = JSON.parse(await fs.readFile(CACHE_FILE, "utf8"));
    if (raw?.rates && Date.now() - raw.fetchedAt < TTL_MS) return raw;
  } catch { /* sin caché */ }
  return null;
}

export async function GET() {
  const cached = await readCache();
  if (cached) return NextResponse.json({ base: "COP", rates: cached.rates, date: cached.date, live: true, cached: true });

  try {
    const res = await fetch("https://open.er-api.com/v6/latest/COP", { signal: AbortSignal.timeout(10000) });
    const d = await res.json();
    if (d?.result !== "success" || !d?.rates) throw new Error("API sin datos");
    // er-api da unidades extranjeras por 1 COP → invertimos a COP por unidad
    const rates: Record<string, number> = {};
    for (const code of WANT) {
      const perCop = Number(d.rates[code]);
      if (perCop > 0) rates[code] = 1 / perCop;
    }
    const date: string = d.time_last_update_utc ?? new Date().toUTCString();
    await fs.mkdir(path.dirname(CACHE_FILE), { recursive: true });
    await fs.writeFile(CACHE_FILE, JSON.stringify({ rates, date, fetchedAt: Date.now() }));
    return NextResponse.json({ base: "COP", rates, date, live: true, cached: false });
  } catch {
    return NextResponse.json({ base: "COP", rates: FALLBACK_RATES, date: "referencia", live: false, cached: false });
  }
}
