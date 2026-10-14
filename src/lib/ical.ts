// Parser iCal mínimo: extrae fechas ocupadas (VEVENT con DTSTART/DTEND o DTSTART;VALUE=DATE).
export function parseIcalDates(ics: string): string[] {
  const days = new Set<string>();
  const text = ics.replace(/\r\n[ \t]/g, "").replace(/\r/g, "\n");
  const starts: string[] = [];
  const ends: string[] = [];
  for (const m of text.matchAll(/DTSTART[^:]*:(\d{8})(T\d{6}Z?)?/g)) starts.push(m[1]);
  for (const m of text.matchAll(/DTEND[^:]*:(\d{8})(T\d{6}Z?)?/g)) ends.push(m[1]);
  const toDate = (s: string) => new Date(`${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T12:00:00Z`);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  for (let i = 0; i < starts.length; i++) {
    const ini = toDate(starts[i]);
    const fin = ends[i] ? toDate(ends[i]) : new Date(ini.getTime() + 864e5);
    for (let d = new Date(ini); d < fin; d = new Date(d.getTime() + 864e5)) {
      days.add(fmt(d));
    }
    if (days.size > 730) break;
  }
  return [...days].sort();
}

export async function fetchIcalDates(url: string): Promise<string[]> {
  const res = await fetch(url.trim(), {
    headers: { "User-Agent": "BioHostelSync/1.0" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  if (!/BEGIN:VCALENDAR/i.test(text)) throw new Error("No es un calendario iCal válido.");
  return parseIcalDates(text);
}

// Feed iCal que el anfitrión conecta en Airbnb/Booking para devolver los bloqueos
export function buildIcalFeed(listingTitle: string, reservations: { checkIn: string; checkOut: string; code: string }[]) {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const evts = reservations
    .map((r) => {
      const f = (s: string) => s.replace(/-/g, "");
      return ["BEGIN:VEVENT", `UID:${r.code}@biohostel.com`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${f(r.checkIn)}`, `DTEND;VALUE=DATE:${f(r.checkOut)}`, `SUMMARY:Reservada BioHostel ${r.code} - ${listingTitle.slice(0, 40)}`, "END:VEVENT"].join("\r\n");
    })
    .join("\r\n");
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//BioHostel//RAG Sync//ES", "CALSCALE:GREGORIAN", evts, "END:VCALENDAR"].filter(Boolean).join("\r\n");
}
