import type { StoredListing } from "./store";
import type { ListingTheme } from "./data";

const PRESETS: ListingTheme["preset"][] = ["selva", "mar", "colonial", "urbano", "minimal"];
const HEX = /^#[0-9a-fA-F]{6}$/;

function text(value: unknown, max: number): string | undefined {
  if (typeof value !== "string") return undefined;
  return value.trim().slice(0, max);
}

function number(value: unknown): number | undefined {
  if (value === "" || value === null || value === undefined) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function list(value: unknown, maxItems: number, maxLength: number): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, maxItems)
    .map((item) => item.slice(0, maxLength));
}

function isImageSource(value: string): boolean {
  return /^https?:\/\//i.test(value) || (value.startsWith("/") && !value.startsWith("//"));
}

export type ListingEditLimits = { maxFotos: number; maxDesc: number };

/**
 * Aplica cambios de contenido a un alojamiento existente.
 * Solo toca campos permitidos: identidad, dueño, slug y métricas quedan intactos.
 */
export function applyListingEdit(
  listing: StoredListing,
  body: Record<string, unknown>,
  limits: ListingEditLimits,
): string | null {
  if (body.titulo !== undefined) {
    const titulo = text(body.titulo, 140);
    if (!titulo || titulo.length < 3) return "El título debe tener al menos 3 caracteres.";
    listing.titulo = titulo;
  }

  if (body.descripcion !== undefined) {
    const descripcion = typeof body.descripcion === "string" ? body.descripcion.trim().slice(0, 5000) : "";
    if (descripcion.length > limits.maxDesc) {
      return `Tu plan permite ${limits.maxDesc} caracteres de descripción.`;
    }
    listing.descripcion = descripcion || "Sin descripción.";
  }

  if (body.tipo !== undefined) {
    if (body.tipo !== "reserva" && body.tipo !== "subarriendo") return "Tipo de alojamiento inválido.";
    listing.tipo = body.tipo;
    if (body.tipo === "reserva") listing.precioMes = undefined;
  }

  if (body.categoria !== undefined || body.tipo !== undefined) {
    const categoria = text(body.categoria, 40);
    listing.categoria = listing.tipo === "subarriendo" ? "Subarriendo" : categoria || listing.categoria || "Hostel";
  }

  if (body.ciudad !== undefined) listing.ciudad = text(body.ciudad, 100) || "Por definir";
  if (body.direccion !== undefined) listing.direccion = text(body.direccion, 200) ?? "";

  const precioNoche = number(body.precioNoche);
  if (precioNoche !== undefined) {
    if (precioNoche < 0) return "El precio por noche no puede ser negativo.";
    listing.precioNoche = Math.round(precioNoche);
  }

  if (body.precioMes !== undefined) {
    const precioMes = number(body.precioMes);
    if (precioMes !== undefined && precioMes < 0) return "El precio mensual no puede ser negativo.";
    listing.precioMes = listing.tipo === "subarriendo" && precioMes ? Math.round(precioMes) : undefined;
  }

  const huespedes = number(body.huespedes);
  if (huespedes !== undefined) {
    if (huespedes < 1 || huespedes > 50) return "Los huéspedes deben estar entre 1 y 50.";
    listing.huespedes = Math.round(huespedes);
  }

  if (body.imagenes !== undefined) {
    if (!Array.isArray(body.imagenes)) return "La galería debe ser una lista de imágenes.";
    const imagenes = body.imagenes
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(isImageSource);
    if (imagenes.length === 0) return "Agrega al menos una foto válida (URL http(s) o /ruta).";
    if (imagenes.length > limits.maxFotos) return `Tu plan permite ${limits.maxFotos} fotos.`;
    listing.galeria = imagenes;
    listing.imagen = imagenes[0];
  }

  if (body.amenidades !== undefined) {
    const amenidades = list(body.amenidades, 20, 40);
    if (amenidades === undefined) return "Lista de amenidades inválida.";
    listing.amenidades = amenidades;
  }

  if (body.houseRules !== undefined) {
    const rules = list(body.houseRules, 10, 160);
    if (rules === undefined) return "Lista de reglas inválida.";
    listing.houseRules = rules;
  }

  const checkIn = text(body.checkIn, 10);
  if (checkIn) listing.checkIn = checkIn;
  const checkOut = text(body.checkOut, 10);
  if (checkOut) listing.checkOut = checkOut;

  const minStay = number(body.minStay);
  if (minStay !== undefined) {
    if (minStay < 1 || minStay > 365) return "La estancia mínima debe estar entre 1 y 365 noches.";
    listing.minStay = Math.round(minStay);
  }
  const maxStay = number(body.maxStay);
  if (maxStay !== undefined) {
    if (maxStay < 1 || maxStay > 3650) return "La estancia máxima debe estar entre 1 y 3650 noches.";
    listing.maxStay = Math.round(maxStay);
  }
  if (listing.maxStay < listing.minStay) return "La estancia máxima debe ser mayor o igual a la mínima.";

  if (typeof body.breakfastIncluded === "boolean") listing.breakfastIncluded = body.breakfastIncluded;

  if (body.cancellationPolicy !== undefined) {
    listing.cancellationPolicy = text(body.cancellationPolicy, 500) ?? "";
  }
  if (body.politicas !== undefined) {
    listing.politicas = text(body.politicas, 500) ?? "";
  }

  if (body.theme && typeof body.theme === "object") {
    const theme = body.theme as Record<string, unknown>;
    const primary = typeof theme.primary === "string" && HEX.test(theme.primary) ? theme.primary : listing.theme?.primary ?? "#1d4a2c";
    const accent = typeof theme.accent === "string" && HEX.test(theme.accent) ? theme.accent : listing.theme?.accent ?? "#bef264";
    const preset = PRESETS.includes(theme.preset as ListingTheme["preset"])
      ? (theme.preset as ListingTheme["preset"])
      : listing.theme?.preset ?? "selva";
    listing.theme = {
      primary,
      accent,
      preset,
      font: "sans",
      rationale: text(theme.rationale, 500) ?? listing.theme?.rationale ?? "",
    };
  }

  return null;
}
