import { updateTable } from "./storage";
import { CONSENT_PURPOSES, PRIVACY_VERSION } from "./legal";

export type ConsentRecord = {
  id: string;
  kind: "registro" | "reserva";
  userId?: string;
  email: string;
  ip: string;
  userAgent: string;
  policyVersion: string;
  purposes: string[];
  acceptedAt: string;
};

export function requestMeta(req: Request): { ip: string; userAgent: string } {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  const ip = req.headers.get("cf-connecting-ip") || forwarded || "desconocida";
  return { ip: ip.slice(0, 100), userAgent: (req.headers.get("user-agent") ?? "").slice(0, 300) };
}

export function newConsentRecord(input: Omit<ConsentRecord, "id" | "policyVersion" | "purposes" | "acceptedAt">): ConsentRecord {
  return {
    ...input,
    id: `con-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
    policyVersion: PRIVACY_VERSION,
    purposes: CONSENT_PURPOSES,
    acceptedAt: new Date().toISOString(),
  };
}

// Registro append-only de consentimientos. Se conserva completo para auditoría.
export async function appendConsent(record: ConsentRecord): Promise<boolean> {
  try {
    await updateTable<ConsentRecord, true>("consent-logs", () => [], (rows) => ({
      rows: [record, ...rows].slice(0, 20000),
      result: true,
    }));
    return true;
  } catch {
    return false;
  }
}
