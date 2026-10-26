export type FontPreset = "system" | "inter" | "geometric" | "humanist" | "rounded";
export type ThemeMode = "light" | "dark";
export type NavItem = { label: string; href: string };
export type SocialLink = { label: string; url: string };
export type LegalSection = { title: string; body: string };
export type LegalPage = { title: string; intro: string; sections: LegalSection[] };

export type SiteSettings = {
  brand: { name: string; suffix: string; logoUrl: string; tagline: string };
  announcement: string;
  hero: { eyebrow: string; title: string; highlight: string; subtitle: string; image: string };
  nav: NavItem[];
  footer: { text: string; contactEmail: string; links: NavItem[]; socials: SocialLink[] };
  design: {
    primary: string;
    primaryDeep: string;
    accent: string;
    lime: string;
    background: string;
    surface: string;
    ink: string;
    line: string;
    cardRadius: number;
    buttonRadius: number;
    inputRadius: number;
    font: FontPreset;
    defaultTheme: ThemeMode;
  };
  dark: { background: string; surface: string; ink: string; primary: string; accent: string; line: string };
  seo: { title: string; description: string; ogImage: string };
  modules: {
    plans: boolean;
    profiles: boolean;
    publicAds: boolean;
    sponsors: boolean;
    packs: boolean;
    assistant: boolean;
    currency: boolean;
    themeToggle: boolean;
  };
  legal: { terms: LegalPage; privacy: LegalPage; cookies: LegalPage };
  updatedAt: string;
};

export const FONT_PRESETS: { id: FontPreset; label: string }[] = [
  { id: "inter", label: "Inter / SF Pro" },
  { id: "system", label: "Sistema (Segoe UI / SF)" },
  { id: "geometric", label: "Geométrica (Avenir / Century Gothic)" },
  { id: "humanist", label: "Humanista (Optima / Candara)" },
  { id: "rounded", label: "Redondeada (Nunito / Trebuchet)" },
];

export const FONT_STACKS: Record<FontPreset, string> = {
  inter: `"Inter", "SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI Variable Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`,
  system: `-apple-system, BlinkMacSystemFont, "Segoe UI Variable Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`,
  geometric: `"Avenir Next", "Century Gothic", Futura, "Trebuchet MS", "Segoe UI", Roboto, sans-serif`,
  humanist: `Optima, Candara, "Segoe UI", "Helvetica Neue", Arial, sans-serif`,
  rounded: `"Nunito", "Avenir Next Rounded", "Trebuchet MS", "Segoe UI", Roboto, sans-serif`,
};

type Palette = Pick<
  SiteSettings["design"],
  "primary" | "primaryDeep" | "accent" | "lime" | "background" | "surface" | "ink" | "line"
>;

export const THEME_PRESETS: { id: string; label: string; light: Palette; dark: SiteSettings["dark"] }[] = [
  {
    id: "selva",
    label: "Selva",
    light: {
      primary: "#15803d",
      primaryDeep: "#0f2d1e",
      accent: "#10b981",
      lime: "#84cc16",
      background: "#f6f8f3",
      surface: "#ffffff",
      ink: "#0f1f17",
      line: "#d5e2d4",
    },
    dark: { background: "#09120d", surface: "#112018", ink: "#ecf7ee", primary: "#4ade80", accent: "#34d399", line: "#213d2b" },
  },
  {
    id: "oceano",
    label: "Océano",
    light: {
      primary: "#0e7490",
      primaryDeep: "#083344",
      accent: "#06b6d4",
      lime: "#67e8f9",
      background: "#f0f9ff",
      surface: "#ffffff",
      ink: "#0f172a",
      line: "#cbe7f1",
    },
    dark: { background: "#06151c", surface: "#0b2230", ink: "#e0f2fe", primary: "#22d3ee", accent: "#38bdf8", line: "#164e63" },
  },
  {
    id: "atardecer",
    label: "Atardecer",
    light: {
      primary: "#b45309",
      primaryDeep: "#3b1d06",
      accent: "#f59e0b",
      lime: "#fbbf24",
      background: "#fffbeb",
      surface: "#ffffff",
      ink: "#1c1917",
      line: "#f1e0bd",
    },
    dark: { background: "#1a1206", surface: "#2a1d0b", ink: "#fef3c7", primary: "#fbbf24", accent: "#f59e0b", line: "#4a3410" },
  },
  {
    id: "minimal",
    label: "Minimal",
    light: {
      primary: "#334155",
      primaryDeep: "#0f172a",
      accent: "#64748b",
      lime: "#94a3b8",
      background: "#f8fafc",
      surface: "#ffffff",
      ink: "#0f172a",
      line: "#e2e8f0",
    },
    dark: { background: "#0b1220", surface: "#141e30", ink: "#e2e8f0", primary: "#cbd5e1", accent: "#94a3b8", line: "#273449" },
  },
  {
    id: "bosque",
    label: "Bosque profundo",
    light: {
      primary: "#166534",
      primaryDeep: "#052e16",
      accent: "#22c55e",
      lime: "#a3e635",
      background: "#f3f7ee",
      surface: "#ffffff",
      ink: "#14251a",
      line: "#d3e3cd",
    },
    dark: { background: "#05110a", surface: "#0c2013", ink: "#e8f7ea", primary: "#86efac", accent: "#4ade80", line: "#1d4029" },
  },
];

