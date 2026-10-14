import { useCallback, useEffect, useState } from "react";
import { CURRENCIES, FALLBACK_RATES } from "./currencies";

export type { Currency } from "./currencies";
export { CURRENCIES };

let current = "COP";
let rates: Record<string, number> = FALLBACK_RATES;
let ratesDate = "";
let live = false;
const listeners = new Set<() => void>();
let fetching = false;

function emit() {
  listeners.forEach((fn) => fn());
}

export function getCurrency() {
  return current;
}

export function isLiveRates() {
  return live;
}

export function getRatesDate() {
  return ratesDate;
}

export function setCurrency(code: string) {
  if (!CURRENCIES.some((c) => c.code === code)) return;
  current = code;
  try {
    localStorage.setItem("bio-currency", code);
    document.documentElement.dataset.currency = code;
  } catch { /* noop */ }
  emit();
}

// Determinístico: mismos inputs → mismo texto (sin hydration mismatch)
export function formatMoney(copAmount: number, code: string = current) {
  const c = CURRENCIES.find((x) => x.code === code) ?? CURRENCIES[0];
  const rate = rates[c.code] || FALLBACK_RATES[c.code] || 1;
  const value = copAmount / rate;
  try {
    return new Intl.NumberFormat(c.locale, {
      style: "currency",
      currency: c.code,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${c.code} ${Math.round(value).toString()}`;
  }
}

async function loadRates() {
  if (fetching) return;
  fetching = true;
  try {
    const res = await fetch("/api/rates", { cache: "no-store" });
    const d = await res.json();
    if (d?.rates) {
      rates = { COP: 1, ...d.rates };
      ratesDate = d.date ?? "";
      live = !!d.live;
      try {
        localStorage.setItem("bio-rates", JSON.stringify({ rates, ratesDate }));
      } catch { /* noop */ }
      emit();
    }
  } catch { /* usa respaldo */ } finally {
    fetching = false;
  }
}

export function useCurrency() {
  const [, tick] = useState(0);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("bio-currency");
      if (saved && CURRENCIES.some((c) => c.code === saved)) current = saved;
      const cached = localStorage.getItem("bio-rates");
      if (cached) {
        const c = JSON.parse(cached);
        if (c?.rates) { rates = { COP: 1, ...c.rates }; ratesDate = c.ratesDate ?? ""; }
      }
    } catch { /* noop */ }
    const fn = () => tick((n) => n + 1);
    listeners.add(fn);
    loadRates();
    return () => { listeners.delete(fn); };
  }, []);
  const fmt = useCallback((cop: number) => formatMoney(cop, current), [current]);
  return { code: current, setCode: setCurrency, fmt, live, ratesDate };
}
