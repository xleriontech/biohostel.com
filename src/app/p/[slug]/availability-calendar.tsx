"use client";

import React from "react";
import { toISODate } from "@/lib/dates";

interface AvailabilityCalendarProps {
  listing: {
    fechasOcupadasBooking?: string[];
    fechasOcupadasAirbnb?: string[];
  };
}

function AvailabilityCalendar({ listing }: AvailabilityCalendarProps) {
  const [viewDate, setViewDate] = React.useState(new Date());
  const ocupadas = new Set([...(listing.fechasOcupadasBooking ?? []), ...(listing.fechasOcupadasAirbnb ?? [])]);

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const isOccupied = (d: Date) => ocupadas.has(toISODate(d));
  const isToday = (d: Date) => d.getTime() === todayStart.getTime();
  const isPast = (d: Date) => d < todayStart;

  const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = new Date(year, month - 1, 1);
  const nextMonth = new Date(year, month + 1, 1);

  const cellStyle = (date: Date): React.CSSProperties => {
    const base: React.CSSProperties = {
      border: "1px solid var(--line)",
      borderRadius: "50%",
      width: 36,
      height: 36,
      lineHeight: "34px",
      margin: "2px auto",
      fontSize: 12,
      fontWeight: 600,
      background: "var(--surface)",
      color: "var(--ink)",
    };
    if (isOccupied(date)) return { ...base, background: "#fee2e2", borderColor: "#fecaca", color: "#991b1b" };
    if (isPast(date)) return { ...base, background: "var(--surface-2)", color: "var(--muted)", fontWeight: 500 };
    if (isToday(date)) return { ...base, border: "2px solid var(--green)", color: "var(--green)", fontWeight: 800, lineHeight: "32px" };
    return base;
  };

  const legendDot: React.CSSProperties = {
    display: "inline-block",
    width: 10,
    height: 10,
    borderRadius: 3,
    marginRight: 6,
    verticalAlign: "middle",
  };

  return (
    <section className="availability-calendar">
      <h3 style={{ fontFamily: "var(--display)", fontWeight: 700, color: "var(--heading)", marginBottom: 12 }}>Disponibilidad</h3>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <button
          onClick={() => setViewDate(prevMonth)}
          className="btn btn-ghost btn-small"
          style={{ padding: "6px 12px", fontSize: "12px" }}
        >
          ←
        </button>
        <span style={{ fontWeight: 700, fontSize: "14px", color: "var(--ink)" }}>
          {monthNames[month]} {year}
        </span>
        <button
          onClick={() => setViewDate(nextMonth)}
          className="btn btn-ghost btn-small"
          style={{ padding: "6px 12px", fontSize: "12px" }}
        >
          →
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, textAlign: "center", maxWidth: 420, margin: "0 auto" }}>
        {["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"].map((d) => (
          <span key={d} style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 700 }}>{d}</span>
        ))}
        {Array.from({ length: firstDay === 0 ? 6 : firstDay - 1 }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const date = new Date(year, month, i + 1);

          return (
            <div key={toISODate(date)} style={cellStyle(date)}>
              {i + 1}
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 12, fontSize: 12, color: "var(--muted)" }}>
        <span><span style={{ ...legendDot, background: "var(--surface)", border: "1px solid var(--line)" }} />Disponible</span>
        <span><span style={{ ...legendDot, background: "#fee2e2", border: "1px solid #fecaca" }} />Ocupado</span>
        <span><span style={{ ...legendDot, background: "var(--surface)", border: "2px solid var(--green)" }} />Hoy</span>
      </div>
    </section>
  );
}

export default AvailabilityCalendar;
