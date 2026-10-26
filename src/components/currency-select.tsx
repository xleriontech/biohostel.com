"use client";
import { useState } from "react";
import { CURRENCIES } from "@/lib/currencies";

export function CurrencySelect() {
  const [currency, setCurrency] = useState(CURRENCIES[0]?.code || "COP");
  return (
    <select
      value={currency}
      onChange={(e) => setCurrency(e.target.value)}
      style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface-2)", color: "var(--ink)", fontSize: 13 }}
    >
      {CURRENCIES.map((c) => (
        <option key={c.code} value={c.code}>{c.code} · {c.nombre}</option>
      ))}
    </select>
  );
}