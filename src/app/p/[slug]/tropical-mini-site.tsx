import { Suspense } from "react";
import Link from "next/link";
import { Fraunces, Inter } from "next/font/google";
import type { ConflictSource } from "@/lib/booking-engine";
import type { StoredListing } from "@/lib/store";
import { ReviewsSection } from "src/components/ReviewsSection";
import {
  TROPICAL_BRAND_LABEL,
  TROPICAL_SCENES,
  TropicalIcon,
  TropicalIsotipo,
  TropicalLogoHorizontal,
  TropicalScene,
  TropicalSeal,
  tropicalIconFor,
} from "@/components/tropical-brand";
import AvailabilityCalendar from "./availability-calendar";
import ReservaForm from "./reserva-form";
import styles from "./tropical.module.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--tb-display",
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--tb-sans",
});

type TropicalMiniSiteProps = {
  listing: StoredListing;
  mapsUrl: string;
  mapCenter: string;
  minStay: number;
  maxStay: number;
  maxGuests: number;
  cancellationPolicy: string;
  houseRules: string[];
  occupied: string[];
  blockSources: ConflictSource[];
  defaultCheckIn: string;
  defaultCheckOut: string;
};

const facts = [
  { label: "Hospedaje", value: "3 cabañas + Cosmic Bungaló" },
  { label: "Territorio", value: "Café y cacao de Nocaima" },
  { label: "Bienestar", value: "Yoga · Tai Chi · Chi Kung" },
  { label: "Ubicación", value: "Nocaima · Cundinamarca" },
];