const TERMS: LegalPage = {
  title: "Términos y Condiciones",
  intro: "Documento vigente a partir del 25 de octubre de 2026. Modificado a discreción de BioHostel Digital S.A.",
  sections: [
    { title: "1. Aceptación de los Términos", body: "Al acceder y utilizar BioHostel.com usted acepta los presentes términos. Si no está de acuerdo, no utilice el servicio." },
    { title: "2. Definición de Servicio", body: "BioHostel es un marketplace de alojamientos de temporada (reservas, departamentos, casas, habitaciones). El operador es BioHostel Digital S.A. constituido en Colombia." },
    { title: "3. Inscripción de Anfitriones", body: "Para publicar un alojamiento debe registrarse con correo, nombre, identificación y verificación de dominio de propiedad. Se solicita foto de cédula, constancia de propiedad y verificación de servicios." },
    { title: "4. Inscripción de Huéspedes", body: "El huésped debe ser mayor de 18 años, crear cuenta, reservar con datos verificados, pagar según las condiciones y respetar las normas de la casa." },
    { title: "5. Condiciones de la Reserva", body: "Reserva: fecha entrada/salida, número de huéspedes, servicios. Pago: seguro y total con anticipación según pauta de la plataforma. Cancelación según la Política de la Casa publicada." },
    { title: "6. Políticas del Anfitrión", body: "Cada casa publica: fecha de chequeo, claves, prohibiciones, lavandería, uso de cigarrillo, mascotas, normas de convivencia. El anfitrión debe mantener el alojamiento en condiciones adecuadas." },
    { title: "7. Seguridad y Privacidad", body: "Se recogen Datos Personales con el propósito de atender la reserva. No se comparten con terceros excepto proveedores contractuales. Acceso, rectificación y eliminación de datos disponibles en la sección de Privacidad." },
    { title: "8. Contenidos e Infracciones", body: "No se permiten publicaciones que contengan difamación, abuso, pornografía, armas, drogas o infracciones de orden público. Las publicaciones de las víctimas de la infidelidad tienen prioridad y no se permiten difundir sin consentimiento." },
    { title: "9. Propiedad Intelectual", body: "Todo el contenido del sitio (textos, imágenes, logos, marcas) es propiedad de BioHostel Digital S.A. Se otorga licencia personal y no exclusiva para uso de consulta." },
    { title: "10. Limitación de Responsabilidad", body: "La información es orientativa. BioHostel no se hace responsable de errores tipográficos, imprecisión de precios o disponibilidad fuera de fecha real. El anfitrión y huésped son responsables entre sí." },
    { title: "11. Fianzas y Resolución de Reclamos", body: "En virtud del Decreto 1065 de 2015, BioHostel opera en el marco de la resolución de conflictos en reservas turísticas y puede retener fianzas en casos de incumplimiento." },
    { title: "12. Derecho Aplicable", body: "Las presentes normas se rigen por la legislación colombiana. Todo litigio se presenta ante los tribunales competentes de la sede social." },
  ],
};

