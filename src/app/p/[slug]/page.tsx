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

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [listings, settings] = await Promise.all([store.listings(), store.siteSettings()]);
  const l = listings.find((x) => x.slug === slug || x.id === slug);
  if (!l) return { title: "No encontrado" };
  const url = `/p/${l.slug || l.id}`;
  const brandName = `${settings.brand.name}${settings.brand.suffix}`;
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
  const [listings, settings] = await Promise.all([store.listings(), store.siteSettings()]);
  const listing = listings.find((l) => l.slug === slug || l.id === slug);
  if (!listing) notFound();
  const brandName = `${settings.brand.name}${settings.brand.suffix}`;
  const p = (listing.theme?.primary) || "#1d4a2c";
  const minStay = Number(listing.minStay) > 0 ? Number(listing.minStay) : 1;
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
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context":"https://schema.org","@type":"LodgingBusiness","name":listing.titulo,"url":"/p/"+(listing.slug||listing.id),"address":{"@type":"PostalAddress","addressLocality":listing.ciudad},"aggregateRating":{"@type":"AggregateRating","ratingValue":listing.rating,"reviewCount":listing.resenas},"image":listing.galeria[0],"amenityFeature":listing.amenidades.map((a:string)=>({"@type":"LocationFeatureSpecification","name":a})) }) }} />
      <main style={{ fontFamily: "var(--sans)", background: "#f7fdf4", color: "#1a2e22" }}>
        <header style={{ padding: "12px 20px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", background: "rgba(255,255,255,0.95)", backdropFilter: "blur(8px)", borderBottom: `1px solid ${p}1a`, position: "sticky", top: 0, zIndex: 50 }}>
          <Link href="/" title={listing.titulo} style={{ fontWeight: 900, fontSize: 16, color: p, textDecoration: "none", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{listing.titulo}</Link>
          <nav className="ms-nav" aria-label="Secciones del alojamiento">
            {sections.map((s) => <a key={s.href} href={s.href}>{s.label}</a>)}
          </nav>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link href="/" style={{ fontWeight: 700, fontSize: 13, color: p, textDecoration: "none" }}>Volver</Link>
            <a href="#reserva" style={{ background: p, color: "#fff", fontWeight: 700, fontSize: 13, textDecoration: "none", padding: "9px 16px", borderRadius: 999 }}>Reservar</a>
          </div>
        </header>
        <section id="inicio" style={{ scrollMarginTop: 84, background: `linear-gradient(135deg, ${p}, #bef264 70%, #bef264)`, color: "#fff", textAlign: "center", padding: "80px 24px", position: "relative" }}>
          <img src={listing.galeria[0]} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.15, filter: "blur(2px)" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <h1 style={{ fontSize: "clamp(36px,6vw,68px)", fontWeight: 900, marginBottom: 16 }}>{listing.titulo}</h1>
            <p style={{ fontSize: "1.2rem", opacity: 0.95, maxWidth: 640, margin: "0 auto" }}>{listing.descripcion}</p>
            <div style={{ marginTop: 24, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <span style={{ background: "#fff", color: p, padding: "6px 14px", borderRadius: 999, fontWeight: 700, fontSize: 12 }}>{listing.categoria}</span>
              <span style={{ background: "rgba(255,255,255,0.2)", color: "#fff", padding: "6px 14px", borderRadius: 999, fontWeight: 700, fontSize: 12, border: "1px solid rgba(255,255,255,0.3)" }}>{listing.ciudad}</span>
              <span style={{ background: "#fff", color: "#1a2e22", padding: "6px 14px", borderRadius: 999, fontWeight: 700, fontSize: 12 }}>
                Check-in {listing.checkIn || "por confirmar"}
              </span>
              <span style={{ background: "#fff", color: "#1a2e22", padding: "6px 14px", borderRadius: 999, fontWeight: 700, fontSize: 12 }}>
                Check-out {listing.checkOut || "por confirmar"}
              </span>
            </div>
          </div>
        </section>
        <div id="estancia" style={{ maxWidth: 980, margin: "0 auto", padding: "64px 24px", scrollMarginTop: 84 }}>
          <section style={{ marginBottom: 32, background: "#fff", borderRadius: 20, padding: 24, border: `1px solid ${p}18` }}>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: p, marginBottom: 16, fontFamily: "var(--display)" }}>Información de estancia</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
                <div>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#6b7280", display: "block", marginBottom: 4 }}>Check-in</span>
                  <span style={{ fontSize: "16px", fontWeight: 700, color: "#1a2e22" }}>{listing.checkIn || "Por confirmar"}</span>
                </div>
                <div>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#6b7280", display: "block", marginBottom: 4 }}>Check-out</span>
                  <span style={{ fontSize: "16px", fontWeight: 700, color: "#1a2e22" }}>{listing.checkOut || "Por confirmar"}</span>
                </div>
                <div>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#6b7280", display: "block", marginBottom: 4 }}>Mín. estancia</span>
                  <span style={{ fontSize: "16px", fontWeight: 700, color: "#1a2e22" }}>{minStay} noche{minStay > 1 ? "s" : ""}</span>
                </div>
                <div>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#6b7280", display: "block", marginBottom: 4 }}>Desayuno</span>
                  <span style={{ fontSize: "16px", fontWeight: 700, color: listing.breakfastIncluded ? "#15803d" : "#6b7280" }}>
                    {listing.breakfastIncluded ? "Incluido" : "No incluido"}
                  </span>
                </div>
              </div>
              {cancellationPolicy && (
                <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${p}18` }}>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#6b7280", display: "block", marginBottom: 8 }}>Política de cancelación</span>
                  <p style={{ fontSize: "14px", lineHeight: 1.6, color: "#374151", margin: 0 }}>{cancellationPolicy}</p>
                </div>
              )}

              {houseRules.length > 0 && (
                <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${p}18` }}>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#6b7280", display: "block", marginBottom: 8 }}>Reglas de la casa</span>
                  <ul style={{ margin: 0, paddingLeft: 18, color: "#374151", fontSize: "14px", lineHeight: 1.8 }}>
                    {houseRules.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${p}18` }}>
                <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#6b7280", display: "block", marginBottom: 8 }}>Ubicación</span>
                <p style={{ fontSize: "14px", color: "#374151", margin: "0 0 12px 0" }}>{listing.direccion || `${listing.ciudad}, Colombia (ubicación aproximada)`}</p>
                <div style={{ width: "100%", height: 240, borderRadius: 16, overflow: "hidden", border: `1px solid ${p}18`, background: "#f3f4f6" }}>
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
        <div id="amenidades" style={{ maxWidth: 980, margin: "0 auto", padding: "64px 24px", background: "#fff", borderRadius: 24, boxShadow: "0 6px 32px rgba(26,46,34,0.05)", border: "1px solid rgba(26,46,34,0.06)", scrollMarginTop: 84 }}>
          <h2 style={{ fontSize: "2rem", fontWeight: 800, color: p }}>Amenidades</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {listing.amenidades.map((a: string, i: number) => (
              <span key={i} style={{ background: `${p}18`, border: `1px solid ${p}18`, color: p, padding: "8px 16px", borderRadius: 999, fontSize: 14, fontWeight: 600 }}>{a}</span>
            ))}
          </div>
        </div>
        <div id="experiencias" style={{ maxWidth: 980, margin: "0 auto", padding: "64px 24px", scrollMarginTop: 84 }}>
          <h2 style={{ fontSize: "2rem", fontWeight: 800, color: p }}>Experiencias</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            {experiences.map((exp) => (
              <div key={exp.titulo} style={{ background: "#fff", border: `1px solid ${p}18`, borderRadius: 16, padding: 20 }}>
                <h3 style={{ margin: 0, color: p }}>{exp.titulo}</h3>
                <p style={{ margin: "8px 0 0", color: "#4b6354", fontSize: 14, lineHeight: 1.5 }}>{exp.desc} Consulta con el anfitrión al reservar.</p>
              </div>
            ))}
          </div>
          <a href="#reserva" style={{ display: "inline-block", marginTop: 20, fontWeight: 700, color: p, textDecoration: "underline" }}>
            Consultar disponibilidad y reservar →
          </a>

          <div style={{ position: "sticky", top: 100 }}>
            <div id="reserva" style={{ maxWidth: 980, margin: "0 auto", padding: "72px 24px", textAlign: "center", background: "#fff", borderRadius: 24, boxShadow: "0 6px 32px rgba(26,46,34,0.05)", border: "1px solid rgba(26,46,34,0.06)", scrollMarginTop: 84 }}>
              <Suspense>
                <ReservaForm listingId={listing.id} defaultCheckIn={defaultCheckIn} defaultCheckOut={defaultCheckOut} />
              </Suspense>
            </div>

            <div id="disponibilidad" style={{ scrollMarginTop: 84 }}>
              <AvailabilityCalendar listing={listing} />
            </div>

            <div id="resenas" style={{ scrollMarginTop: 84 }}>
              <ReviewsSection listingId={listing.id} />
            </div>
          </div>
          </div>

        <footer style={{ textAlign: "center", padding: 48, background: "#1a2e22", color: "#fff" }}>
          <p style={{ fontWeight: 700 }}>{listing.titulo}</p>
          <p><Link href="/" style={{ color: "#fff", textDecoration: "underline" }}>{brandName}</Link> · <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#fff", textDecoration: "underline" }}>Ver en Google Maps</a></p>
        </footer>
      </main>
    </>
  );
}
