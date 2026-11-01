import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { store } from "@/lib/store";
import { Suspense } from "react";
import ReservaForm from "./reserva-form";
import { ReviewsSection } from "src/components/ReviewsSection";
import AvailabilityCalendar from "./availability-calendar";
import { defaultStayRange } from "@/lib/dates";
import { mergeOccupied, occupancySources } from "@/lib/booking-engine";
import { micrositeThemeCss } from "@/lib/microsite-theme";
import { isTropicalBiohostel, TROPICAL_BRAND_LABEL } from "@/components/tropical-brand";
import TropicalMiniSite from "./tropical-mini-site";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [listings, settings] = await Promise.all([store.listings(), store.siteSettings()]);
  const l = listings.find((x) => x.slug === slug || x.id === slug);
  if (!l) return { title: "No encontrado" };
  const url = `/p/${l.slug || l.id}`;
  const brandName = isTropicalBiohostel(l) ? TROPICAL_BRAND_LABEL : `${settings.brand.name}${settings.brand.suffix}`;
  const title = `${l.titulo} — ${brandName}`;
  const description = l.descripcion.slice(0, 160);
  const image = l.galeria[0];
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: brandName,
      locale: "es_CO",
      url,
      title,
      description,
      ...(image ? { images: [{ url: image, alt: l.titulo }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}


  
  

  
  

  

  
      
      
          
      
export default async function MiniSite({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [listings, settings, channels, reservations] = await Promise.all([
    store.listings(),
    store.siteSettings(),
    store.listingChannels(),
    store.reservations(),
  ]);
  const listing = listings.find((l) => l.slug === slug || l.id === slug);
  if (!listing) notFound();
  const brandName = `${settings.brand.name}${settings.brand.suffix}`;
  const minStay = Number(listing.minStay) > 0 ? Number(listing.minStay) : 1;
  const maxStay = Number(listing.maxStay) > 0 ? Number(listing.maxStay) : 0;
  const maxGuests = Math.max(1, Number(listing.huespedes) || 1);
  const listingChannels = channels.filter((c) => c.listingId === listing.id);
  const occupied = mergeOccupied(listing, listingChannels, reservations);
  const blockSources = occupancySources(listing, listingChannels, reservations);
  const cancellationPolicy = (listing.cancellationPolicy || listing.politicas || "").trim();
  const houseRules = (listing.houseRules ?? []).filter((r): r is string => typeof r === "string" && r.trim().length > 0);
  const mapsQuery = listing.direccion?.trim() || `${listing.ciudad}, Colombia`;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`;
  const mapCenter =
    typeof listing.lat === "number" && typeof listing.lng === "number" ? `${listing.lat},${listing.lng}` : mapsQuery;
  const { checkIn: defaultCheckIn, checkOut: defaultCheckOut } = defaultStayRange(Math.min(minStay, 365));
  const experiences = [
    { titulo: "Naturaleza", desc: "Actividades al aire libre y entorno natural de la zona." },
    { titulo: "Yoga / Bienestar", desc: "Espacios de descanso y prácticas de bienestar." },
    { titulo: "Gastronomía", desc: "Sabores y productos locales del territorio." },
  ];
  const sections = [
    { label: "Inicio", href: "#inicio" },
    { label: "Estancia", href: "#estancia" },
    ...(listing.amenidades.length ? [{ label: "Amenidades", href: "#amenidades" }] : []),
    { label: "Experiencias", href: "#experiencias" },
    { label: "Disponibilidad", href: "#disponibilidad" },
    { label: "Reseñas", href: "#resenas" },
  ];

  if (isTropicalBiohostel(listing)) {
    return (
      <TropicalMiniSite
        listing={listing}
        mapsUrl={mapsUrl}
        mapCenter={mapCenter}
        minStay={minStay}
        maxStay={maxStay}
        maxGuests={maxGuests}
        cancellationPolicy={cancellationPolicy}
        houseRules={houseRules}
        occupied={occupied}
        blockSources={blockSources}
        defaultCheckIn={defaultCheckIn}
        defaultCheckOut={defaultCheckOut}
      />
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: micrositeThemeCss(listing.theme ?? {}) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context":"https://schema.org","@type":"LodgingBusiness","name":listing.titulo,"url":"/p/"+(listing.slug||listing.id),"address":{"@type":"PostalAddress","addressLocality":listing.ciudad},"aggregateRating":{"@type":"AggregateRating","ratingValue":listing.rating,"reviewCount":listing.resenas},"image":listing.galeria[0],"amenityFeature":listing.amenidades.map((a:string)=>({"@type":"LocationFeatureSpecification","name":a})) }) }} />
      <main className="ms-theme" style={{ fontFamily: "var(--sans)", background: "var(--cream)", color: "var(--ink)" }}>
        <header style={{ padding: "12px 20px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", background: "color-mix(in srgb, var(--surface) 95%, transparent)", backdropFilter: "blur(8px)", borderBottom: "1px solid var(--line)", position: "sticky", top: 0, zIndex: 50 }}>
          <Link href="/" title={listing.titulo} style={{ fontWeight: 900, fontSize: 16, color: "var(--green)", textDecoration: "none", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{listing.titulo}</Link>
          <nav className="ms-nav" aria-label="Secciones del alojamiento">
            {sections.map((s) => <a key={s.href} href={s.href}>{s.label}</a>)}
          </nav>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link href="/" style={{ fontWeight: 700, fontSize: 13, color: "var(--green)", textDecoration: "none" }}>Volver</Link>
            <a href="#reserva" style={{ background: "var(--ms-primary-solid)", color: "var(--ms-on-primary)", fontWeight: 700, fontSize: 13, textDecoration: "none", padding: "9px 16px", borderRadius: 999 }}>Reservar</a>
          </div>
        </header>
        <section id="inicio" style={{ scrollMarginTop: 84, background: "linear-gradient(135deg, var(--green-deep), var(--green) 55%, var(--emerald))", color: "var(--ms-on-primary)", textAlign: "center", padding: "80px 24px", position: "relative" }}>
          <img src={listing.galeria[0]} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.15, filter: "blur(2px)" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <h1 style={{ fontSize: "clamp(36px,6vw,68px)", fontWeight: 900, marginBottom: 16 }}>{listing.titulo}</h1>
            <p style={{ fontSize: "1.2rem", opacity: 0.95, maxWidth: 640, margin: "0 auto" }}>{listing.descripcion}</p>
            <div style={{ marginTop: 24, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <span style={{ background: "var(--surface)", color: "var(--green)", padding: "6px 14px", borderRadius: 999, fontWeight: 700, fontSize: 12 }}>{listing.categoria}</span>
              <span style={{ background: "color-mix(in srgb, var(--surface) 22%, transparent)", color: "var(--ms-on-primary)", padding: "6px 14px", borderRadius: 999, fontWeight: 700, fontSize: 12, border: "1px solid color-mix(in srgb, var(--surface) 32%, transparent)" }}>{listing.ciudad}</span>
              <span style={{ background: "var(--surface)", color: "var(--ink)", padding: "6px 14px", borderRadius: 999, fontWeight: 700, fontSize: 12 }}>
                Check-in {listing.checkIn || "por confirmar"}
              </span>
              <span style={{ background: "var(--surface)", color: "var(--ink)", padding: "6px 14px", borderRadius: 999, fontWeight: 700, fontSize: 12 }}>
                Check-out {listing.checkOut || "por confirmar"}
              </span>
            </div>
          </div>
        </section>
        <div id="estancia" style={{ maxWidth: 980, margin: "0 auto", padding: "64px 24px", scrollMarginTop: 84 }}>
          <section style={{ marginBottom: 32, background: "var(--surface)", borderRadius: 20, padding: 24, border: "1px solid var(--line)" }}>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--green)", marginBottom: 16, fontFamily: "var(--display)" }}>Información de estancia</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
                <div>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", display: "block", marginBottom: 4 }}>Check-in</span>
                  <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--ink)" }}>{listing.checkIn || "Por confirmar"}</span>
                </div>
                <div>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", display: "block", marginBottom: 4 }}>Check-out</span>
                  <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--ink)" }}>{listing.checkOut || "Por confirmar"}</span>
                </div>
                <div>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", display: "block", marginBottom: 4 }}>Mín. estancia</span>
                  <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--ink)" }}>{minStay} noche{minStay > 1 ? "s" : ""}</span>
                </div>
                <div>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", display: "block", marginBottom: 4 }}>Desayuno</span>
                  <span style={{ fontSize: "16px", fontWeight: 700, color: listing.breakfastIncluded ? "var(--green)" : "var(--muted)" }}>
                    {listing.breakfastIncluded ? "Incluido" : "No incluido"}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", display: "block", marginBottom: 4 }}>RNT · Registro Nacional de Turismo</span>
                  <span style={{ fontSize: "16px", fontWeight: 700, color: listing.rnt ? "var(--ink)" : "#92400e" }}>
                    {listing.rnt || "Pendiente de registro"}
                  </span>
                </div>
              </div>
              {!listing.rnt && (
                <p style={{ fontSize: 12, color: "#92400e", margin: "10px 0 0" }}>
                  Este alojamiento es anterior al control de RNT. El número se publicará cuando el anfitrión lo registre.
                </p>
              )}
              {cancellationPolicy && (
                <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid var(--line)" }}>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", display: "block", marginBottom: 8 }}>Política de cancelación</span>
                  <p style={{ fontSize: "14px", lineHeight: 1.6, color: "var(--ink)", margin: 0 }}>{cancellationPolicy}</p>
                </div>
              )}

              {houseRules.length > 0 && (
                <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid var(--line)" }}>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", display: "block", marginBottom: 8 }}>Reglas de la casa</span>
                  <ul style={{ margin: 0, paddingLeft: 18, color: "var(--ink)", fontSize: "14px", lineHeight: 1.8 }}>
                    {houseRules.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid var(--line)" }}>
                <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", display: "block", marginBottom: 8 }}>Ubicación</span>
                <p style={{ fontSize: "14px", color: "var(--ink)", margin: "0 0 12px 0" }}>{listing.direccion || `${listing.ciudad}, Colombia (ubicación aproximada)`}</p>
                <div style={{ width: "100%", height: 240, borderRadius: 16, overflow: "hidden", border: "1px solid var(--line)", background: "var(--surface-2)" }}>
                  <iframe
                    title="Ubicación"
                    style={{ width: "100%", height: "100%", border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    src={`https://www.google.com/maps?q=${encodeURIComponent(mapCenter)}&z=15&output=embed`}
                  />
                </div>
              </div>
            </section>
        </div>
        <div id="amenidades" style={{ maxWidth: 980, margin: "0 auto", padding: "64px 24px", background: "var(--surface)", borderRadius: 24, boxShadow: "0 6px 32px color-mix(in srgb, var(--green) 6%, transparent)", border: "1px solid var(--line)", scrollMarginTop: 84 }}>
          <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--green)" }}>Amenidades</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {listing.amenidades.map((a: string, i: number) => (
              <span key={i} style={{ background: "var(--tint)", border: "1px solid var(--line)", color: "var(--green)", padding: "8px 16px", borderRadius: 999, fontSize: 14, fontWeight: 600 }}>{a}</span>
            ))}
          </div>
        </div>
        <div id="experiencias" style={{ maxWidth: 980, margin: "0 auto", padding: "64px 24px", scrollMarginTop: 84 }}>
          <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--green)" }}>Experiencias</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            {experiences.map((exp) => (
              <div key={exp.titulo} style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 16, padding: 20 }}>
                <h3 style={{ margin: 0, color: "var(--green)" }}>{exp.titulo}</h3>
                <p style={{ margin: "8px 0 0", color: "var(--muted)", fontSize: 14, lineHeight: 1.5 }}>{exp.desc} Consulta con el anfitrión al reservar.</p>
              </div>
            ))}
          </div>
          <a href="#reserva" style={{ display: "inline-block", marginTop: 20, fontWeight: 700, color: "var(--green)", textDecoration: "underline" }}>
            Consultar disponibilidad y reservar →
          </a>

          <div style={{ position: "sticky", top: 100 }}>
            <div id="reserva" style={{ maxWidth: 980, margin: "0 auto", padding: "72px 24px", textAlign: "center", background: "var(--surface)", borderRadius: 24, boxShadow: "0 6px 32px color-mix(in srgb, var(--green) 6%, transparent)", border: "1px solid var(--line)", scrollMarginTop: 84 }}>
              <Suspense>
                <ReservaForm
                  listingId={listing.id}
                  defaultCheckIn={defaultCheckIn}
                  defaultCheckOut={defaultCheckOut}
                  minStay={minStay}
                  maxStay={maxStay}
                  maxGuests={maxGuests}
                />
              </Suspense>
            </div>

            <div id="disponibilidad" style={{ scrollMarginTop: 84 }}>
              <AvailabilityCalendar listing={listing} occupied={occupied} sources={blockSources} />
            </div>

            <div id="resenas" style={{ scrollMarginTop: 84 }}>
              <ReviewsSection listingId={listing.id} />
            </div>
          </div>
          </div>

        <footer style={{ textAlign: "center", padding: 48, background: "var(--green-deep)", color: "var(--ms-on-primary)" }}>
          <p style={{ fontWeight: 700 }}>{listing.titulo}</p>
          <p><Link href="/" style={{ color: "inherit", textDecoration: "underline" }}>{brandName}</Link> · <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "underline" }}>Ver en Google Maps</a></p>
        </footer>
      </main>
    </>
  );
}
