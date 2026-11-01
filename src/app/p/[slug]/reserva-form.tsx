"use client";

import { useEffect, useRef, useState } from "react";
import type { Alternative, ConflictSource, Quote, StayIssue } from "@/lib/booking-engine";

type ReserveResponse = {
  error?: string;
  issues?: StayIssue[];
  conflicts?: ConflictSource[];
  alternatives?: Alternative[];
  idempotent?: boolean;
  reservation?: { code: string; total: number; status?: string };
  payment?: { required: boolean; status: string; url: string | null; holdUntil: string | null };
  email?: string;
};

type AvailabilityResponse = {
  available?: boolean;
  issues?: StayIssue[];
  conflicts?: ConflictSource[];
  alternatives?: Alternative[];
  quote?: Quote | null;
};

const money = (value: number) => `$${value.toLocaleString("es-CO")} COP`;
const shortDate = (value: string) =>
  new Date(`${value}T12:00:00`).toLocaleDateString("es-CO", { day: "numeric", month: "short" });

function makeRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

const panel = (tone: "ok" | "bad" | "warn" | "muted"): React.CSSProperties => {
  const palette = {
    ok: { background: "var(--tint)", border: "var(--line)", color: "var(--green-deep)" },
    bad: { background: "#fdeae9", border: "#f5bcbc", color: "#7f1d1d" },
    warn: { background: "#fff7e6", border: "#f3d9a4", color: "#7c4a03" },
    muted: { background: "var(--surface-2)", border: "var(--line)", color: "var(--muted)" },
  }[tone];
  return { padding: 12, borderRadius: 10, border: `1px solid ${palette.border}`, background: palette.background, color: palette.color, fontSize: 13.5, lineHeight: 1.55 };
};

const altButton: React.CSSProperties = {
  display: "block",
  width: "100%",
  textAlign: "left",
  padding: "10px 12px",
  borderRadius: 9,
  border: "1px solid var(--line)",
  background: "var(--surface)",
  color: "var(--green)",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  textDecoration: "none",
};

