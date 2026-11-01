export type FontPreset = "biohostels" | "system" | "inter" | "geometric" | "humanist" | "rounded";
export type ThemeMode = "light" | "dark";
export type NavItem = { label: string; href: string };
export type SocialLink = { label: string; url: string };
export type LegalSection = { title: string; body: string };
export type LegalPage = { title: string; intro: string; version?: string; sections: LegalSection[] };

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
    muted: string;
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
  // Sube cuando cambia el copy de producto: obliga a reemplazar textos guardados antiguos.
  copyVersion?: number;
  // Sube cuando cambia la identidad de marca: reemplaza marca, paleta y tema oscuro guardados.
  identityVersion?: number;
  updatedAt: string;
};

export const FONT_PRESETS: { id: FontPreset; label: string }[] = [
  { id: "biohostels", label: "Biohostels (Montserrat / Playfair / Inter)" },
  { id: "inter", label: "Inter / SF Pro" },
  { id: "system", label: "Sistema (Segoe UI / SF)" },
  { id: "geometric", label: "Geométrica (Avenir / Century Gothic)" },
  { id: "humanist", label: "Humanista (Optima / Candara)" },
  { id: "rounded", label: "Redondeada (Nunito / Trebuchet)" },
];

export type FontStacks = { heading: string; body: string; serif: string };

