import type { CSSProperties } from "react";

// Isotipo del manual de identidad: hoja + pin con nodos de sincronización.
// Los nodos usan el color de acento del sitio para que el admin pueda retintarlo.
export function BiohostelsMark({
  size = 32,
  invert = false,
  style,
}: {
  size?: number;
  invert?: boolean;
  style?: CSSProperties;
}) {
  const leaf = invert ? "#ffffff" : "currentColor";
  const core = invert ? "#0f3328" : "#ffffff";
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-hidden="true" style={{ display: "block", ...style }}>
      <path d="M50 8C32 8 18 22 18 40c0 18 17 38 32 52 15-14 32-34 32-52C82 22 68 8 50 8Z" fill={leaf} />
      <path d="M50 20c-12 0-22 10-22 22 0 12 12 24 22 34 10-10 22-22 22-34 0-12-10-22-22-22Z" fill={core} opacity={invert ? 0.3 : 0.2} />
      <path d="M50 30v34M50 44l-9-7M50 56l9-7" stroke={invert ? "#0f3328" : "currentColor"} strokeWidth={3.4} strokeLinecap="round" opacity={0.55} fill="none" />
      <g style={{ fill: "var(--emerald, #00c9a7)" }}>
        <circle cx="35" cy="35" r="3.6" />
        <circle cx="65" cy="45" r="3.6" />
        <circle cx="50" cy="24" r="3.6" />
      </g>
    </svg>
  );
}

// Sello de impacto del manual: anillo en Tierra Andina sobre verde profundo.
export function BiohostelsSeal({ size = 118 }: { size?: number }) {
  return (
    <div
      aria-label="1 reserva = 1 árbol"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: `2px solid color-mix(in srgb, var(--lime) 78%, transparent)`,
        display: "grid",
        placeItems: "center",
        textAlign: "center",
        gap: 2,
        padding: 8,
        background: "color-mix(in srgb, var(--lime) 10%, transparent)",
      }}
    >
      <BiohostelsMark size={Math.round(size * 0.26)} invert />
      <strong style={{ fontFamily: "var(--display)", fontSize: Math.round(size * 0.13), letterSpacing: "0.02em", lineHeight: 1.1 }}>
        1 RESERVA
      </strong>
      <span style={{ fontSize: Math.round(size * 0.095), letterSpacing: "0.14em", opacity: 0.78 }}>= 1 ÁRBOL</span>
    </div>
  );
}
