"use client";

import { CURRENCIES, useCurrency } from "@/lib/currency";

export function CurrencySelect() {
  const { code, setCode, live, ratesDate } = useCurrency();
  const cur = CURRENCIES.find((c) => c.code === code)!;
  return (
    <span title={live ? `Tasa del día ${ratesDate} (en vivo)` : "Tasa de referencia (sin conexión)"} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <select
        value={code}
        onChange={(e) => setCode(e.target.value)}
        aria-label="Moneda"
        style={{ height: 42, border: "1px solid var(--line)", borderRadius: 10, padding: "0 8px", background: "var(--surface)", color: "var(--ink)", fontWeight: 700, cursor: "pointer" }}
      >
        {CURRENCIES.map((c) => (
          <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
        ))}
      </select>
      <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: live ? "var(--green)" : "#b0b8b0" }} title={live ? "Tasa del día en vivo" : `${cur.nombre} · tasa de referencia`} />
    </span>
  );
}
