import type { CSSProperties, ReactNode } from "react";

export const TROPICAL = {
  forest: "#1F3D2B",
  gold: "#E8A94A",
  leaf: "#8FB573",
  coffee: "#6B4423",
  sand: "#D4C9B0",
  cream: "#F5EFE0",
  ink: "#2A241E",
  brown: "#3E2F23",
} as const;

export const TROPICAL_BRAND_LABEL = "biohostels.com";

const serif = 'Fraunces, Georgia, "Times New Roman", serif';
const sans = 'Inter, "Segoe UI", sans-serif';

export function isTropicalBiohostel(listing: {
  id: string;
  titulo: string;
  imagen?: string;
  galeria?: string[];
  anfitrion?: { nombre?: string };
}): boolean {
  if (listing.id === "lst-mv8u4rjy436") return true;
  const haystack = [listing.titulo, listing.imagen ?? "", ...(listing.galeria ?? []), listing.anfitrion?.nombre ?? ""].join(" ");
  return /tropical[\s-]*biohostel/i.test(haystack);
}

type LogoProps = { height?: number; style?: CSSProperties };

export function TropicalLogoHorizontal({ height = 44, style }: LogoProps) {
  return (
    <svg
      viewBox="0 0 500 150"
      height={height}
      role="img"
      aria-label="Tropical Biohostel"
      style={{ display: "block", width: "auto", ...style }}
    >
      <g transform="translate(20, 15)">
        <circle cx="60" cy="60" r="55" fill="none" stroke={TROPICAL.forest} strokeWidth="2" />
        <circle cx="60" cy="35" r="12" fill={TROPICAL.gold} />
        <path d="M 25 95 L 45 60 L 60 75 L 75 55 L 95 95" fill={TROPICAL.forest} opacity="0.9" />
        <path d="M 60 60 Q 55 45 57 30 Q 60 22 63 30 Q 65 45 60 60" fill={TROPICAL.leaf} />
      </g>
      <text x="170" y="70" fontFamily={serif} fontSize="36" fill={TROPICAL.forest} letterSpacing="2">
        TROPICAL
      </text>
      <text x="170" y="105" fontFamily={serif} fontSize="36" fill={TROPICAL.forest} letterSpacing="2" fontStyle="italic">
        Biohostel
      </text>
      <text x="170" y="125" fontFamily={sans} fontSize="10" fill={TROPICAL.coffee} letterSpacing="4">
        NOCAIMA · COLOMBIA
      </text>
    </svg>
  );
}

export function TropicalSeal({ size = 260 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 300 300"
      width={size}
      height={size}
      role="img"
      aria-label="Sello Tropical Biohostel, Nocaima, Colombia"
      style={{ display: "block" }}
    >
      <circle cx="150" cy="150" r="140" fill="none" stroke={TROPICAL.forest} strokeWidth="3" />
      <circle cx="150" cy="150" r="130" fill="none" stroke={TROPICAL.forest} strokeWidth="1" opacity="0.3" />
      <circle cx="150" cy="85" r="28" fill={TROPICAL.gold} />
      <circle cx="150" cy="85" r="22" fill={TROPICAL.cream} opacity="0.3" />
      <path d="M 60 200 L 110 130 L 140 170 L 170 120 L 220 200 Z" fill={TROPICAL.forest} opacity="0.9" />
      <path d="M 80 200 L 120 150 L 150 180 L 180 140 L 210 200 Z" fill={TROPICAL.brown} opacity="0.7" />
      <path d="M 150 130 Q 140 100 145 70 Q 150 50 155 70 Q 160 100 150 130" fill={TROPICAL.leaf} stroke={TROPICAL.forest} strokeWidth="1.5" />
      <path d="M 150 130 L 150 70" stroke={TROPICAL.forest} strokeWidth="1" opacity="0.5" />
      <path d="M 150 90 Q 145 85 142 80" stroke={TROPICAL.forest} strokeWidth="0.8" fill="none" opacity="0.6" />
      <path d="M 150 90 Q 155 85 158 80" stroke={TROPICAL.forest} strokeWidth="0.8" fill="none" opacity="0.6" />
      <path d="M 150 105 Q 144 100 140 95" stroke={TROPICAL.forest} strokeWidth="0.8" fill="none" opacity="0.6" />
      <path d="M 150 105 Q 156 100 160 95" stroke={TROPICAL.forest} strokeWidth="0.8" fill="none" opacity="0.6" />
      <path d="M 70 210 Q 110 205 150 210 Q 190 215 230 210" fill="none" stroke={TROPICAL.coffee} strokeWidth="2" strokeLinecap="round" />
      <defs>
        <path id="tbArcTop" d="M 50 150 A 100 100 0 0 1 250 150" />
        <path id="tbArcBottom" d="M 60 180 A 100 100 0 0 0 240 180" />
      </defs>
      <text fontFamily={serif} fontSize="16" fill={TROPICAL.forest} letterSpacing="4">
        <textPath href="#tbArcTop" startOffset="50%" textAnchor="middle">
          TROPICAL BIOHOSTEL
        </textPath>
      </text>
      <text fontFamily={serif} fontSize="11" fill={TROPICAL.coffee} letterSpacing="3" fontStyle="italic">
        <textPath href="#tbArcBottom" startOffset="50%" textAnchor="middle">
          · NOCAIMA · COLOMBIA ·
        </textPath>
      </text>
    </svg>
  );
}

