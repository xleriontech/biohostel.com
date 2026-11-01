import { readableOn } from "@/lib/site-settings";

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export type MicrositeThemeInput = { primary?: string; accent?: string };

/**
 * Los micrositios se ven como el sitio propio del cliente: sus tokens se derivan de
 * listing.theme y pisan los de la plataforma, que viven en :root con !important.
 */
export function micrositeThemeCss({ primary, accent }: MicrositeThemeInput): string {
  const p = typeof primary === "string" && HEX.test(primary.trim()) ? primary.trim() : "#3f3f46";
  const a = typeof accent === "string" && HEX.test(accent.trim()) ? accent.trim() : "#e4e4e7";
  const deep = `color-mix(in srgb, ${p} 76%, black)`;
  const heading = `color-mix(in srgb, ${p} 82%, black)`;
  const ink = `color-mix(in srgb, ${p} 24%, #16181a)`;
  const muted = `color-mix(in srgb, ${p} 38%, #6b7280)`;
  const background = `color-mix(in srgb, ${p} 4%, #ffffff)`;
  const surface2 = `color-mix(in srgb, ${p} 7%, #ffffff)`;
  const line = `color-mix(in srgb, ${p} 16%, #ffffff)`;
  const tint = `color-mix(in srgb, ${p} 10%, #ffffff)`;
  const onPrimary = readableOn(p) === "#ffffff" ? "#ffffff" : heading;

  const tokens = [
    "color-scheme: light;",
    `--green:${p};`,
    `--eyebrow:${p};`,
    `--green-deep:${deep};`,
    `--emerald:${a};`,
    `--sage:${a};`,
    `--lime:${a};`,
    `--cream:${background};`,
    `--warm-cream:${background};`,
    `--paper:color-mix(in srgb, ${background} 92%, ${p});`,
    `--sand:color-mix(in srgb, ${background} 86%, ${p});`,
    `--muted:${muted};`,
    `--line:${line};`,
    `--surface:#ffffff;`,
    `--surface-2:${surface2};`,
    `--ink:${ink};`,
    `--heading:${heading};`,
    `--tint:${tint};`,
    `--warn:#fdf1d6;`,
    `--header:color-mix(in srgb, ${background} 88%, transparent);`,
    `--radius-card:18px;`,
    `--radius-btn:12px;`,
    `--radius-input:10px;`,
    `--ms-on-primary:${onPrimary};`,
    `--ms-primary-solid:linear-gradient(135deg, ${p}, ${deep});`,
  ];

  return [
    ".ms-theme.ms-theme{",
    tokens.map((token) => `${token.replace(/;$/, "!important;")}`).join(""),
    "}",
    `.ms-theme.ms-theme .btn-green{background:var(--ms-primary-solid)!important;color:var(--ms-on-primary)!important;}`,
    `.ms-theme.ms-theme .btn-green:hover{background:var(--green-deep)!important;}`,
    `.ms-theme.ms-theme .pill.on{background:var(--ms-primary-solid)!important;color:var(--ms-on-primary)!important;border-color:transparent!important;}`,
    `.ms-theme.ms-theme .toast{background:var(--green-deep)!important;color:var(--lime)!important;}`,
    `.ms-theme.ms-theme .tag-reserva{background:var(--tint)!important;color:var(--green-deep)!important;}`,
  ].join("");
}
