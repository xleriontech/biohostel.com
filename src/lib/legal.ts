// Reglas de cumplimiento del marketplace.
// RNT: Decreto 1836 de 2021 (registro y exhibición del número en la oferta).
// Subarriendo: Ley 820 de 2003, artículo 17 (autorización escrita del propietario).

export const LEGAL_VERSION = 1;
export const PRIVACY_VERSION = "2026-10-31";
export const RNT_RE = /^\d{4,20}$/;

export const CONSENT_PURPOSES = [
  "Gestionar la cuenta y la reserva solicitada",
  "Contactarte sobre el alojamiento y la reserva",
  "Prevenir fraude y proteger la seguridad del servicio",
];

type LegalListing = {
  rnt?: string;
  tipo: "reserva" | "subarriendo";
  legalVersion?: number;
  subleaseAuth?: { confirmed: boolean; docName?: string };
};

export function normalizeRnt(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/[\s.]/g, "").trim();
}

export function isValidRnt(value: unknown): boolean {
  return RNT_RE.test(normalizeRnt(value));
}

// Los alojamientos publicados antes de este control (sin legalVersion) se
// mantienen visibles, pero cualquier publicación nueva debe cumplir.
export function requiresCompliance(listing: LegalListing): boolean {
  return listing.legalVersion === LEGAL_VERSION;
}

// Devuelve el motivo por el que no puede publicarse, o null si cumple.
export function legalPublishIssue(listing: LegalListing): string | null {
  if (!requiresCompliance(listing)) return null;
  if (!isValidRnt(listing.rnt)) {
    return "El RNT es obligatorio para publicar (Decreto 1836 de 2021). Escribe el número del Registro Nacional de Turismo.";
  }
  if (listing.tipo === "subarriendo") {
    if (!listing.subleaseAuth?.confirmed) {
      return "Debes declarar que cuentas con autorización escrita del propietario para subarrendar (Ley 820 de 2003, art. 17).";
    }
    if (!listing.subleaseAuth?.docName) {
      return "Adjunta el documento de autorización del propietario antes de publicar un subarriendo.";
    }
  }
  return null;
}
