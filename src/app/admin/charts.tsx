"use client";

// Gráficos SVG propios (sin dependencias): barras, dona y línea.
const PALETTE = ["#16a34a", "#0ea5e9", "#f59e0b", "#8b5cf6", "#ef4444", "#14b8a6"];

export function BarChart({ data, height = 180 }: { data: { label: string; value: number; color?: string }[]; height?: number }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const w = 420;
  if (!data.length) {
    return (
      <svg viewBox={`0 0 ${w} 214`} style={{ width: "100%", height: "auto" }} role="img">
        <text x={w / 2} y={100} textAnchor="middle" fontSize={12} fill="currentColor" opacity={0.6}>Sin datos todavía</text>
      </svg>
    );
  }
  const bw = Math.min(56, (w - 20) / Math.max(1, data.length) - 10);
  return (
    <svg viewBox={`0 0 ${w} ${height + 34}`} style={{ width: "100%", height: "auto" }} role="img">
      {data.map((d, i) => {
        const h = Math.max(3, (d.value / max) * height);
        const x = 10 + i * ((w - 20) / data.length) + ((w - 20) / data.length - bw) / 2;
        return (
          <g key={d.label}>
            <rect x={x} y={height - h} width={bw} height={h} rx={6} fill={d.color ?? PALETTE[i % PALETTE.length]} />
            <text x={x + bw / 2} y={height - h - 6} textAnchor="middle" fontSize={12} fontWeight={700} fill="currentColor">{d.value}</text>
            <text x={x + bw / 2} y={height + 18} textAnchor="middle" fontSize={10} fill="currentColor" opacity={0.75}>{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function DonutChart({ data, size = 180 }: { data: { label: string; value: number; color?: string }[]; size?: number }) {
  const total = Math.max(1, data.reduce((s, d) => s + d.value, 0));
  const R = 60;
  const C = 2 * Math.PI * R;
  let acc = 0;
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
      <svg width={size} height={size} viewBox="0 0 160 160" role="img">
        <circle cx={80} cy={80} r={R} fill="none" stroke="var(--line)" strokeWidth={26} />
        {data.map((d, i) => {
          const frac = d.value / total;
          const el = (
            <circle
              key={d.label}
              cx={80}
              cy={80}
              r={R}
              fill="none"
              stroke={d.color ?? PALETTE[i % PALETTE.length]}
              strokeWidth={26}
              strokeDasharray={`${frac * C} ${C}`}
              strokeDashoffset={-acc * C}
              transform="rotate(-90 80 80)"
            />
          );
          acc += frac;
          return el;
        })}
        <text x={80} y={76} textAnchor="middle" fontSize={22} fontWeight={800} fill="currentColor">{total}</text>
        <text x={80} y={94} textAnchor="middle" fontSize={10} fill="currentColor" opacity={0.7}>total</text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
        {data.map((d, i) => (
          <span key={d.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <i style={{ width: 12, height: 12, borderRadius: 4, background: d.color ?? PALETTE[i % PALETTE.length] }} />
            {d.label} <strong>{d.value}</strong>
          </span>
        ))}
      </div>
    </div>
  );
}

export function LineChart({ data, height = 160 }: { data: { label: string; value: number }[]; height?: number }) {
  const w = 420;
  if (!data.length) {
    return (
      <svg viewBox={`0 0 ${w} ${height + 30}`} style={{ width: "100%", height: "auto" }} role="img">
        <text x={w / 2} y={height / 2} textAnchor="middle" fontSize={12} fill="currentColor" opacity={0.6}>Sin datos todavía</text>
      </svg>
    );
  }
  const max = Math.max(1, ...data.map((d) => d.value));
  const pts = data.map((d, i) => {
    const x = data.length === 1 ? w / 2 : 14 + (i * (w - 28)) / (data.length - 1);
    const y = height - 8 - (d.value / max) * (height - 30);
    return { x, y, ...d };
  });
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${height + 30}`} style={{ width: "100%", height: "auto" }} role="img">
      <path d={`${line} L${w - 14},${height - 8} L14,${height - 8} Z`} fill="#16a34a22" />
      <path d={line} fill="none" stroke="#16a34a" strokeWidth={2.5} strokeLinecap="round" />
      {pts.map((p) => (
        <g key={p.label}>
          <circle cx={p.x} cy={p.y} r={4} fill="var(--surface)" stroke="#16a34a" strokeWidth={2.5} />
          <text x={p.x} y={height + 20} textAnchor="middle" fontSize={10} fill="currentColor" opacity={0.75}>{p.label}</text>
        </g>
      ))}
    </svg>
  );
}

// Exportación CSV / JSON del lado cliente
export function downloadCSV(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const heads = Object.keys(rows[0]);
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [heads.join(","), ...rows.map((r) => heads.map((h) => esc(r[h])).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }));
  triggerDownload(url, filename);
}

export function downloadJSON(filename: string, data: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  triggerDownload(url, filename);
}

function triggerDownload(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
