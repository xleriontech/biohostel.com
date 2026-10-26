import { ADS, LISTINGS } from "./data";
import { readTable, writeTable } from "./storage";
import { StoredReview } from "./data";
import { DEFAULT_SITE_SETTINGS, mergeSiteSettings, type SiteSettings } from "./site-settings";

export type StoredUser = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  plan: "gratuito" | "corporativo" | "premium";
  role: "user" | "admin";
  banned?: boolean;
  favorites: string[];
  follows: string[];
  createdAt: string;
};

export type StoredSession = { token: string; userId: string; expiresAt: string };

export type ListingTheme = {
  primary: string;
  accent: string;
  preset: "selva" | "mar" | "colonial" | "urbano" | "minimal";
  font: "sans";
  rationale: string;
};

export type StoredListing = (typeof LISTINGS)[number] & {
  ownerId: string;
  active: boolean;
  featured: boolean;
  slug: string;
  theme?: ListingTheme;
  createdAt: string;
};

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "alojamiento";
}

export type StoredReservation = {
  id: string;
  code: string;
  listingId: string;
  listingTitle: string;
  guestId: string;
  guestName: string;
  hostId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  base: number;
  commission: number;
  rate: number;
  extras?: { seguro: boolean; desayuno: boolean };
  extrasTotal?: number;
  total: number;
  status: string;
  aiReport: string;
  createdAt: string;
};

export type StoredLead = { id: string; tipo: string; nombre: string; email: string; mensaje: string; detalle: string; estado: string; notas: string; createdAt: string };
export type StoredChannel = { id: string; userId: string; plataforma: string; cuenta: string; ultima: string };
export type StoredAd = { id: string; empresa: string; categoria: string; titulo: string; texto: string; color: string; image: string; active: boolean };
export type AppConfig = { rates: { gratuito: number; corporativo: number; premium: number } };

export type AIProvider = "local" | "openai" | "anthropic" | "gemini" | "openrouter" | "ollama" | "custom";
export type AIConfig = {
  provider: AIProvider;
  model: string;
  apiKey: string;
  baseUrl: string;
  updatedAt: string;
};

// Canal externo de un alojamiento (Airbnb/Booking/Web): la IA lo consulta y lo bloquea
export type ListingChannel = {
  id: string;
  listingId: string;
  platform: string;
  url: string;
  icalUrl: string;
  occupied: string[];
  lastSync: string;
};

// Documento del índice RAG (contenido de las propiedades)
export type RagDoc = { id: string; listingId: string; title: string; text: string; updatedAt: string };

// Convierte los demos de data.ts al formato persistente (dueño "demo")
function seedListings(): StoredListing[] {
  return LISTINGS.map((l) => ({ ...l, ownerId: "demo", active: true, featured: false, slug: slugify(l.titulo), createdAt: new Date().toISOString() }));
}

const DEMO_BY_ID = new Map(LISTINGS.map((l) => [l.id, l]));

function cancellationFromPoliticas(politicas?: string): string {
  if (!politicas) return "";
  return (
    politicas
      .split("·")
      .map((part) => part.trim())
      .find((part) => /cancel/i.test(part)) ?? ""
  );
}

// Rellena campos que faltan en registros guardados antes de que existieran
// (slugs, datos de estancia) usando el demo de data.ts como referencia.
function normalizeListings(rows: StoredListing[]): StoredListing[] {
  const usedSlugs = new Set<string>();
  return rows.map((row, index) => {
    const demo = DEMO_BY_ID.get(row.id);
    const titulo = String(row.titulo ?? demo?.titulo ?? "Alojamiento");
    let slug = typeof row.slug === "string" ? row.slug.trim() : "";
    if (!slug) slug = slugify(titulo);
    while (usedSlugs.has(slug)) slug = `${slug}-${index + 1}`;
    usedSlugs.add(slug);

    return {
      ...row,
      slug,
      checkIn: row.checkIn || demo?.checkIn || "15:00",
      checkOut: row.checkOut || demo?.checkOut || "12:00",
      cancellationPolicy:
        row.cancellationPolicy ||
        demo?.cancellationPolicy ||
        cancellationFromPoliticas(row.politicas) ||
        "Cancelación gratuita hasta 48h antes del check-in.",
      houseRules: Array.isArray(row.houseRules) ? row.houseRules : (demo?.houseRules ?? []),
      minStay: Number(row.minStay) > 0 ? Number(row.minStay) : (demo?.minStay ?? 1),
      maxStay: Number(row.maxStay) > 0 ? Number(row.maxStay) : (demo?.maxStay ?? 30),
      breakfastIncluded:
        typeof row.breakfastIncluded === "boolean" ? row.breakfastIncluded : (demo?.breakfastIncluded ?? false),
      direccion: row.direccion || demo?.direccion,
      lat: typeof row.lat === "number" ? row.lat : demo?.lat,
      lng: typeof row.lng === "number" ? row.lng : demo?.lng,
    };
  });
}