export default function TropicalMiniSite({
  listing,
  mapsUrl,
  mapCenter,
  minStay,
  maxStay,
  maxGuests,
  cancellationPolicy,
  houseRules,
  occupied,
  blockSources,
  defaultCheckIn,
  defaultCheckOut,
}: TropicalMiniSiteProps) {
  const heroImage = listing.galeria[0] || listing.imagen;
  const lead =
    listing.titulo.replace(/^tropical\s*biohostel\s*[—–-]?\s*/i, "").trim() || "Cabaña entre cafetales";
  const sections = [
    { label: "Inicio", href: "#inicio" },
    { label: "Experiencias", href: "#experiencias" },
    ...(listing.amenidades.length ? [{ label: "Amenidades", href: "#amenidades" }] : []),
    { label: "La estancia", href: "#estancia" },
    { label: "Disponibilidad", href: "#disponibilidad" },
    { label: "Reseñas", href: "#resenas" },
  ];
  const stayLabel = maxStay > 0 ? `${minStay} a ${maxStay} noches` : `Desde ${minStay} noche${minStay === 1 ? "" : "s"}`;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LodgingBusiness",
            name: "Tropical Biohostel",
            url: `/p/${listing.slug || listing.id}`,
            description: listing.descripcion,
            address: { "@type": "PostalAddress", addressLocality: "Nocaima", addressRegion: "Cundinamarca", addressCountry: "CO" },
            ...(listing.resenas > 0
              ? { aggregateRating: { "@type": "AggregateRating", ratingValue: listing.rating, reviewCount: listing.resenas } }
              : {}),
            image: heroImage,
            amenityFeature: listing.amenidades.map((a: string) => ({ "@type": "LocationFeatureSpecification", name: a })),
          }),
        }}
      />
      <main className={`${styles.root} ${fraunces.variable} ${inter.variable}`}>
        <header className={styles.header}>
          <a href="#inicio" className={styles.logoLink} aria-label="Tropical Biohostel, ir al inicio">
            <TropicalLogoHorizontal height={44} />
          </a>
          <nav className={styles.nav} aria-label="Secciones del alojamiento">
            {sections.map((s) => (
              <a key={s.href} href={s.href}>
                {s.label}
              </a>
            ))}
          </nav>
          <div className={styles.headerActions}>
            <Link href="/" className={styles.backLink}>
              {TROPICAL_BRAND_LABEL}
            </Link>
            <a href="#reserva" className={styles.headerCta}>
              Reservar
            </a>
          </div>
        </header>

        <section id="inicio" className={styles.hero}>
          <div className={styles.heroMedia} style={{ backgroundImage: `url(${heroImage})` }} />
          <div className={styles.heroShade} />
          <div className={styles.heroInner}>
            <div>
              <p className={styles.kicker}>Nocaima · Cundinamarca · Colombia</p>
              <h1 className={styles.heroTitle}>Tropical Biohostel</h1>
              <p className={styles.heroLead}>{lead}</p>
              <p className={styles.heroTagline}>“Donde el café comienza y el ruido termina.”</p>
              <p className={styles.heroCopy}>{listing.descripcion}</p>
              <div className={styles.actions}>
                <a href="#reserva" className={styles.btnGold}>
                  Reservar estancia
                </a>
                <a href="#experiencias" className={styles.btnGhost}>
                  Conocer la casa
                </a>
              </div>
              <div className={styles.badges}>
                <span className={`${styles.badge} ${styles.badgeGold}`}>{listing.categoria}</span>
                <span className={styles.badge}>{listing.ciudad}</span>
                {listing.resenas > 0 && (
                  <span className={styles.badge}>
                    ★ {listing.rating.toFixed(1)} · {listing.resenas} reseña{listing.resenas === 1 ? "" : "s"}
                  </span>
                )}
                <span className={styles.badge}>Check-in {listing.checkIn || "por confirmar"}</span>
                <span className={styles.badge}>Check-out {listing.checkOut || "por confirmar"}</span>
              </div>
            </div>
            <div className={styles.seal}>
              <TropicalSeal size={250} />
            </div>
          </div>
        </section>

        <section className={styles.ribbon} aria-label="Datos del alojamiento">
          {facts.map((fact) => (
            <div key={fact.label} className={styles.ribItem}>
              <span className={styles.ribLabel}>{fact.label}</span>
              <span className={styles.ribValue}>{fact.value}</span>
            </div>
          ))}
        </section>

        <section id="experiencias" className={styles.section}>
          <header className={styles.sectionHead}>
            <p className={styles.eyebrow}>01 · Experiencias</p>
            <h2 className={styles.h2}>Cuatro momentos que se recuerdan</h2>
            <p className={styles.sectionIntro}>
              La casa se vive despacio: entre cafetales, fogatas, café recién hecho y amaneceres de montaña.
            </p>
          </header>
          <div className={styles.scenes}>
            {TROPICAL_SCENES.map((scene) => (
              <article key={scene.id} className={styles.sceneCard}>
                <div className={styles.sceneArt}>
                  <TropicalScene name={scene.id} />
                </div>
                <div className={styles.sceneBody}>
                  <p className={styles.sceneEyebrow}>{scene.eyebrow}</p>
                  <h3 className={styles.h3}>{scene.title}</h3>
                  <p className={styles.text}>{scene.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {listing.amenidades.length > 0 && (
          <section id="amenidades" className={styles.section}>
            <header className={styles.sectionHead}>
              <p className={styles.eyebrow}>02 · Amenidades</p>
              <h2 className={styles.h2}>Lo que encontrarás en la casa</h2>
            </header>
            <div className={styles.amenities}>
              {listing.amenidades.map((amenity: string) => (
                <div key={amenity} className={styles.amenity}>
                  <TropicalIcon name={tropicalIconFor(amenity)} size={54} />
                  <span className={styles.amenityLabel}>{amenity}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section id="estancia" className={styles.section}>
          <header className={styles.sectionHead}>
            <p className={styles.eyebrow}>03 · La estancia</p>
            <h2 className={styles.h2}>Todo claro antes de reservar</h2>
          </header>
          <div className={styles.stayGrid}>
            <div className={styles.infoCard}>
              <span className={styles.infoLabel}>Check-in</span>
              <span className={styles.infoValue}>{listing.checkIn || "Por confirmar"}</span>
            </div>
            <div className={styles.infoCard}>
              <span className={styles.infoLabel}>Check-out</span>
              <span className={styles.infoValue}>{listing.checkOut || "Por confirmar"}</span>
            </div>
            <div className={styles.infoCard}>
              <span className={styles.infoLabel}>Duración</span>
              <span className={styles.infoValue}>{stayLabel}</span>
            </div>
            <div className={styles.infoCard}>
              <span className={styles.infoLabel}>Huéspedes</span>
              <span className={styles.infoValue}>Hasta {maxGuests}</span>
            </div>
            <div className={styles.infoCard}>
              <span className={styles.infoLabel}>Desayuno</span>
              <span className={styles.infoValue}>{listing.breakfastIncluded ? "Incluido" : "No incluido"}</span>
            </div>
            <div className={styles.infoCard}>
              <span className={styles.infoLabel}>RNT · Registro Nacional de Turismo</span>
              <span className={`${styles.infoValue} ${listing.rnt ? "" : styles.infoWarn}`}>
                {listing.rnt || "Pendiente de registro"}
              </span>
            </div>
          </div>

          {cancellationPolicy && (
            <div className={styles.policyBlock}>
              <span className={styles.policyLabel}>Política de cancelación</span>
              <p className={styles.text}>{cancellationPolicy}</p>
            </div>
          )}

          {houseRules.length > 0 && (
            <div className={styles.policyBlock}>
              <span className={styles.policyLabel}>Reglas de la casa</span>
              <ul className={styles.rules}>
                {houseRules.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
            </div>
          )}

          <div className={styles.policyBlock}>
            <span className={styles.policyLabel}>Ubicación</span>
            <p className={styles.text}>{listing.direccion || `${listing.ciudad}, Colombia (ubicación aproximada)`}</p>
            <div className={styles.mapWrap}>
              <iframe
                className={styles.map}
                title="Ubicación de Tropical Biohostel"
                loading="lazy"
                allowFullScreen
                src={`https://www.google.com/maps?q=${encodeURIComponent(mapCenter)}&z=15&output=embed`}
              />
            </div>
          </div>
        </section>

        <section id="disponibilidad" className={styles.section}>
          <header className={styles.sectionHead}>
            <p className={styles.eyebrow}>04 · Disponibilidad</p>
            <h2 className={styles.h2}>Elige tus fechas</h2>
            <p className={styles.sectionIntro}>
              Revisamos las reservas de Biohostels y los calendarios iCal conectados antes de confirmar.
            </p>
          </header>
          <div className={styles.split}>
            <div className={styles.card}>
              <AvailabilityCalendar listing={listing} occupied={occupied} sources={blockSources} />
            </div>
            <div className={styles.card}>
              <h3 className={styles.h3}>Cómo reservar</h3>
              <p className={styles.text}>
                01 · Elige entrada y salida en el calendario. 02 · Verifica el total y los extras. 03 · Confirma con tus
                datos: si el pago en línea está habilitado te llevamos a Wompi; si no, coordinamos el pago contigo.
              </p>
              <a href="#reserva" className={styles.btnGold} style={{ marginTop: 18 }}>
                Ir al formulario
              </a>
            </div>
          </div>
        </section>

        <div id="reserva" className={styles.bookingSection}>
          <header className={styles.bookingHead}>
            <p className={styles.eyebrow}>05 · Reserva</p>
            <h2 className={styles.h2}>Reserva directa con el anfitrión</h2>
          </header>
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

        <section id="resenas" className={styles.section}>
          <header className={styles.sectionHead}>
            <p className={styles.eyebrow}>06 · Reseñas</p>
            <h2 className={styles.h2}>Lo que dicen los huéspedes</h2>
          </header>
          <div className={styles.card}>
            <ReviewsSection listingId={listing.id} />
          </div>
        </section>

        <footer className={styles.footer}>
          <div className={styles.footerSeal}>
            <TropicalIsotipo size={72} />
          </div>
          <p className={styles.footerTagline}>“Donde el café comienza y el ruido termina.”</p>
          <p className={styles.footerText}>
            Tropical Biohostel · Nocaima, Cundinamarca · Reservas directas con calendarios conectados.
          </p>
          <div className={styles.footerLinks}>
            <a href="#inicio" className={styles.footerLink}>
              Volver arriba
            </a>
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={styles.footerLink}>
              Ver en Google Maps
            </a>
            <Link href="/" className={styles.footerLink}>
              {TROPICAL_BRAND_LABEL}
            </Link>
            <Link href="/terminos" className={styles.footerLink}>
              Términos
            </Link>
            <Link href="/privacidad" className={styles.footerLink}>
              Privacidad
            </Link>
          </div>
        </footer>
      </main>
    </>
  );
}
