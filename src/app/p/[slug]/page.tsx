import Link from "next/link";
import { notFound } from "next/navigation";
import { store } from "@/lib/store";
import { Suspense } from "react";
import ReservaForm from "./reserva-form";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const listings = await store.listings();
  const l = listings.find((x) => x.slug === slug || x.id === slug);
  if (!l) return { title: "No encontrado" };
  return { title: `${l.titulo} — Micrositio independiente` };
}

export default async function MiniSite({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const listings = await store.listings();
  const listing = listings.find((l) => l.slug === slug || l.id === slug);
  if (!listing) notFound();
  const p = (listing.theme?.primary) || "#1d4a2c";
  return (
    <>
      <head>
        <title>{`${listing.titulo} — Micrositio`}</title>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context":"https://schema.org","@type":"LodgingBusiness","name":listing.titulo,"url":"/p/"+(listing.slug||listing.id),"address":{"@type":"PostalAddress","addressLocality":listing.ciudad},"aggregateRating":{"@type":"AggregateRating","ratingValue":listing.rating,"reviewCount":listing.resenas},"image":listing.galeria[0],"amenityFeature":listing.amenidades.map((a:string)=>({"@type":"LocationFeatureSpecification","name":a})) }) }} />
      </head>
      <main style={{ fontFamily: "system-ui, sans-serif", background: "#f7fdf4", color: "#1a2e22" }}>
        <header style={{ padding: 20, display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.92)", position: "sticky", top: 0, zIndex: 50 }}>
          <Link href="/" style={{ fontWeight: 900, fontSize: 18, color: p, textDecoration: "none" }}>{listing.titulo}</Link>
          <Link href="/" style={{ fontWeight: 700, fontSize: 14, color: p, textDecoration: "underline" }}>Volver</Link>
        </header>
        <section style={{ background: `linear-gradient(135deg, ${p}, #bef264 70%, #bef264)`, color: "#fff", textAlign: "center", padding: "80px 24px", position: "relative" }}>
          <img src={listing.galeria[0]} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.15, filter: "blur(2px)" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <h1 style={{ fontSize: "clamp(36px,6vw,68px)", fontWeight: 900, marginBottom: 16 }}>{listing.titulo}</h1>
            <p style={{ fontSize: "1.2rem", opacity: 0.95, maxWidth: 640, margin: "0 auto" }}>{listing.descripcion}</p>
            <div style={{ marginTop: 24, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <span style={{ background: "#fff", color: p, padding: "6px 14px", borderRadius: 999, fontWeight: 700, fontSize: 12 }}>{listing.categoria}</span>
              <span style={{ background: "rgba(255,255,255,0.2)", color: "#fff", padding: "6px 14px", borderRadius: 999, fontWeight: 700, fontSize: 12, border: "1px solid rgba(255,255,255,0.3)" }}>{listing.ciudad}</span>
            </div>
          </div>
        </section>
        <div style={{ maxWidth: 980, margin: "0 auto", padding: "64px 24px" }}>
          <h2 style={{ fontSize: "2rem", fontWeight: 800, color: p }}>Galería</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
            {listing.galeria.slice(0, 4).map((src: string, i: number) => (
              <a key={i} href={src} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                <img src={src} alt="" loading="lazy" style={{ width: "100%", height: 240, objectFit: "cover", borderRadius: 16 }} />
              </a>
            ))}
          </div>
        </div>
        <div style={{ maxWidth: 980, margin: "0 auto", padding: "64px 24px", background: "#fff", borderRadius: 24, boxShadow: "0 6px 32px rgba(26,46,34,0.05)", border: "1px solid rgba(26,46,34,0.06)" }}>
          <h2 style={{ fontSize: "2rem", fontWeight: 800, color: p }}>Amenidades</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {listing.amenidades.map((a: string, i: number) => (
              <span key={i} style={{ background: `${a}18`, border: `1px solid ${p}18`, color: p, padding: "8px 16px", borderRadius: 999, fontSize: 14, fontWeight: 600 }}>{a}</span>
            ))}
          </div>
        </div>
        <div style={{ maxWidth: 980, margin: "0 auto", padding: "64px 24px" }}>
          <h2 style={{ fontSize: "2rem", fontWeight: 800, color: p }}>Experiencias</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
            <a href="#" style={{ textDecoration: "none", color: "inherit" }}><h3>Naturaleza</h3></a>
            <a href="#" style={{ textDecoration: "none", color: "inherit" }}><h3>Yoga / Bienestar</h3></a>
            <a href="#" style={{ textDecoration: "none", color: "inherit" }}><h3>Gastronomía</h3></a>
          </div>
        </div>
        <div id="reserva" style={{ maxWidth: 980, margin: "0 auto", padding: "72px 24px", textAlign: "center" }}>
          <Suspense>
            <ReservaForm listingId={listing.id} />
          </Suspense>
        </div>
        <footer style={{ textAlign: "center", padding: 48, background: "#1a2e22", color: "#fff" }}>
          <p style={{ fontWeight: 700 }}>{listing.titulo}</p>
          <p><Link href="/" style={{ color: "#fff", textDecoration: "underline" }}>BioHostel.com</Link> · <a href="https://www.google.com/maps/search/?api=1&query=Tropical+Biohostel+Nocaima" target="_blank" rel="noopener noreferrer" style={{ color: "#fff", textDecoration: "underline" }}>Ver en Google Maps</a></p>
        </footer>
      </main>
    </>
  );
}
