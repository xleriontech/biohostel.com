import { fetchIcalDates } from "./ical";
import { store } from "./store";
import { updateTable } from "./storage";
import type { ListingChannel } from "./store";

const DEFAULT_MAX_AGE = 20 * 60 * 1000;

function isStale(channel: ListingChannel, now: number, maxAgeMs: number): boolean {
  if (!channel.icalUrl) return false;
  if (!channel.lastSync || channel.lastSync === "nunca") return true;
  const last = new Date(channel.lastSync).getTime();
  return !Number.isFinite(last) || now - last > maxAgeMs;
}

async function syncChannel(channel: ListingChannel, timeoutMs: number): Promise<boolean> {
  try {
    const occupied = await fetchIcalDates(channel.icalUrl, timeoutMs);
    await updateTable<ListingChannel, true>("listing-channels", () => [], (rows) => {
      const index = rows.findIndex((row) => row.id === channel.id);
      if (index < 0) return null;
      rows[index] = { ...rows[index], occupied, lastSync: new Date().toISOString() };
      return { rows, result: true };
    });
    return true;
  } catch {
    return false;
  }
}

// Refresca los canales vencidos de un alojamiento antes de calcular disponibilidad.
export async function syncListingChannels(
  listingId: string,
  options: { maxAgeMs?: number; timeoutMs?: number; limit?: number } = {},
): Promise<number> {
  const maxAgeMs = options.maxAgeMs ?? DEFAULT_MAX_AGE;
  const timeoutMs = options.timeoutMs ?? 4000;
  const limit = options.limit ?? 2;
  const now = Date.now();
  const channels = (await store.listingChannels()).filter(
    (channel) => channel.listingId === listingId && isStale(channel, now, maxAgeMs),
  );
  const results = await Promise.all(channels.slice(0, limit).map((channel) => syncChannel(channel, timeoutMs)));
  return results.filter(Boolean).length;
}

// Refresca los canales más vencidos de todo el catálogo (búsqueda de la landing).
export async function syncStaleChannels(options: { maxAgeMs?: number; timeoutMs?: number; limit?: number } = {}): Promise<number> {
  const maxAgeMs = options.maxAgeMs ?? DEFAULT_MAX_AGE;
  const timeoutMs = options.timeoutMs ?? 2500;
  const limit = options.limit ?? 3;
  const now = Date.now();
  const stale = (await store.listingChannels())
    .filter((channel) => isStale(channel, now, maxAgeMs))
    .sort((a, b) => new Date(a.lastSync === "nunca" ? 0 : a.lastSync).getTime() - new Date(b.lastSync === "nunca" ? 0 : b.lastSync).getTime());
  const results = await Promise.all(stale.slice(0, limit).map((channel) => syncChannel(channel, timeoutMs)));
  return results.filter(Boolean).length;
}