export const FONT_STACKS: Record<FontPreset, FontStacks> = {
  biohostels: {
    heading: `var(--font-montserrat, "Montserrat"), "Montserrat", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`,
    body: `var(--font-inter, "Inter"), "Inter", "SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI Variable Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`,
    serif: `var(--font-playfair, "Playfair Display"), "Playfair Display", Georgia, "Times New Roman", serif`,
  },
  inter: {
    heading: `"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI Variable Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`,
    body: `"Inter", "SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI Variable Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`,
    serif: `"Inter", "SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`,
  },
  system: {
    heading: `-apple-system, BlinkMacSystemFont, "Segoe UI Variable Display", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`,
    body: `-apple-system, BlinkMacSystemFont, "Segoe UI Variable Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`,
    serif: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`,
  },
  geometric: {
    heading: `"Avenir Next", "Century Gothic", Futura, "Trebuchet MS", "Segoe UI", Roboto, sans-serif`,
    body: `"Avenir Next", "Century Gothic", Futura, "Trebuchet MS", "Segoe UI", Roboto, sans-serif`,
    serif: `"Avenir Next", "Century Gothic", Futura, "Trebuchet MS", "Segoe UI", Roboto, sans-serif`,
  },
  humanist: {
    heading: `Optima, Candara, "Segoe UI", "Helvetica Neue", Arial, sans-serif`,
    body: `Optima, Candara, "Segoe UI", "Helvetica Neue", Arial, sans-serif`,
    serif: `Optima, Candara, "Segoe UI", "Helvetica Neue", Arial, sans-serif`,
  },
  rounded: {
    heading: `"Nunito", "Avenir Next Rounded", "Trebuchet MS", "Segoe UI", Roboto, sans-serif`,
    body: `"Nunito", "Avenir Next Rounded", "Trebuchet MS", "Segoe UI", Roboto, sans-serif`,
    serif: `"Nunito", "Avenir Next Rounded", "Trebuchet MS", "Segoe UI", Roboto, sans-serif`,
  },
};

type Palette = Pick<
  SiteSettings["design"],
  "primary" | "primaryDeep" | "accent" | "lime" | "background" | "surface" | "ink" | "line"
> & { muted?: string };

export const THEME_PRESETS: { id: string; label: string; light: Palette; dark: SiteSettings["dark"] }[] = [
  {
    id: "biohostels",
    label: "Biohostels (manual de identidad)",
    light: {
      primary: "#1b4d3e",
      primaryDeep: "#0f3328",
      accent: "#00c9a7",
      lime: "#d4a373",
      background: "#fafaf7",
      surface: "#ffffff",
      ink: "#1a1a1a",
      muted: "#4a4a4a",
      line: "#e6e1d5",
    },
    dark: { background: "#0b1512", surface: "#12211b", ink: "#eaf2ec", primary: "#4fc08d", accent: "#00c9a7", line: "#22463a" },
  },
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
  intro: "Vigente desde el 1 de noviembre de 2026 · versión 2026-11-01.",
  version: "2026-11-01",
  sections: [
    { title: "1. Aceptación", body: "Al usar biohostels.com aceptas estos términos. Si no estás de acuerdo, no uses el servicio." },
    { title: "2. Qué es Biohostels", body: "Biohostels es una plataforma para publicar y reservar alojamientos en Colombia. No somos hotel, arrendador ni agencia de viajes: el contrato de alojamiento se celebra directamente entre anfitrión y huésped." },
    { title: "3. Publicación de alojamientos", body: "Para publicar debes crear una cuenta y registrar el número de RNT del alojamiento, que se muestra en su ficha (Decreto 1836 de 2021). Si publicas un subarriendo, debes declarar y adjuntar la autorización escrita del propietario (Ley 820 de 2003, art. 17); ese documento se guarda de forma privada y no se publica. Biohostels puede pausar o retirar publicaciones sin RNT o sin la autorización exigida." },
    { title: "4. Cuenta de huésped", body: "Debes ser mayor de 18 años, usar datos veraces y respetar las reglas de la casa. Puedes reservar con cuenta o, cuando la ficha lo permita, sin cuenta indicando nombre, correo y teléfono." },
    { title: "5. Reservas y pagos", body: "La plataforma registra la solicitud de reserva y bloquea las fechas. Cuando el pago en línea está habilitado, se procesa con la pasarela Wompi y la reserva se confirma únicamente cuando Wompi reporta el pago aprobado; mientras tanto, las fechas quedan retenidas por 30 minutos. Si no está habilitado, el pago se coordina directamente con el anfitrión. Biohostels no almacena números de tarjeta ni datos financieros completos. La cancelación se rige por la política publicada en cada ficha." },
    { title: "6. Disponibilidad", body: "La disponibilidad se calcula con las reservas de Biohostels (incluidas las retenciones temporales por pago pendiente) y con los calendarios iCal que el anfitrión conecta desde Booking, Airbnb u otras plataformas. Esos calendarios se actualizan de forma perezosa al consultar disponibilidad o reservar, y el anfitrión también puede sincronizarlos manualmente. No es una verificación en tiempo real de esas plataformas: puede haber desfases si el calendario externo no se actualiza. El servidor vuelve a validar antes de confirmar una reserva." },
    { title: "7. Privacidad", body: "Tratamos tus datos conforme a la Política de Privacidad y a la Ley 1581 de 2012. Puedes acceder, rectificar, suprimir y revocar tu consentimiento escribiendo a datos@biohostels.com." },
    { title: "8. Contenido prohibido", body: "No se permite publicar contenido difamatorio, discriminatorio, sexual, violento, ilícito ni que infrinja derechos de terceros. Podemos retirar el contenido y suspender la cuenta." },
    { title: "9. Propiedad intelectual", body: "Los textos, imágenes, marcas y el código del sitio pertenecen a sus titulares. Se otorga una licencia personal y no exclusiva para consultar el sitio." },
    { title: "10. Responsabilidad", body: "La información de cada ficha es responsabilidad del anfitrión, incluidos el RNT, la autorización de subarriendo, los precios y la disponibilidad. Biohostels no garantiza la calidad del alojamiento ni la exactitud de calendarios externos. Nada en estos términos limita los derechos que la Ley 1480 de 2011 reconoce a los consumidores." },
    { title: "11. Quejas y reclamos", body: "Puedes escribir a datos@biohostels.com. También puedes acudir a la Superintendencia de Industria y Comercio (SIC) en los términos de la Ley 1480 de 2011." },
    { title: "12. Ley aplicable", body: "Estos términos se rigen por la legislación colombiana. Las controversias se someten a los jueces competentes en Colombia." },
  ],
};

const PRIVACY: LegalPage = {
  title: "Política de Privacidad",
  intro: "Vigente desde el 1 de noviembre de 2026 · versión 2026-11-01.",
  version: "2026-11-01",
  sections: [
    { title: "1. Responsable del tratamiento", body: "Biohostels, operador de biohostels.com. Contacto para datos personales: datos@biohostels.com. Tratamos los datos conforme a la Ley 1581 de 2012 y el Decreto 1377 de 2013 (compilado en el Decreto 1074 de 2015)." },
    { title: "2. Datos que tratamos", body: "(a) Cuenta: nombre, correo y contraseña cifrada. (b) Reserva: nombre, correo, teléfono, fechas, huéspedes y alojamiento. (c) Pago: estado de la transacción, referencia, método y monto; no almacenamos números de tarjeta. (d) Cumplimiento: RNT del alojamiento y, para subarriendos, la autorización escrita del propietario. (e) Consentimiento: fecha, versión de esta política, finalidades, dirección IP y agente de usuario. (f) Preferencias de uso del sitio." },
    { title: "3. Finalidades", body: "Gestionar tu cuenta y la reserva solicitada; contactarte sobre el alojamiento y la reserva; prevenir fraude y proteger la seguridad del servicio; cumplir obligaciones legales y atender requerimientos de autoridad." },
    { title: "4. Base legal", body: "Tu consentimiento expreso al registrarte o reservar; la ejecución del contrato de alojamiento; el cumplimiento de obligaciones legales; y el interés legítimo en seguridad y prevención de fraude. Puedes revocar el consentimiento, sin efecto retroactivo, escribiendo a datos@biohostels.com." },
    { title: "5. Documentos de cumplimiento", body: "La autorización de subarriendo puede contener datos del propietario. Se almacena en un espacio privado, separada del almacenamiento público de imágenes, y solo el anfitrión dueño de la publicación y el administrador pueden consultarla. No se publica ni se comparte con huéspedes." },
    { title: "6. Destinatarios", body: "Usamos proveedores de infraestructura (alojamiento, base de datos, almacenamiento y correo transaccional) que tratan los datos por nuestra cuenta. Cuando el pago en línea está habilitado, la pasarela Wompi procesa los datos necesarios para autorizar la transacción bajo sus propias políticas. No vendemos datos personales. Podemos entregarlos cuando una autoridad competente lo exija." },
    { title: "7. Conservación", body: "Conservamos los datos de la cuenta mientras esté activa, los de la reserva durante los plazos legales aplicables y los registros de consentimiento mientras sea necesario para demostrar su existencia. Luego se eliminan o anonimizan." },
    { title: "8. Tus derechos", body: "Puedes conocer, actualizar, rectificar, suprimir y revocar el consentimiento sobre tus datos, y presentar quejas ante la Superintendencia de Industria y Comercio (SIC). Escríbenos a datos@biohostels.com indicando tu solicitud." },
    { title: "9. Seguridad", body: "Aplicamos cifrado en tránsito (TLS), contraseñas con derivación PBKDF2, control de acceso a la base de datos y separación entre archivos públicos y privados. Ningún sistema es infalible; si ocurre un incidente relevante lo comunicaremos a los afectados y a la autoridad cuando corresponda." },
    { title: "10. Cookies y almacenamiento local", body: "Usamos una cookie técnica de sesión (bio_session) para mantener tu cuenta y preferencias guardadas en tu navegador. No usamos cookies publicitarias ni de análisis de terceros en esta versión. Puedes borrar las cookies desde tu navegador; la sesión se cerrará." },
    { title: "11. Menores de edad", body: "El servicio no está dirigido a menores de 18 años. No solicites ni proporciones datos de menores." },
    { title: "12. Cambios", body: "Si cambiamos esta política, publicaremos una nueva versión con su fecha. La versión aceptada queda registrada en tu cuenta y en el registro de consentimientos." },
  ],
};

const COOKIES: LegalPage = {
  title: "Política de Cookies",
  intro: "Vigente desde el 1 de noviembre de 2026 · versión 2026-11-01.",
  version: "2026-11-01",
  sections: [
    { title: "1. Qué son", body: "Son archivos pequeños que el navegador guarda para recordar información entre visitas. También usamos almacenamiento local para preferencias como el tema y la moneda." },
    { title: "2. Cookies que usamos", body: "Cookie técnica bio_session: mantiene tu sesión iniciada y es indispensable para la cuenta. Preferencias (tema claro/oscuro y moneda): se guardan en tu navegador. No usamos cookies publicitarias ni de análisis de terceros en esta versión." },
    { title: "3. Terceros", body: "El sitio carga imágenes y mapas desde proveedores externos (por ejemplo, Unsplash y Google Maps), que pueden recibir la dirección IP de tu navegador al mostrar el contenido. Revisa sus políticas de privacidad." },
    { title: "4. Cómo gestionarlas", body: "Puedes eliminarlas o bloquearlas desde la configuración de tu navegador (Chrome, Firefox, Safari o Edge, sección Privacidad). Si bloqueas la cookie de sesión, no podrás iniciar sesión ni publicar." },
    { title: "5. Cambios", body: "Si incorporamos analítica o publicidad, actualizaremos esta política y pediremos el consentimiento que corresponda antes de activarlas." },
  ],
};

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  brand: {
    name: "Biohostels",
    suffix: ".com",
    logoUrl: "",
    tagline: "Tecnología que regenera",
  },
  announcement: "BIOHOSTELS.COM · RESERVAS DIRECTAS · CALENDARIOS iCal DE BOOKING + AIRBNB",
  hero: {
    eyebrow: "COMO BOOKING + AIRBNB, PERO VERDE",
    title: "Reserva hostels y subarriendos con calendarios conectados.",
    highlight: "y subarriendos",
    subtitle:
      "Cruzamos tus fechas con las reservas de Biohostels.com y los calendarios iCal que cada anfitrión importa desde Booking o Airbnb. Si hay conflicto te proponemos alternativas; si está libre, confirmamos y generamos el bloqueo para exportarlo.",
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
    contactEmail: "hola@biohostels.com",
    links: [
      { label: "Panel anfitrión", href: "/panel" },
      { label: "Términos", href: "/terminos" },
      { label: "Privacidad", href: "/privacidad" },
      { label: "Cookies", href: "/cookies" },
    ],
    socials: [],
  },
  design: {
    primary: "#1b4d3e",
    primaryDeep: "#0f3328",
    accent: "#00c9a7",
    lime: "#d4a373",
    background: "#fafaf7",
    surface: "#ffffff",
    ink: "#1a1a1a",
    muted: "#4a4a4a",
    line: "#e6e1d5",
    cardRadius: 20,
    buttonRadius: 999,
    inputRadius: 10,
    font: "biohostels",
    defaultTheme: "light",
  },
  dark: {
    background: "#0b1512",
    surface: "#12211b",
    ink: "#eaf2ec",
    primary: "#4fc08d",
    accent: "#00c9a7",
    line: "#22463a",
  },
  seo: {
    title: "Biohostels.com · Reserva hostels y subarriendos",
    description:
      "El booking verde de Colombia: reservas por noche y subarriendos mensuales con calendarios iCal de Booking y Airbnb, perfiles de anfitriones y planes para alojamientos.",
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
  copyVersion: 3,
  identityVersion: 1,
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
    version: txt(o.version, base.version ?? "", 40) || undefined,
    sections,
  };
}

function mergeLegalVersioned(v: unknown, base: LegalPage): LegalPage {
  const stored = asObject(v);
  if (!base.version || stored.version !== base.version) return base;
  return mergeLegal(v, base);
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
  const copyCurrent = Number(r.copyVersion) === (base.copyVersion ?? 0);
  // Mientras la fila guardada sea de otra identidad, marca y paleta vuelven al manual vigente.
  const identityCurrent = Number(r.identityVersion) === (base.identityVersion ?? 0);

  return {
    brand: {
      name: identityCurrent ? txt(brand.name, base.brand.name, 60) : base.brand.name,
      suffix: identityCurrent ? txt(brand.suffix, base.brand.suffix, 24) : base.brand.suffix,
      logoUrl: identityCurrent ? imageUrl(brand.logoUrl, base.brand.logoUrl) : base.brand.logoUrl,
      tagline: copyCurrent && identityCurrent ? txt(brand.tagline, base.brand.tagline, 180) : base.brand.tagline,
    },
    announcement: copyCurrent ? txt(r.announcement, base.announcement, 320) : base.announcement,
    hero: copyCurrent ? {
      eyebrow: txt(hero.eyebrow, base.hero.eyebrow, 140),
      title: txt(hero.title, base.hero.title, 200),
      highlight: txt(hero.highlight, base.hero.highlight, 140),
      subtitle: txt(hero.subtitle, base.hero.subtitle, 700),
      image: imageUrl(hero.image, base.hero.image),
    } : base.hero,
    nav: Array.isArray(r.nav) ? parseLinks(r.nav, 14) : base.nav,
    footer: {
      text: txt(footer.text, base.footer.text, 320),
      // El correo de contacto lleva el dominio de la marca: con otra identidad vuelve al default.
      contactEmail: identityCurrent ? txt(footer.contactEmail, base.footer.contactEmail, 180) : base.footer.contactEmail,
      links: Array.isArray(footer.links) ? parseLinks(footer.links, 14) : base.footer.links,
      socials: Array.isArray(footer.socials) ? parseSocials(footer.socials) : base.footer.socials,
    },
    design: identityCurrent
      ? {
          primary: color(design.primary, base.design.primary),
          primaryDeep: color(design.primaryDeep, base.design.primaryDeep),
          accent: color(design.accent, base.design.accent),
          lime: color(design.lime, base.design.lime),
          background: color(design.background, base.design.background),
          surface: color(design.surface, base.design.surface),
          ink: color(design.ink, base.design.ink),
          muted: color(design.muted, base.design.muted),
          line: color(design.line, base.design.line),
          cardRadius: num(design.cardRadius, base.design.cardRadius, 0, 40),
          buttonRadius: num(design.buttonRadius, base.design.buttonRadius, 0, 999),
          inputRadius: num(design.inputRadius, base.design.inputRadius, 0, 40),
          font: isFont(design.font) ? design.font : base.design.font,
          defaultTheme: design.defaultTheme === "dark" || design.defaultTheme === "light" ? design.defaultTheme : base.design.defaultTheme,
        }
      : base.design,
    dark: identityCurrent
      ? {
          background: color(dark.background, base.dark.background),
          surface: color(dark.surface, base.dark.surface),
          ink: color(dark.ink, base.dark.ink),
          primary: color(dark.primary, base.dark.primary),
          accent: color(dark.accent, base.dark.accent),
          line: color(dark.line, base.dark.line),
        }
      : base.dark,
    seo: copyCurrent ? {
      title: txt(seo.title, base.seo.title, 160),
      description: txt(seo.description, base.seo.description, 400),
      ogImage: imageUrl(seo.ogImage, base.seo.ogImage),
    } : base.seo,
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
      // Si la versión guardada es anterior, se reemplaza por el texto vigente.
      terms: mergeLegalVersioned(legal.terms, base.legal.terms),
      privacy: mergeLegalVersioned(legal.privacy, base.legal.privacy),
      cookies: mergeLegalVersioned(legal.cookies, base.legal.cookies),
    },
    copyVersion: base.copyVersion,
    identityVersion: base.identityVersion,
    updatedAt: typeof r.updatedAt === "string" ? r.updatedAt : base.updatedAt,
  };
}

export function readableOn(hex: string): string {
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
  const fonts = FONT_STACKS[s.design.font] ?? FONT_STACKS.biohostels;
  const onDeep = readableOn(s.design.primaryDeep);
  const onDark = readableOn(s.dark.background);
  const onPrimary = readableOn(s.design.primary);
  const onDarkPrimary = readableOn(s.dark.primary);
  const primarySolid = `linear-gradient(135deg, ${s.design.primary}, color-mix(in srgb, ${s.design.primary} 78%, black))`;

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
    `--muted:${s.design.muted}!important;`,
    `--tint:color-mix(in srgb, ${s.design.primary} 12%, ${s.design.background})!important;`,
    `--warm-cream:color-mix(in srgb, ${s.design.background} 90%, white)!important;`,
    `--paper:color-mix(in srgb, ${s.design.background} 88%, ${s.design.ink} 4%)!important;`,
    `--sand:color-mix(in srgb, ${s.design.background} 84%, ${s.design.ink} 7%)!important;`,
    `--header:color-mix(in srgb, ${s.design.background} 88%, transparent)!important;`,
    `--display:${fonts.heading}!important;--sans:${fonts.body}!important;--serif:${fonts.serif}!important;`,
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
    `.brand-mark{background:color-mix(in srgb, ${s.design.primary} 8%, ${s.design.surface})!important;color:${s.design.primary}!important;}`,
    `.btn-green{background:${primarySolid}!important;color:${onPrimary}!important;}`,
    `.pill.on{background:${primarySolid}!important;color:${onPrimary}!important;border-color:transparent!important;}`,
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