export default function ReservaForm({
  listingId,
  defaultCheckIn,
  defaultCheckOut,
  minStay,
  maxStay,
  maxGuests,
}: {
  listingId: string;
  defaultCheckIn: string;
  defaultCheckOut: string;
  minStay: number;
  maxStay: number;
  maxGuests: number;
}) {
  const [checkIn, setCheckIn] = useState(defaultCheckIn);
  const [checkOut, setCheckOut] = useState(defaultCheckOut);
  const [guests, setGuests] = useState(() => String(Math.min(2, Math.max(1, maxGuests))));
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [extraSeguro, setExtraSeguro] = useState(false);
  const [extraDesayuno, setExtraDesayuno] = useState(false);
  const [consent, setConsent] = useState(false);
  const [reserving, setReserving] = useState(false);
  const [resMsg, setResMsg] = useState("");
  const [resCode, setResCode] = useState("");
  const [resStatus, setResStatus] = useState("");
  const [payUrl, setPayUrl] = useState("");
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [issues, setIssues] = useState<StayIssue[]>([]);
  const [conflicts, setConflicts] = useState<ConflictSource[]>([]);
  const [alternatives, setAlternatives] = useState<Alternative[]>([]);
  const [available, setAvailable] = useState<boolean | null>(null);
  const requestIdRef = useRef("");

  useEffect(() => {
    requestIdRef.current = "";
  }, [checkIn, checkOut, guests]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const rangeValid = !!checkIn && !!checkOut && checkOut > checkIn;
    const timer = window.setTimeout(async () => {
      if (!rangeValid) {
        setChecking(false);
        setQuote(null);
        setAvailable(null);
        setIssues([]);
        setConflicts([]);
        setAlternatives([]);
        setCheckError("");
        return;
      }
      setChecking(true);
      setCheckError("");
      try {
        const params = new URLSearchParams({ listingId, checkIn, checkOut, guests });
        const res = await fetch(`/api/availability?${params.toString()}`, { signal: controller.signal });
        const data = (await res.json()) as AvailabilityResponse;
        if (!active) return;
        if (!res.ok) {
          setCheckError("No pudimos verificar la disponibilidad. El servidor la validará al confirmar.");
          setAvailable(null);
          setIssues([]);
          setConflicts([]);
          setAlternatives([]);
          setQuote(null);
          return;
        }
        setQuote(data.quote ?? null);
        setAvailable(!!data.available);
        setIssues(data.issues ?? []);
        setConflicts(data.conflicts ?? []);
        setAlternatives(data.alternatives ?? []);
      } catch (error) {
        if (active && !(error instanceof DOMException && error.name === "AbortError")) {
          setCheckError("No pudimos verificar la disponibilidad. El servidor la validará al confirmar.");
          setAvailable(null);
          setIssues([]);
          setConflicts([]);
          setAlternatives([]);
          setQuote(null);
        }
      } finally {
        if (active) setChecking(false);
      }
    }, rangeValid ? 350 : 0);
    return () => {
      active = false;
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [listingId, checkIn, checkOut, guests]);

  const rangeValid = !!checkIn && !!checkOut && checkOut > checkIn;
  const activeQuote = rangeValid ? quote : null;
  const extrasTotal =
    (extraSeguro && activeQuote ? Math.round(activeQuote.base * 0.05) : 0) + (extraDesayuno ? 20000 : 0);
  const totalEstimado = activeQuote ? activeQuote.total + extrasTotal : 0;
  const blocked = !rangeValid || available === false || issues.length > 0;

  async function reservarMicro() {
    if (!checkIn || !checkOut || new Date(checkOut) <= new Date(checkIn)) {
      setResMsg("Fechas inválidas.");
      return;
    }
    if (!nombre.trim() || !email.trim() || !telefono.trim()) {
      setResMsg("Completa nombre, email y teléfono para confirmar.");
      return;
    }
    if (!consent) {
      setResMsg("Debes autorizar el tratamiento de tus datos para confirmar la reserva.");
      return;
    }
    if (blocked) {
      setResMsg(issues[0]?.message ?? "Esas fechas no están disponibles. Elige una alternativa.");
      return;
    }
    setReserving(true);
    setResMsg("Verificando disponibilidad...");
    const requestId = requestIdRef.current || makeRequestId();
    requestIdRef.current = requestId;
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          checkIn,
          checkOut,
          guests: Number(guests) || 1,
          extras: { seguro: extraSeguro, desayuno: extraDesayuno },
          nombre: nombre.trim(),
          email: email.trim(),
          telefono: telefono.trim(),
          requestId,
          source: "micrositio",
          consent,
        }),
      });
      const data = (await res.json()) as ReserveResponse;
      if (!res.ok) {
        setResMsg(data.error || "No se pudo reservar (fechas ocupadas o límite).");
        if (data.conflicts) {
          setConflicts(data.conflicts);
          setAvailable(false);
          setIssues(data.issues ?? []);
          setAlternatives(data.alternatives ?? []);
        }
        return;
      }
      requestIdRef.current = "";
      const reservation = data.reservation;
      const status = reservation?.status ?? "confirmada";
      const url = data.payment?.url ?? "";
      setResCode(reservation?.code ?? "");
      setResStatus(status);
      setPayUrl(url);
      if (status === "pendiente_pago") {
        setResMsg(`Reserva creada: ${reservation?.code ?? ""} · Total: ${money(reservation?.total ?? 0)}. Completa el pago para confirmar las fechas.`);
        if (url) window.setTimeout(() => window.location.assign(url), 1200);
      } else {
        setResMsg(`Reserva confirmada: ${reservation?.code ?? ""} · Total: ${money(reservation?.total ?? 0)}`);
      }
    } catch {
      setResMsg("Error de conexión al reservar. Vuelve a intentar.");
    } finally {
      setReserving(false);
    }
  }

  return (
    <div style={{ maxWidth: 620, margin: "0 auto 48px", padding: "32px 24px", background: "var(--surface)", borderRadius: 20, boxShadow: "0 8px 32px rgba(15,23,42,0.08)", border: "1px solid var(--line)" }}>
      <h2 style={{ fontSize: "1.6rem", fontWeight: 900, marginBottom: 8, letterSpacing: "-1px", color: "var(--green)" }}>Reservar tu estadía</h2>
      <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 16, lineHeight: 1.5 }}>
        Verificamos la disponibilidad de este alojamiento y sus calendarios iCal conectados antes de confirmar. La sincronización con Booking o Airbnb depende de los calendarios que el anfitrión mantiene actualizados.
      </p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 140 }}>
          <label htmlFor="res-checkin" style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--green)", marginBottom: 6 }}>Check-in</label>
          <input id="res-checkin" type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid var(--line)", fontSize: 15 }} />
        </div>
        <div style={{ flex: 1, minWidth: 140 }}>
          <label htmlFor="res-checkout" style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--green)", marginBottom: 6 }}>Check-out</label>
          <input id="res-checkout" type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid var(--line)", fontSize: 15 }} />
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <label htmlFor="res-guests" style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--green)", marginBottom: 6 }}>Huéspedes</label>
        <input id="res-guests" type="number" min={1} max={maxGuests} value={guests} onChange={(e) => setGuests(e.target.value)} style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid var(--line)", fontSize: 15 }} />
        <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--muted)" }}>
          Mínimo {minStay} noche{minStay === 1 ? "" : "s"}
          {maxStay > 0 ? ` · máximo ${maxStay} noches` : ""} · hasta {maxGuests} huéspedes.
        </p>
      </div>

      <div aria-live="polite" style={{ marginTop: 14, display: "grid", gap: 8 }}>
        {checking && <div style={panel("muted")}>Verificando disponibilidad…</div>}
        {!checking && checkError && <div style={panel("warn")}>{checkError}</div>}
        {!checking && issues.length > 0 && <div style={panel("warn")}>{issues[0].message}</div>}
        {!checking && available === true && activeQuote && (
          <div style={panel("ok")}>
            <strong>Disponible</strong> · {activeQuote.nights} noche{activeQuote.nights === 1 ? "" : "s"} · total estimado {money(activeQuote.total)}.
          </div>
        )}
        {!checking && available === false && issues.length === 0 && (
          <div style={panel("bad")}>
            <strong>No disponible para esas fechas.</strong>
            {conflicts.length > 0 && (
              <div style={{ marginTop: 4 }}>
                {conflicts.map((c) => `${c.platform}: ${c.dates.join(", ")}`).join(" · ")}
              </div>
            )}
            {alternatives.length > 0 && (
              <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                {alternatives.map((a, i) =>
                  a.listingId === listingId ? (
                    <button
                      key={`f-${i}-${a.checkIn}`}
                      type="button"
                      style={altButton}
                      onClick={() => {
                        setCheckIn(a.checkIn);
                        setCheckOut(a.checkOut);
                        setResMsg("");
                      }}
                    >
                      {a.motivo}: {shortDate(a.checkIn)} → {shortDate(a.checkOut)} · {money(a.precio)}
                    </button>
                  ) : (
                    <a key={`a-${i}-${a.listingId}`} href={`/p/${a.slug}`} style={altButton}>
                      {a.titulo} · {a.ciudad} · {money(a.precio)}
                    </a>
                  ),
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ marginTop: 16 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, fontWeight: 600, color: "var(--ink)", cursor: "pointer" }}>
          <input type="checkbox" checked={extraSeguro} onChange={(e) => setExtraSeguro(e.target.checked)} /> Seguro de cancelación (+5%)
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, fontWeight: 600, color: "var(--ink)", cursor: "pointer", marginTop: 6 }}>
          <input type="checkbox" checked={extraDesayuno} onChange={(e) => setExtraDesayuno(e.target.checked)} /> Desayuno incluido (+$20.000 COP)
        </label>
      </div>

      <div style={{ marginTop: 14 }}>
        <label htmlFor="res-nombre" style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--green)", marginBottom: 6 }}>Nombre completo</label>
        <input id="res-nombre" type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre" style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid var(--line)", fontSize: 15 }} />
      </div>
      <div style={{ marginTop: 14 }}>
        <label htmlFor="res-email" style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--green)", marginBottom: 6 }}>Correo electrónico</label>
        <input id="res-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid var(--line)", fontSize: 15 }} />
      </div>
      <div style={{ marginTop: 14 }}>
        <label htmlFor="res-tel" style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--green)", marginBottom: 6 }}>Teléfono (obligatorio para confirmar)</label>
        <input id="res-tel" type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="+57 300 123 4567" style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid var(--line)", fontSize: 15 }} />
      </div>

      {activeQuote && (
        <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px dashed var(--line)", display: "grid", gap: 6, fontSize: 13.5, color: "var(--ink)" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Alojamiento ({activeQuote.nights} noche{activeQuote.nights === 1 ? "" : "s"})</span>
            <strong>{money(activeQuote.base)}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Comisión plataforma ({Math.round(activeQuote.rate * 100)}%)</span>
            <strong>{money(activeQuote.commission)}</strong>
          </div>
          {extrasTotal > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Extras</span>
              <strong>{money(extrasTotal)}</strong>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, color: "var(--green)", paddingTop: 6, borderTop: "1px solid var(--line)" }}>
            <span>Total</span>
            <strong>{money(totalEstimado)}</strong>
          </div>
        </div>
      )}

      <label style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: "#374151", marginTop: 16, lineHeight: 1.5, cursor: "pointer" }}>
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ marginTop: 3 }} />
        <span>
          Autorizo el tratamiento de mis datos para gestionar esta reserva y contactarme sobre ella.{" "}
          <a href="/privacidad" target="_blank" rel="noreferrer" style={{ color: "var(--green)", textDecoration: "underline" }}>
            Política de Privacidad
          </a>
          .
        </span>
      </label>

      <div style={{ marginTop: 20 }}>
        <button
          type="button"
          disabled={reserving || checking || blocked}
          onClick={reservarMicro}
          style={{ width: "100%", padding: 14, borderRadius: 10, fontWeight: 800, fontSize: 16, background: "var(--ms-primary-solid)", color: "var(--ms-on-primary)", border: "none", cursor: reserving || checking || blocked ? "not-allowed" : "pointer", opacity: reserving || checking || blocked ? 0.6 : 1 }}
        >
          {reserving ? "Reservando..." : checking ? "Verificando..." : "Reservar mi estadía"}
        </button>
        <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--muted)", textAlign: "center", lineHeight: 1.5 }}>
          Si el pago en línea está habilitado, te llevaremos a Wompi. Si no, el anfitrión coordina el pago contigo.
        </p>
      </div>

      {resMsg && (
        <div role="status" style={{ ...panel(resStatus === "pendiente_pago" ? "warn" : resStatus === "confirmada" ? "ok" : "bad"), marginTop: 16 }}>
          <div style={{ fontWeight: 700 }}>{resMsg}</div>
          {resCode && (
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 8, fontSize: 13 }}>
              <a href={`/reserva/${resCode}`} style={{ color: "var(--green)", fontWeight: 700 }}>Ver estado de la reserva</a>
              {payUrl && <a href={payUrl} style={{ color: "var(--green)", fontWeight: 700 }}>Pagar ahora</a>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