const PRIVACY: LegalPage = {
  title: "Política de Privacidad",
  intro: "Vigente a partir del 25 de octubre de 2026. Última actualización: 25 de octubre de 2026.",
  sections: [
    { title: "1. Datos Personales", body: "BioHostel Digital S.A. (el “Contralor”) recopila, utiliza y protege sus Datos Personales en el marco del cuidado de la reserva. Propietario de los registros: BioHostel Digital S.A., Av. Caracas 123, Bogotá D.C., Colombia. Correo de contacto del Contralor: datos@biohostel.com." },
    { title: "2. Datos que recopila", body: "Durante el sitio recopila: (a) identificativos personales (nombre, correo, teléfono); (b) datos de la reserva y de la casa; (c) datos de pago (procesados por terceros autorizados); (d) datos de interacción, configuración y cookies." },
    { title: "3. Finalidades del tratamiento", body: "(a) Atención al cliente y gestión de reservas; (b) Comunicación institucional; (c) Cumplimiento fiscal y legal; (d) Mejora del servicio; (e) Prevención de fraudes; (f) Contacto con el anfitrión u hosts." },
    { title: "4. Base jurídica", body: "(a) Ejecución de un contrato; (b) Obligación legal; (c) Consentimiento expreso; (d) Interés legítimo (seguridad y prevención de fraude); (e) Legado." },
    { title: "5. Destinatarios", body: "Datos se comparten con proveedores autorizados: bancos y procesadores de pagos, redes de alojamiento, servicios de mensajería y proofs de identidad. No vende, enajena ni transfiere Datos sin su consentimiento." },
    { title: "6. Cookies y tecnologías similares", body: "El sitio utiliza cookies propias y de terceros para funcionalidad, analítica y personalización. Puede rechazar cookies; el sitio sigue funcionando en modo básico. Consulte la cookie policy." },
    { title: "7. Seguridad", body: "El Contralor implementa medidas de seguridad técnicas y organizacionales (criptografía TLS, control de acceso, auditoría, backups, políticas de acceso mínimo). Los datos se encriptan en tránsito y en reposo." },
    { title: "8. Derechos ARCO", body: "Tiene derecho de acceso, rectificación, cancelación, oposición, limitación del tratamiento, portabilidad y lectura de datos. Para ejercer: escriba a datos@biohostel.com con su correo y documento de identidad, indicando el derecho ARCO." },
    { title: "9. Retención", body: "Datos se conservan durante la vigencia del contrato y durante el plazo legal que corresponda (generalmente 5 años para asuntos fiscales y 2 años para contratos). Luego se eliminan de forma segura." },
    { title: "10. Envío a terceros", body: "No destina Datos a terceros por ganancia comercial. En caso de adquisición, fusión o transferencia, se notificará y se garantizará el tratamiento conforme a la normativa vigente." },
    { title: "11. Tratamiento de datos de menores", body: "El sitio no está orientado a menores de 18 años. Si usted es menor, no proporcione datos sin autorización de un responsable." },
    { title: "12. Cambios a la política", body: "El Contralor puede actualizar esta Política. Notificaciones se publican en el sitio. Usuario deberá revisar este documento periódicamente." },
  ],
};