export const store: {
  users: () => Promise<StoredUser[]>;
  saveUsers: (r: StoredUser[]) => Promise<void>;
  sessions: () => Promise<StoredSession[]>;
  saveSessions: (r: StoredSession[]) => Promise<void>;
  listings: () => Promise<StoredListing[]>;
  saveListings: (r: StoredListing[]) => Promise<void>;
  reservations: () => Promise<StoredReservation[]>;
  saveReservations: (r: StoredReservation[]) => Promise<void>;
  leads: () => Promise<StoredLead[]>;
  saveLeads: (r: StoredLead[]) => Promise<void>;
  channels: () => Promise<StoredChannel[]>;
  saveChannels: (r: StoredChannel[]) => Promise<void>;
  ads: () => Promise<StoredAd[]>;
  saveAds: (r: StoredAd[]) => Promise<void>;
  config: () => Promise<AppConfig>;
  saveConfig: (r: AppConfig) => Promise<void>;
  aiConfig: () => Promise<AIConfig>;
  saveAiConfig: (r: AIConfig) => Promise<void>;
  listingChannels: () => Promise<ListingChannel[]>;
  saveListingChannels: (r: ListingChannel[]) => Promise<void>;
  ragDocs: () => Promise<RagDoc[]>;
  saveRagDocs: (r: RagDoc[]) => Promise<void>;
   reviews: () => Promise<StoredReview[]>;
   saveReviews: (r: StoredReview[]) => Promise<void>;
  siteSettings: () => Promise<SiteSettings>;
  saveSiteSettings: (r: SiteSettings) => Promise<void>;
} = {
  users: () => readTable<StoredUser>("users", () => []),
  saveUsers: (r) => writeTable("users", r),
  sessions: () => readTable<StoredSession>("sessions", () => []),
  saveSessions: (r) => writeTable("sessions", r),
  listings: () => readTable<StoredListing>("listings", seedListings).then(normalizeListings),
  saveListings: (r) => writeTable("listings", r),
  reservations: () => readTable<StoredReservation>("reservations", () => []),
  saveReservations: (r) => writeTable("reservations", r),
  leads: () => readTable<StoredLead>("leads", () => []),
  saveLeads: (r) => writeTable("leads", r),
  channels: () => readTable<StoredChannel>("channels", () => []),
  saveChannels: (r) => writeTable("channels", r),
  ads: () =>
    readTable<StoredAd>("ads", () =>
      ADS.map((a, i) => ({ id: `ad-seed-${i}`, empresa: a.empresa, categoria: a.categoria, titulo: a.titulo, texto: a.texto, color: a.color, image: "", active: true })),
    ),
  saveAds: (r) => writeTable("ads", r),
  config: () => readTable<AppConfig>("config", () => [{ rates: { gratuito: 0.1, corporativo: 0.05, premium: 0 } }]).then((rows) => rows[0]),
  saveConfig: (r) => writeTable("config", [r]),
  aiConfig: () =>
    readTable<AIConfig>("ai-config", () => [{ provider: "local", model: "", apiKey: "", baseUrl: "", updatedAt: new Date().toISOString() }]).then(
      (rows) => rows[0],
    ),
  saveAiConfig: (r) => writeTable("ai-config", [r]),
  listingChannels: () => readTable<ListingChannel>("listing-channels", () => []),
  saveListingChannels: (r) => writeTable("listing-channels", r),
  ragDocs: () => readTable<RagDoc>("rag-docs", () => []),
  saveRagDocs: (r) => writeTable("rag-docs", r),
   reviews: () => readTable<StoredReview>("reviews", () => []),
   saveReviews: (r) => writeTable("reviews", r),
  siteSettings: () =>
    readTable<SiteSettings>("site-settings", () => [DEFAULT_SITE_SETTINGS]).then((rows) => mergeSiteSettings(rows[0])),
  saveSiteSettings: (r) => writeTable("site-settings", [{ ...mergeSiteSettings(r), updatedAt: new Date().toISOString() }]),
};

export function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;
}