export function TropicalIsotipo({ size = 80 }: { size?: number }) {
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} aria-hidden="true" style={{ display: "block" }}>
      <circle cx="100" cy="100" r="90" fill="none" stroke={TROPICAL.cream} strokeWidth="2.5" />
      <circle cx="100" cy="60" r="18" fill={TROPICAL.gold} />
      <path d="M 40 140 L 70 90 L 90 110 L 110 80 L 160 140 Z" fill={TROPICAL.cream} opacity="0.95" />
      <path d="M 100 95 Q 94 75 97 55 Q 100 45 103 55 Q 106 75 100 95" fill={TROPICAL.cream} />
      <path d="M 100 95 L 100 55" stroke={TROPICAL.forest} strokeWidth="0.8" opacity="0.3" />
    </svg>
  );
}

export type TropicalIconName = "hoja" | "montanas" | "cabana" | "cafe" | "fogata" | "hamaca" | "sendero" | "sol";

const iconPaths: Record<TropicalIconName, ReactNode> = {
  hoja: (
    <>
      <path d="M 50 85 Q 35 60 40 30 Q 50 15 60 30 Q 65 60 50 85 Z" fill="none" stroke={TROPICAL.forest} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 50 85 L 50 25" stroke={TROPICAL.forest} strokeWidth="1.5" />
      <path d="M 50 45 Q 42 40 38 35" stroke={TROPICAL.forest} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M 50 45 Q 58 40 62 35" stroke={TROPICAL.forest} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M 50 60 Q 40 55 36 50" stroke={TROPICAL.forest} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M 50 60 Q 60 55 64 50" stroke={TROPICAL.forest} strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </>
  ),
  montanas: (
    <>
      <path d="M 15 75 L 35 40 L 50 55 L 70 25 L 85 75" fill="none" stroke={TROPICAL.forest} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="75" cy="25" r="8" fill="none" stroke={TROPICAL.gold} strokeWidth="2.5" />
      <line x1="75" y1="12" x2="75" y2="16" stroke={TROPICAL.gold} strokeWidth="2" strokeLinecap="round" />
      <line x1="75" y1="34" x2="75" y2="38" stroke={TROPICAL.gold} strokeWidth="2" strokeLinecap="round" />
      <line x1="62" y1="25" x2="66" y2="25" stroke={TROPICAL.gold} strokeWidth="2" strokeLinecap="round" />
      <line x1="84" y1="25" x2="88" y2="25" stroke={TROPICAL.gold} strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  cabana: (
    <>
      <path d="M 20 75 L 50 35 L 80 75 Z" fill="none" stroke={TROPICAL.forest} strokeWidth="2.5" strokeLinejoin="round" />
      <rect x="42" y="55" width="16" height="20" fill="none" stroke={TROPICAL.forest} strokeWidth="2" />
      <rect x="50" y="45" width="8" height="8" fill="none" stroke={TROPICAL.gold} strokeWidth="1.5" />
      <path d="M 15 75 L 85 75" stroke={TROPICAL.forest} strokeWidth="2.5" strokeLinecap="round" />
    </>
  ),
  cafe: (
    <>
      <path d="M 25 45 L 25 70 Q 25 80 35 80 L 60 80 Q 70 80 70 70 L 70 45 Z" fill="none" stroke={TROPICAL.forest} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 70 50 Q 82 50 82 60 Q 82 70 70 70" fill="none" stroke={TROPICAL.forest} strokeWidth="2.5" />
      <path d="M 35 35 Q 35 25 40 20" stroke={TROPICAL.coffee} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M 48 35 Q 48 25 53 20" stroke={TROPICAL.coffee} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M 60 35 Q 60 25 65 20" stroke={TROPICAL.coffee} strokeWidth="2" fill="none" strokeLinecap="round" />
    </>
  ),
  fogata: (
    <>
      <path d="M 50 20 Q 35 40 40 55 Q 45 65 50 60 Q 55 65 60 55 Q 65 40 50 20" fill="none" stroke={TROPICAL.gold} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 50 35 Q 42 48 45 58 Q 48 63 50 60 Q 52 63 55 58 Q 58 48 50 35" fill="none" stroke={TROPICAL.gold} strokeWidth="2" strokeLinecap="round" />
      <line x1="25" y1="80" x2="75" y2="80" stroke={TROPICAL.forest} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="30" y1="80" x2="40" y2="70" stroke={TROPICAL.coffee} strokeWidth="2" strokeLinecap="round" />
      <line x1="70" y1="80" x2="60" y2="70" stroke={TROPICAL.coffee} strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  hamaca: (
    <>
      <line x1="15" y1="25" x2="15" y2="80" stroke={TROPICAL.forest} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="85" y1="25" x2="85" y2="80" stroke={TROPICAL.forest} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 15 35 Q 50 65 85 35" fill="none" stroke={TROPICAL.forest} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 20 40 Q 50 60 80 40" fill="none" stroke={TROPICAL.coffee} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <line x1="15" y1="35" x2="10" y2="30" stroke={TROPICAL.forest} strokeWidth="2" strokeLinecap="round" />
      <line x1="85" y1="35" x2="90" y2="30" stroke={TROPICAL.forest} strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  sendero: (
    <>
      <path d="M 20 85 Q 35 70 45 60 Q 55 50 50 35 Q 45 20 55 15" fill="none" stroke={TROPICAL.forest} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 80 85 Q 65 70 55 60 Q 45 50 50 35 Q 55 20 45 15" fill="none" stroke={TROPICAL.forest} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="25" cy="55" r="3" fill={TROPICAL.leaf} />
      <circle cx="75" cy="50" r="3" fill={TROPICAL.leaf} />
      <circle cx="30" cy="30" r="2" fill={TROPICAL.leaf} />
      <circle cx="70" cy="25" r="2" fill={TROPICAL.leaf} />
    </>
  ),
  sol: (
    <>
      <circle cx="50" cy="50" r="18" fill="none" stroke={TROPICAL.gold} strokeWidth="2.5" />
      <line x1="50" y1="18" x2="50" y2="26" stroke={TROPICAL.gold} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="50" y1="74" x2="50" y2="82" stroke={TROPICAL.gold} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="18" y1="50" x2="26" y2="50" stroke={TROPICAL.gold} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="74" y1="50" x2="82" y2="50" stroke={TROPICAL.gold} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="27" y1="27" x2="33" y2="33" stroke={TROPICAL.gold} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="67" y1="67" x2="73" y2="73" stroke={TROPICAL.gold} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="27" y1="73" x2="33" y2="67" stroke={TROPICAL.gold} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="67" y1="33" x2="73" y2="27" stroke={TROPICAL.gold} strokeWidth="2.5" strokeLinecap="round" />
    </>
  ),
};

export function TropicalIcon({ name, size = 52 }: { name: TropicalIconName; size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" style={{ display: "block" }}>
      {iconPaths[name]}
    </svg>
  );
}

export function tropicalIconFor(label: string): TropicalIconName {
  const text = label.toLowerCase();
  if (/café|cafe|cacao|desayuno|gastronom|barista/.test(text)) return "cafe";
  if (/yoga|bienestar|meditaci|tai|chi|spa/.test(text)) return "sol";
  if (/fogata|comunidad|parrilla|asado|bbq|cocina/.test(text)) return "fogata";
  if (/piscina|pileta|agua|río|rio|hamaca|descanso|relax/.test(text)) return "hamaca";
  if (/tour|caminata|sendero|trek|excursi/.test(text)) return "sendero";
  if (/cabaña|cabana|habitaci|bungal|cama/.test(text)) return "cabana";
  if (/montaña|montana|naturaleza|bosque|valle/.test(text)) return "montanas";
  return "hoja";
}

export type TropicalSceneName = "cabana" | "fogata" | "cafe" | "amanecer";

export const TROPICAL_SCENES: {
  id: TropicalSceneName;
  eyebrow: string;
  title: string;
  desc: string;
}[] = [
  {
    id: "cabana",
    eyebrow: "Despertar",
    title: "Cabaña en el bosque",
    desc: "Tres cabañas con baño privado y el Cosmic Bungaló de arquitectura sagrada hexagonal, entre cafetales y bosque nativo.",
  },
  {
    id: "fogata",
    eyebrow: "Comunidad",
    title: "Fogata nocturna",
    desc: "Rituales bajo las estrellas de Nocaima: fuego, conversación y el silencio que solo se encuentra lejos del ruido.",
  },
  {
    id: "cafe",
    eyebrow: "Territorio",
    title: "Café y cacao",
    desc: "Del grano a la taza. Gastronomía local, café, cacao y talleres para entender lo que bebes y lo que siembras.",
  },
  {
    id: "amanecer",
    eyebrow: "Bienestar",
    title: "Amanecer en Nocaima",
    desc: "Yoga, Tai Chi y Chi Kung al amanecer, caminatas por senderos y piscina natural entre montañas.",
  },
];

export function TropicalScene({ name }: { name: TropicalSceneName }) {
  if (name === "cabana") {
    return (
      <svg viewBox="0 0 600 400" width="100%" role="img" aria-label="Ilustración de una cabaña en el bosque" style={{ display: "block", height: "auto" }}>
        <defs>
          <linearGradient id="tbSky1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={TROPICAL.gold} stopOpacity="0.4" />
            <stop offset="100%" stopColor={TROPICAL.cream} stopOpacity="1" />
          </linearGradient>
        </defs>
        <rect width="600" height="400" fill="url(#tbSky1)" />
        <circle cx="480" cy="100" r="50" fill={TROPICAL.gold} opacity="0.8" />
        <circle cx="480" cy="100" r="35" fill={TROPICAL.cream} opacity="0.4" />
        <path d="M 0 250 L 150 150 L 280 220 L 400 130 L 600 230 L 600 400 L 0 400 Z" fill={TROPICAL.forest} opacity="0.3" />
        <path d="M 0 280 L 80 220 L 150 260 L 220 210 L 300 250 L 380 200 L 460 240 L 540 210 L 600 260 L 600 400 L 0 400 Z" fill={TROPICAL.brown} opacity="0.5" />
        <g opacity="0.9">
          <path d="M 50 320 L 70 240 L 90 320 Z" fill={TROPICAL.forest} />
          <path d="M 120 330 L 145 230 L 170 330 Z" fill={TROPICAL.forest} />
          <path d="M 430 320 L 455 230 L 480 320 Z" fill={TROPICAL.forest} />
          <path d="M 510 330 L 535 240 L 560 330 Z" fill={TROPICAL.forest} />
        </g>
        <g transform="translate(220, 220)">
          <path d="M 0 150 L 80 0 L 160 150 Z" fill={TROPICAL.coffee} />
          <path d="M 10 150 L 80 15 L 150 150 Z" fill={TROPICAL.brown} />
          <rect x="55" y="60" width="50" height="50" fill={TROPICAL.gold} opacity="0.7" />
          <line x1="80" y1="60" x2="80" y2="110" stroke={TROPICAL.brown} strokeWidth="2" />
          <line x1="55" y1="85" x2="105" y2="85" stroke={TROPICAL.brown} strokeWidth="2" />
          <rect x="65" y="115" width="30" height="35" fill={TROPICAL.forest} />
          <rect x="-10" y="150" width="180" height="8" fill={TROPICAL.brown} />
        </g>
        <g opacity="0.8">
          <ellipse cx="100" cy="380" rx="60" ry="20" fill={TROPICAL.leaf} />
          <ellipse cx="500" cy="380" rx="70" ry="25" fill={TROPICAL.leaf} />
          <ellipse cx="300" cy="390" rx="80" ry="15" fill={TROPICAL.forest} opacity="0.5" />
        </g>
        <g opacity="0.15">
          <path d="M 480 100 L 300 400" stroke={TROPICAL.gold} strokeWidth="40" />
          <path d="M 480 100 L 400 400" stroke={TROPICAL.gold} strokeWidth="30" />
        </g>
      </svg>
    );
  }

  if (name === "fogata") {
    return (
      <svg viewBox="0 0 600 400" width="100%" role="img" aria-label="Ilustración de una fogata nocturna" style={{ display: "block", height: "auto" }}>
        <defs>
          <radialGradient id="tbFireGlow" cx="50%" cy="50%">
            <stop offset="0%" stopColor={TROPICAL.gold} stopOpacity="0.6" />
            <stop offset="50%" stopColor={TROPICAL.coffee} stopOpacity="0.3" />
            <stop offset="100%" stopColor={TROPICAL.forest} stopOpacity="0" />
          </radialGradient>
          <linearGradient id="tbNightSky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={TROPICAL.forest} />
            <stop offset="100%" stopColor={TROPICAL.ink} />
          </linearGradient>
        </defs>
        <rect width="600" height="400" fill="url(#tbNightSky)" />
        <g fill={TROPICAL.cream}>
          <circle cx="80" cy="60" r="1.5" />
          <circle cx="150" cy="90" r="1" />
          <circle cx="220" cy="40" r="1.5" />
          <circle cx="320" cy="70" r="1" />
          <circle cx="420" cy="50" r="1.5" />
          <circle cx="500" cy="100" r="1" />
          <circle cx="550" cy="40" r="1.5" />
          <circle cx="100" cy="130" r="1" />
          <circle cx="380" cy="120" r="1" />
          <circle cx="480" cy="150" r="1.5" />
        </g>
        <circle cx="500" cy="80" r="25" fill={TROPICAL.cream} opacity="0.9" />
        <circle cx="495" cy="75" r="25" fill={TROPICAL.forest} opacity="0.3" />
        <g fill={TROPICAL.forest}>
          <path d="M 0 300 L 40 180 L 80 300 Z" />
          <path d="M 60 310 L 110 170 L 160 310 Z" />
          <path d="M 440 300 L 490 180 L 540 300 Z" />
          <path d="M 500 310 L 550 170 L 600 310 Z" />
        </g>
        <ellipse cx="300" cy="300" rx="200" ry="100" fill="url(#tbFireGlow)" />
        <ellipse cx="300" cy="350" rx="250" ry="40" fill={TROPICAL.brown} />
        <g fill={TROPICAL.coffee}>
          <ellipse cx="220" cy="320" rx="15" ry="8" />
          <ellipse cx="380" cy="320" rx="15" ry="8" />
          <ellipse cx="250" cy="340" rx="15" ry="8" />
          <ellipse cx="350" cy="340" rx="15" ry="8" />
        </g>
        <path d="M 300 310 Q 270 270 280 240 Q 290 220 300 230 Q 310 220 320 240 Q 330 270 300 310" fill={TROPICAL.gold} />
        <path d="M 300 305 Q 280 275 288 255 Q 295 245 300 250 Q 305 245 312 255 Q 320 275 300 305" fill={TROPICAL.cream} opacity="0.7" />
        <path d="M 300 300 Q 290 280 295 265 Q 300 260 305 265 Q 310 280 300 300" fill={TROPICAL.gold} opacity="0.9" />
        <g fill={TROPICAL.gold}>
          <circle cx="280" cy="220" r="2" opacity="0.8" />
          <circle cx="315" cy="200" r="1.5" opacity="0.6" />
          <circle cx="295" cy="190" r="2" opacity="0.7" />
          <circle cx="320" cy="230" r="1.5" opacity="0.5" />
          <circle cx="270" cy="240" r="1" opacity="0.6" />
        </g>
        <g fill={TROPICAL.ink} opacity="0.8">
          <circle cx="230" cy="290" r="10" />
          <path d="M 220 300 Q 220 320 230 325 Q 240 320 240 300 Z" />
          <circle cx="370" cy="290" r="10" />
          <path d="M 360 300 Q 360 320 370 325 Q 380 320 380 300 Z" />
          <circle cx="260" cy="310" r="9" />
          <path d="M 252 318 Q 252 335 260 340 Q 268 335 268 318 Z" />
          <circle cx="340" cy="310" r="9" />
          <path d="M 332 318 Q 332 335 340 340 Q 348 335 348 318 Z" />
        </g>
      </svg>
    );
  }

  if (name === "cafe") {
    return (
      <svg viewBox="0 0 600 400" width="100%" role="img" aria-label="Ilustración de café artesanal" style={{ display: "block", height: "auto" }}>
        <defs>
          <linearGradient id="tbTable3" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={TROPICAL.coffee} />
            <stop offset="100%" stopColor={TROPICAL.brown} />
          </linearGradient>
          <radialGradient id="tbLight3" cx="30%" cy="20%">
            <stop offset="0%" stopColor={TROPICAL.gold} stopOpacity="0.3" />
            <stop offset="100%" stopColor={TROPICAL.cream} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="600" height="400" fill={TROPICAL.cream} />
        <rect width="600" height="400" fill="url(#tbLight3)" />
        <rect x="0" y="250" width="600" height="150" fill="url(#tbTable3)" />
        <g stroke={TROPICAL.brown} strokeWidth="0.5" opacity="0.3">
          <line x1="0" y1="280" x2="600" y2="285" />
          <line x1="0" y1="320" x2="600" y2="315" />
          <line x1="0" y1="360" x2="600" y2="365" />
        </g>
        <g transform="translate(250, 180)">
          <ellipse cx="50" cy="130" rx="80" ry="15" fill={TROPICAL.sand} />
          <ellipse cx="50" cy="128" rx="75" ry="12" fill={TROPICAL.cream} />
          <path d="M 10 60 L 15 120 Q 15 130 25 130 L 75 130 Q 85 130 85 120 L 90 60 Z" fill={TROPICAL.coffee} />
          <path d="M 15 65 L 18 115 Q 18 125 28 125 L 72 125 Q 82 125 82 115 L 85 65 Z" fill={TROPICAL.brown} />
          <ellipse cx="50" cy="68" rx="35" ry="8" fill={TROPICAL.forest} />
          <ellipse cx="48" cy="66" rx="30" ry="6" fill={TROPICAL.brown} opacity="0.5" />
          <path d="M 85 75 Q 110 75 110 95 Q 110 115 85 115" fill="none" stroke={TROPICAL.coffee} strokeWidth="8" />
          <path d="M 85 80 Q 105 80 105 95 Q 105 110 85 110" fill="none" stroke={TROPICAL.brown} strokeWidth="4" />
          <g opacity="0.4" stroke={TROPICAL.sand} strokeWidth="2" fill="none">
            <path d="M 35 50 Q 30 35 35 20 Q 40 10 35 0" />
            <path d="M 50 50 Q 45 30 50 15 Q 55 5 50 -5" />
            <path d="M 65 50 Q 60 35 65 20 Q 70 10 65 0" />
          </g>
        </g>
        <g fill={TROPICAL.brown}>
          <ellipse cx="150" cy="300" rx="8" ry="5" transform="rotate(30 150 300)" />
          <ellipse cx="170" cy="320" rx="8" ry="5" transform="rotate(-20 170 320)" />
          <ellipse cx="450" cy="290" rx="8" ry="5" transform="rotate(45 450 290)" />
          <ellipse cx="480" cy="310" rx="8" ry="5" transform="rotate(-15 480 310)" />
          <ellipse cx="130" cy="340" rx="8" ry="5" transform="rotate(60 130 340)" />
          <ellipse cx="500" cy="340" rx="8" ry="5" transform="rotate(10 500 340)" />
        </g>
        <g transform="translate(420, 200) rotate(-20)">
          <path d="M 0 50 Q -10 25 0 0 Q 10 25 0 50" fill={TROPICAL.leaf} />
          <line x1="0" y1="50" x2="0" y2="0" stroke={TROPICAL.forest} strokeWidth="1" />
        </g>
        <g transform="translate(180, 280) rotate(25)">
          <rect x="0" y="0" width="60" height="4" fill={TROPICAL.sand} rx="2" />
          <ellipse cx="65" cy="2" rx="10" ry="6" fill={TROPICAL.sand} />
        </g>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 600 400" width="100%" role="img" aria-label="Ilustración del amanecer en Nocaima" style={{ display: "block", height: "auto" }}>
      <defs>
        <linearGradient id="tbSunrise" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={TROPICAL.gold} />
          <stop offset="40%" stopColor={TROPICAL.cream} />
          <stop offset="100%" stopColor={TROPICAL.leaf} />
        </linearGradient>
        <linearGradient id="tbMist" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={TROPICAL.cream} stopOpacity="0.8" />
          <stop offset="100%" stopColor={TROPICAL.cream} stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="600" height="400" fill="url(#tbSunrise)" />
      <circle cx="300" cy="180" r="60" fill={TROPICAL.gold} opacity="0.9" />
      <circle cx="300" cy="180" r="45" fill={TROPICAL.cream} opacity="0.5" />
      <g opacity="0.3" stroke={TROPICAL.gold} strokeWidth="2">
        <line x1="300" y1="180" x2="100" y2="50" />
        <line x1="300" y1="180" x2="200" y2="30" />
        <line x1="300" y1="180" x2="400" y2="30" />
        <line x1="300" y1="180" x2="500" y2="50" />
      </g>
      <path d="M 0 250 L 100 180 L 180 220 L 280 160 L 380 200 L 480 150 L 600 220 L 600 400 L 0 400 Z" fill={TROPICAL.forest} opacity="0.4" />
      <path d="M 0 280 L 80 220 L 160 260 L 240 210 L 320 250 L 400 200 L 500 240 L 600 270 L 600 400 L 0 400 Z" fill={TROPICAL.forest} opacity="0.6" />
      <rect x="0" y="260" width="600" height="60" fill="url(#tbMist)" />
      <path d="M 0 320 L 50 280 L 100 310 L 150 270 L 200 300 L 250 260 L 300 290 L 350 250 L 400 280 L 450 260 L 500 290 L 550 270 L 600 300 L 600 400 L 0 400 Z" fill={TROPICAL.forest} />
      <g>
        <rect x="180" y="330" width="20" height="15" fill={TROPICAL.coffee} />
        <path d="M 175 330 L 190 318 L 205 330 Z" fill={TROPICAL.brown} />
        <rect x="380" y="340" width="20" height="15" fill={TROPICAL.coffee} />
        <path d="M 375 340 L 390 328 L 405 340 Z" fill={TROPICAL.brown} />
      </g>
      <path d="M 280 400 Q 290 370 300 350 Q 310 330 320 310" fill="none" stroke={TROPICAL.sand} strokeWidth="3" opacity="0.6" />
      <g stroke={TROPICAL.forest} strokeWidth="1.5" fill="none" strokeLinecap="round">
        <path d="M 150 120 Q 155 115 160 120 Q 165 115 170 120" />
        <path d="M 420 100 Q 425 95 430 100 Q 435 95 440 100" />
        <path d="M 350 140 Q 355 135 360 140 Q 365 135 370 140" />
      </g>
    </svg>
  );
}