const COOKIES: LegalPage = {
  title: "Política de Cookies",
  intro: "Vigente a partir del 25 de octubre de 2026. Última actualización: 25 de octubre de 2026.",
  sections: [
    { title: "1. ¿Qué son las cookies?", body: "Las cookies son pequeños archivos de texto que se almacenan en su dispositivo al navegar por nuestro sitio. Permiten funcionalidades esenciales, análisis de tráfico y personalización de contenidos." },
    { title: "2. Tipos de cookies que utilizamos", body: "Cookies técnicas/estrictas: indispensables para el funcionamiento del sitio, autenticación y seguridad. Cookies de preferencias: recuerdan sus elecciones (idioma, moneda, configuración). Cookies de análisis: nos permiten entender cómo interactúa con el sitio (Google Analytics u otros proveedores de métricas). Cookies de marketing: para mostrar publicidad relevante basada en su navegación (si prefiere no recibir publicidad, puede desactivarlas)." },
    { title: "3. Cookies de terceros", body: "Al navegar por nuestro sitio, es posible que vea contenido de terceros (videos, redes sociales, publicidad). Además de las propias, podrían instalar cookies de estos proveedores. Revise las políticas de privacidad de cada servicio para conocer el tratamiento de datos. Las cookies de Google Analytics se configuran desde Google Privacy & Terms." },
    { title: "4. Tabla de cookies", body: "En la tabla siguiente se indican las cookies implementadas. El usuario puede revocar el consentimiento en cualquier momento a través de la configuración de su navegador." },
    { title: "5. Gestión de cookies", body: "Puede aceptar, rechazar o configurar cookies en su navegador. La mayoría de los navegadores modernos permiten manejar cookies vía: Chrome (Config > Privacidad y seguridad), Firefox (Config > Privacidad y seguridad), Safari (Preferencias > Seguridad). También puede usar “Do Not Track” si su navegador lo soporta." },
    { title: "6. Cambios a esta política", body: "El Contralor puede modificar esta política de cookies. Las modificaciones se publicarán en el sitio. El usuario se mantiene informado sobre los cambios; continuar navegando después de la modificación se considera aceptación." },
  ],
};

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  brand: {
    name: "biohostel",
    suffix: ".COM",
    logoUrl: "",
    tagline: "Reserva hostels y subarriendos con IA",
  },
  announcement: "BIOHOSTEL.COM · 1 RESERVA = 1 ÁRBOL · SINCRONIZADO CON BOOKING + AIRBNB",
  hero: {
    eyebrow: "COMO BOOKING + AIRBNB, PERO VERDE",
    title: "Reserva hostels y subarriendos con IA que evita overbooking.",
    highlight: "y subarriendos",
    subtitle:
      "Antes de cobrar, la IA verifica tus fechas en Booking y Airbnb. Si está ocupado, te sugiere otro día o lugar. Si está libre, reserva y bloquea las otras plataformas.",
    image: "",
  },
  nav: [
    { label: "Explorar", href: "#explorar" },
    { label: "Subarriendos", href: "#subarriendos" },
    { label: "Planes", href: "#planes" },
    { label: "Comunidad", href: "#perfiles" },
    { label: "Proveedores", href: "#publicidad" },
  ],
  footer: {
    text: "Hecho en Colombia · 1 reserva = 1 árbol",
    contactEmail: "hola@biohostel.com",
    links: [
      { label: "Panel anfitrión", href: "/panel" },
      { label: "Términos", href: "/terminos" },
      { label: "Privacidad", href: "/privacidad" },
      { label: "Cookies", href: "/cookies" },
    ],
    socials: [],
  },
  design: {
    primary: "#15803d",
    primaryDeep: "#0f2d1e",
    accent: "#10b981",
    lime: "#84cc16",
    background: "#f6f8f3",
    surface: "#ffffff",
    ink: "#0f1f17",
    line: "#d5e2d4",
    cardRadius: 20,
    buttonRadius: 999,
    inputRadius: 10,
    font: "inter",
    defaultTheme: "light",
  },
  dark: {
    background: "#09120d",
    surface: "#112018",
    ink: "#ecf7ee",
    primary: "#4ade80",
    accent: "#34d399",
    line: "#213d2b",
  },
  seo: {
    title: "BioHostel.com · Reserva hostels y subarriendos",
    description:
      "El booking verde: reservas por noche y subarriendos mensuales con IA que sincroniza Booking y Airbnb, perfiles sociales y planes para anfitriones.",
    ogImage: "",
  },
  modules: {
    plans: true,
    profiles: true,
    publicAds: true,
    sponsors: true,
    packs: true,
    assistant: true,
    currency: true,
    themeToggle: true,
  },
  legal: { terms: TERMS, privacy: PRIVACY, cookies: COOKIES },
  updatedAt: new Date().toISOString(),
};

function asObject(v: unknown): Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

function txt(v: unknown, fallback: string, max: number): string {
  if (typeof v !== "string") return fallback;
  return v
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .slice(0, max);
}

function color(v: unknown, fallback: string): string {
  if (typeof v !== "string") return fallback;
  const s = v.trim();
  return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(s) ? s : fallback;
}

