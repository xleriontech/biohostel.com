import { Metadata } from "next";
import { notFound } from "next/navigation";
import { store } from "@/lib/store";
import { Icon } from "@/app/icons";

function fmtMiles(n: number) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const listings = await store.listings();
  const listing = listings.find((l) => l.slug === slug);
  if (!listing) return { title: "No encontrado" };
  return {
    title: `${listing.titulo} | BioHostel.com`,
    description: listing.descripcion.slice(0, 160),
    openGraph: {
      title: listing.titulo,
      description: listing.descripcion.slice(0, 160),
      images: listing.galeria.length > 0 ? [listing.galeria[0]] : [],
    },
  };
}

export default async function MiniSite({ params }: Props) {
  const { slug } = await params;
  const listings = await store.listings();
  const listing = listings.find((l) => l.slug === slug);
  if (!listing) notFound();

  const theme = (listing as { theme?: { primary?: string; accent?: string } }).theme;
  const primary = theme?.primary ?? "#1d4a2c";
  const accent = theme?.accent ?? "#bef264";

  function money(n: number) {
    return `$${n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} COP`;
  }

  return (
    <html lang="es">
      <head>
        <style dangerouslySetInnerHTML={{
          __html: `
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: system-ui, sans-serif; background: #f7fdf4; color: #1a2e22; }
            .hero { min-height: 60vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, ${primary}, ${accent} 60%, ${accent}); color: #fff; text-align: center; padding: 40px 20px; }
            .hero h1 { font-size: clamp(32px, 5vw, 48px); font-weight: 800; margin-bottom: 16px; }
            .hero p { font-size: 1.1rem; opacity: 0.95; max-width: 600px; margin: 0 auto; }
            .container { max-width: 900px; margin: 0 auto; padding: 40px 20px; }
            .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; margin: 32px 0; }
            .card { background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px #14532d1a; }
            .card img { width: 100%; height: 200px; object-fit: cover; }
            .card-body { padding: 20px; }
            .card h3 { font-size: 1.2rem; margin-bottom: 8px; }
            .badge { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; margin-right: 8px; background: #fff; color: ${primary}; }
            .btn { display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px; border-radius: 10px; font-weight: 700; text-decoration: none; font-size: 14px; }
            .btn-primary { background: ${primary}; color: #fff; }
            .btn-ghost { background: #fff; border: 1px solid #dcebd8; color: #1a2e22; }
            .section-title { font-size: 1.5rem; font-weight: 800; margin-bottom: 16px; }
            .amenities { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
            .amenity { background: #eef7ea; border: 1px solid #dcebd8; padding: 6px 12px; border-radius: 999px; font-size: 13px; }
            .footer { text-align: center; padding: 40px 20px; color: #6b7f6e; font-size: 14px; }
          `
        }} />
      </head>
      <body>
        <section className="hero" style={{ background: `linear-gradient(135deg, ${primary}, ${accent} 60%, ${accent})`, minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', textAlign: 'center', padding: '40px 20px' }}>
          <h1>{listing.titulo}</h1>
          <p>{listing.descripcion}</p>
          <div style={{ marginTop: 24, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <span className="badge" style={{ background: "#fff", color: primary }}>{listing.categoria}</span>
            <span className="badge" style={{ background: "#fff", color: primary }}>{listing.ciudad}</span>
            <span className="badge" style={{ background: "#fff", color: primary }}>{listing.huespedes} huéspedes</span>
            <span className="badge" style={{ background: "#fff", color: primary }}>⭐ {listing.rating} ({listing.resenas} reseñas)</span>
          </div>
        </section>

        <div className="container" style={{ maxWidth: 900, margin: '0 auto', padding: '40px 20px' }}>
          <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, margin: '32px 0' }}>
            {listing.galeria.slice(0, 6).map((src: string, i: number) => (
              <article key={i} className="card" style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 24px #14532d1a' }}>
                <img src={src} alt={`${listing.titulo} ${i + 1}`} style={{ width: '100%', height: 200, objectFit: 'cover' }} />
              </article>
            ))}
          </div>

          <h2 className="section-title" style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 16 }}>Amenidades</h2>
          <div className="amenities" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {listing.amenidades.map((a: string, i: number) => (
              <span key={i} className="amenity" style={{ background: '#eef7ea', border: '1px solid #dcebd8', padding: '6px 12px', borderRadius: '999px', fontSize: 13 }}>{a}</span>
            ))}
          </div>

          <h2 className="section-title" style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 16, marginTop: 32 }}>Políticas</h2>
          <p style={{ lineHeight: 1.7, color: '#6b7f6e' }}>{listing.politicas}</p>

          <div style={{ marginTop: 40, textAlign: 'center' }}>
            <a href="/" className="btn btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 10, fontWeight: 700, textDecoration: 'none', fontSize: 14, background: '#fff', border: '1px solid #dcebd8', color: '#1a2e22' }}><Icon name="arrowLeft" size={16} /> Volver a BioHostel</a>
          </div>
        </div>

        <footer className="footer" style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7f6e', fontSize: 14 }}>
          <p>BioHostel.com · Hecho con 💚 en Colombia</p>
        </footer>
      </body>
    </html>
  );
}