function href(v: unknown, fallback: string): string {
  const s = txt(v, "", 400).trim();
  if (!s) return fallback;
  return /^(https?:\/\/|\/|#|mailto:|tel:)/i.test(s) ? s : fallback;
}

function imageUrl(v: unknown, fallback: string): string {
  const s = txt(v, "", 1200).trim();
  if (!s) return "";
  return /^(https?:\/\/|\/)/i.test(s) ? s : fallback;
}

function num(v: unknown, fallback: number, min: number, max: number): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function bool(v: unknown, fallback: boolean): boolean {
  return typeof v === "boolean" ? v : fallback;
}

function isFont(v: unknown): v is FontPreset {
  return typeof v === "string" && FONT_PRESETS.some((f) => f.id === v);
}

function parseLinks(v: unknown[], max: number): NavItem[] {
  return v
    .slice(0, max)
    .map((item) => {
      const o = asObject(item);
      return { label: txt(o.label, "", 60), href: href(o.href, "#") };
    })
    .filter((x) => x.label.trim().length > 0 || x.href !== "#");
}

function parseSocials(v: unknown[]): SocialLink[] {
  return v
    .slice(0, 10)
    .map((item) => {
      const o = asObject(item);
      return { label: txt(o.label, "", 60), url: href(o.url, "") };
    })
    .filter((x) => x.label.trim().length > 0 && x.url.length > 0);
}

function mergeLegal(v: unknown, base: LegalPage): LegalPage {
  const o = asObject(v);
  const sections = Array.isArray(o.sections)
    ? o.sections
        .slice(0, 40)
        .map((item) => {
          const s = asObject(item);
          return { title: txt(s.title, "", 160), body: txt(s.body, "", 12000) };
        })
        .filter((s) => s.title.trim().length > 0 || s.body.trim().length > 0)
    : base.sections;
  return {
    title: txt(o.title, base.title, 160),
    intro: txt(o.intro, base.intro, 1200),
    sections,
  };
}

export function mergeSiteSettings(raw: unknown, base: SiteSettings = DEFAULT_SITE_SETTINGS): SiteSettings {
  const r = asObject(raw);
  const brand = asObject(r.brand);
  const hero = asObject(r.hero);
  const footer = asObject(r.footer);
  const design = asObject(r.design);
  const dark = asObject(r.dark);
  const seo = asObject(r.seo);
  const modules = asObject(r.modules);
  const legal = asObject(r.legal);

  return {
    brand: {
      name: txt(brand.name, base.brand.name, 60),
      suffix: txt(brand.suffix, base.brand.suffix, 24),
      logoUrl: imageUrl(brand.logoUrl, base.brand.logoUrl),
      tagline: txt(brand.tagline, base.brand.tagline, 180),
    },
    announcement: txt(r.announcement, base.announcement, 320),
    hero: {
      eyebrow: txt(hero.eyebrow, base.hero.eyebrow, 140),
      title: txt(hero.title, base.hero.title, 200),
      highlight: txt(hero.highlight, base.hero.highlight, 140),
      subtitle: txt(hero.subtitle, base.hero.subtitle, 700),
      image: imageUrl(hero.image, base.hero.image),
    },
    nav: Array.isArray(r.nav) ? parseLinks(r.nav, 14) : base.nav,
    footer: {
      text: txt(footer.text, base.footer.text, 320),
      contactEmail: txt(footer.contactEmail, base.footer.contactEmail, 180),
      links: Array.isArray(footer.links) ? parseLinks(footer.links, 14) : base.footer.links,
      socials: Array.isArray(footer.socials) ? parseSocials(footer.socials) : base.footer.socials,
    },
    design: {
      primary: color(design.primary, base.design.primary),
      primaryDeep: color(design.primaryDeep, base.design.primaryDeep),
      accent: color(design.accent, base.design.accent),
      lime: color(design.lime, base.design.lime),
      background: color(design.background, base.design.background),
      surface: color(design.surface, base.design.surface),
      ink: color(design.ink, base.design.ink),
      line: color(design.line, base.design.line),
      cardRadius: num(design.cardRadius, base.design.cardRadius, 0, 40),
      buttonRadius: num(design.buttonRadius, base.design.buttonRadius, 0, 999),
      inputRadius: num(design.inputRadius, base.design.inputRadius, 0, 40),
      font: isFont(design.font) ? design.font : base.design.font,
      defaultTheme: design.defaultTheme === "dark" || design.defaultTheme === "light" ? design.defaultTheme : base.design.defaultTheme,
    },
    dark: {
      background: color(dark.background, base.dark.background),
      surface: color(dark.surface, base.dark.surface),
      ink: color(dark.ink, base.dark.ink),
      primary: color(dark.primary, base.dark.primary),
      accent: color(dark.accent, base.dark.accent),
      line: color(dark.line, base.dark.line),
    },
    seo: {
      title: txt(seo.title, base.seo.title, 160),
      description: txt(seo.description, base.seo.description, 400),
      ogImage: imageUrl(seo.ogImage, base.seo.ogImage),
    },
    modules: {
      plans: bool(modules.plans, base.modules.plans),
      profiles: bool(modules.profiles, base.modules.profiles),
      publicAds: bool(modules.publicAds, base.modules.publicAds),
      sponsors: bool(modules.sponsors, base.modules.sponsors),
      packs: bool(modules.packs, base.modules.packs),
      assistant: bool(modules.assistant, base.modules.assistant),
      currency: bool(modules.currency, base.modules.currency),
      themeToggle: bool(modules.themeToggle, base.modules.themeToggle),
    },
    legal: {
      terms: mergeLegal(legal.terms, base.legal.terms),
      privacy: mergeLegal(legal.privacy, base.legal.privacy),
      cookies: mergeLegal(legal.cookies, base.legal.cookies),
    },
    updatedAt: typeof r.updatedAt === "string" ? r.updatedAt : base.updatedAt,
  };
}

function readableOn(hex: string): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  if (!Number.isFinite(n)) return "#ffffff";
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.62 ? "#07190e" : "#ffffff";
}

export function siteThemeCss(s: SiteSettings): string {
  const font = FONT_STACKS[s.design.font] ?? FONT_STACKS.inter;
  const onDeep = readableOn(s.design.primaryDeep);
  const onDark = readableOn(s.dark.background);
  const onPrimary = readableOn(s.design.primary);
  const onDarkPrimary = readableOn(s.dark.primary);

  return [
    ":root{",
    `--green:${s.design.primary}!important;`,
    `--eyebrow:${s.design.primary}!important;`,
    `--green-deep:${s.design.primaryDeep}!important;`,
    `--emerald:${s.design.accent}!important;`,
    `--sage:${s.design.accent}!important;`,
    `--lime:${s.design.lime}!important;`,
    `--cream:${s.design.background}!important;`,
    `--surface:${s.design.surface}!important;`,
    `--surface-2:color-mix(in srgb, ${s.design.surface} 92%, ${s.design.background})!important;`,
    `--ink:${s.design.ink}!important;`,
    `--heading:${s.design.ink}!important;`,
    `--line:${s.design.line}!important;`,
    `--muted:color-mix(in srgb, ${s.design.ink} 62%, ${s.design.background})!important;`,
    `--tint:color-mix(in srgb, ${s.design.primary} 12%, ${s.design.background})!important;`,
    `--warm-cream:color-mix(in srgb, ${s.design.background} 90%, white)!important;`,
    `--paper:color-mix(in srgb, ${s.design.background} 88%, ${s.design.ink} 4%)!important;`,
    `--sand:color-mix(in srgb, ${s.design.background} 84%, ${s.design.ink} 7%)!important;`,
    `--header:color-mix(in srgb, ${s.design.background} 88%, transparent)!important;`,
    `--display:${font}!important;--sans:${font}!important;`,
    `--radius-card:${s.design.cardRadius}px!important;`,
    `--radius-btn:${s.design.buttonRadius}px!important;`,
    `--radius-input:${s.design.inputRadius}px!important;`,
    "}",
    '[data-theme="dark"]{',
    `--green:${s.dark.primary}!important;`,
    `--eyebrow:${s.dark.primary}!important;`,
    `--emerald:${s.dark.accent}!important;`,
    `--sage:${s.dark.accent}!important;`,
    `--cream:${s.dark.background}!important;`,
    `--surface:${s.dark.surface}!important;`,
    `--surface-2:color-mix(in srgb, ${s.dark.surface} 88%, ${s.dark.background})!important;`,
    `--ink:${s.dark.ink}!important;`,
    `--heading:${s.dark.ink}!important;`,
    `--line:${s.dark.line}!important;`,
    `--muted:color-mix(in srgb, ${s.dark.ink} 62%, ${s.dark.background})!important;`,
    `--tint:color-mix(in srgb, ${s.dark.primary} 16%, ${s.dark.background})!important;`,
    `--warm-cream:color-mix(in srgb, ${s.dark.background} 94%, white)!important;`,
    `--paper:color-mix(in srgb, ${s.dark.background} 92%, white)!important;`,
    `--sand:color-mix(in srgb, ${s.dark.background} 88%, white)!important;`,
    `--header:color-mix(in srgb, ${s.dark.background} 88%, transparent)!important;`,
    "}",
    `.lcard,.plan,.profile,.kpi,.ad,.pack,.sponsor,.modal,.searchcard,.udropdown,.aibox{border-radius:var(--radius-card)!important;}`,
    `.btn,.pill{border-radius:var(--radius-btn)!important;}`,
    `input:not([type="checkbox"]):not([type="radio"]):not([type="color"]):not([type="file"]),select,textarea{border-radius:var(--radius-input)!important;}`,
    `.brand-mark{background:linear-gradient(135deg, ${s.design.primary}, ${s.design.accent})!important;color:${onPrimary}!important;}`,
    `.btn-green{background:linear-gradient(135deg, ${s.design.primary}, ${s.design.accent})!important;color:${onPrimary}!important;}`,
    `.pill.on{background:linear-gradient(135deg, ${s.design.primary}, ${s.design.accent})!important;color:${onPrimary}!important;border-color:transparent!important;}`,
    `[data-theme="dark"] .btn-green{background:${s.dark.primary}!important;color:${onDarkPrimary}!important;}`,
    `[data-theme="dark"] .pill.on{background:${s.dark.primary}!important;color:${onDarkPrimary}!important;border-color:transparent!important;}`,
    `.topbar{background:${s.design.primaryDeep}!important;color:${onDeep}!important;}`,
    `[data-theme="dark"] .topbar{background:${s.dark.surface}!important;color:${s.dark.ink}!important;}`,
    `.footer{background:${s.design.primaryDeep}!important;color:${onDeep}!important;}`,
    `.footer p,.footer a,.footer .muted{color:color-mix(in srgb, ${onDeep} 82%, transparent)!important;}`,
    `.footer a:hover{color:${onDeep}!important;}`,
    `[data-theme="dark"] .footer{background:${s.dark.background}!important;color:${onDark}!important;}`,
    `[data-theme="dark"] .footer p,[data-theme="dark"] .footer a,[data-theme="dark"] .footer .muted{color:color-mix(in srgb, ${onDark} 82%, transparent)!important;}`,
    `[data-theme="dark"] .footer a:hover{color:${onDark}!important;}`,
    `.hero{background:radial-gradient(900px 380px at 15% 0%, color-mix(in srgb, ${s.design.primary} 14%, transparent), transparent 70%),radial-gradient(750px 340px at 90% 10%, color-mix(in srgb, ${s.design.accent} 12%, transparent), transparent 70%),var(--warm-cream)!important;}`,
    `[data-theme="dark"] .hero{background:radial-gradient(900px 420px at 15% 0%, color-mix(in srgb, ${s.dark.primary} 14%, transparent), transparent 70%),radial-gradient(750px 360px at 90% 10%, color-mix(in srgb, ${s.dark.accent} 10%, transparent), transparent 70%),linear-gradient(180deg, ${s.dark.background} 0%, var(--cream) 100%)!important;}`,
  ].join("");
}

export function legalToText(page: LegalPage): string {
  return page.sections.map((s) => `## ${s.title}\n${s.body}`).join("\n\n");
}

export function textToLegal(raw: string): LegalSection[] {
  return raw
    .split(/^##\s+/m)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const idx = chunk.indexOf("\n");
      if (idx === -1) return { title: chunk.trim(), body: "" };
      return { title: chunk.slice(0, idx).trim(), body: chunk.slice(idx + 1).trim() };
    })
    .filter((s) => s.title.length > 0 || s.body.length > 0);
}
