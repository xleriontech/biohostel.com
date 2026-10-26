export type PlanId = "gratuito" | "corporativo" | "premium";

export type Plan = {
  id: PlanId;
  nombre: string;
  precioCOP: number;
  periodo: string;
  comision: string;
  comisionValor: number;
  features: string[];
  limiteFotos: string;
  limiteDescripcion: string;
  destacado?: boolean;
};

export const PLANS: Plan[] = [
  {
    id: "gratuito",
    nombre: "Gratuito",
    precioCOP: 0,
    periodo: "para siempre",
    comision: "10% por reserva",
    comisionValor: 0.1,
    limiteFotos: "5 fotos",
    limiteDescripcion: "300 caracteres",
    features: [
      "Perfil gratuito estilo social",
      "Hasta 5 fotos por alojamiento",
      "Descripción limitada (300 caracteres)",
      "Políticas de reserva básicas",
      "Comisión plataforma: 10%",
      "1 alojamiento activo",
    ],
  },
  {
    id: "corporativo",
    nombre: "Corporativo",
    precioCOP: 149000,
    periodo: "/ mes",
    comision: "5% por reserva",
    comisionValor: 0.05,
    limiteFotos: "Ilimitadas",
    limiteDescripcion: "Ilimitada",
    destacado: true,
    features: [
      "Mensualidad $149.000 COP",
      "Comisión reducida: 5%",
      "Perfil completo verificado",
      "Fotos ilimitadas",
      "Descripción ilimitada",
      "Políticas de reserva completas",
      "Hasta 20 alojamientos + insignia PRO",
    ],
  },
  {
    id: "premium",
    nombre: "Premium",
    precioCOP: 1490000,
    periodo: "/ año",
    comision: "0% sin comisiones",
    comisionValor: 0,
    limiteFotos: "Ilimitadas + video",
    limiteDescripcion: "Ilimitada + SEO",
    features: [
      "Anualidad $1.490.000 COP",
      "Sin comisiones (0%)",
      "Todo lo corporativo",
      "Posicionamiento destacado + video",
      "Soporte prioritario + IA avanzada",
      "Alojamientos ilimitados",
    ],
  },
];

export type ListingTheme = {
  primary: string;
  accent: string;
  preset: "selva" | "mar" | "colonial" | "urbano" | "minimal";
  font: "serif" | "sans";
  rationale: string;
};

export type Listing = {
  id: string;
  titulo: string;
  tipo: "reserva" | "subarriendo";
  categoria: string;
  ciudad: string;
  precioNoche: number;
  precioMes?: number;
  rating: number;
  resenas: number;
  huespedes: number;
  imagen: string;
  galeria: string[];
  descripcion: string;
  amenidades: string[];
  politicas: string;
  anfitrion: { nombre: string; plan: PlanId; verificado: boolean; avatar: string; seguidores: number };
  fechasOcupadasBooking: string[];
  fechasOcupadasAirbnb: string[];
  slug?: string;
  theme?: ListingTheme;
};

// Catálogo demo 100% Colombia · precios en COP
export const LISTINGS: Listing[] = [
  {
    id: "bio-nocaima-01",
    titulo: "Tropical Biohostel — Cabaña entre cafetales",
    tipo: "reserva",
    categoria: "Hostel",
    ciudad: "Nocaima",
    precioNoche: 180000,
    rating: 4.9,
    resenas: 312,
    huespedes: 2,
    imagen: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80",
    galeria: [
      "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80",
      "https://images.unsplash.com/photo-1520271348391-049dd132bb7c?w=800&q=80",
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80",
    ],
    descripcion:
      "Cabaña ecológica entre 400 plantas de café y bosque nativo, a 10 min de Nocaima. Pileta natural, yoga y tour café-cacao. Ideal para nómadas y voluntarios.",
    amenidades: ["Wifi fibra", "Pileta natural", "Tour café", "Yoga deck", "Desayuno finca"],
    politicas: "Check-in 15:00 · Check-out 12:00 · Cancelación gratis 48h · No fumadores.",
    anfitrion: { nombre: "Tropical Biohostel", plan: "premium", verificado: true, avatar: "TB", seguidores: 15200 },
    fechasOcupadasBooking: ["2026-10-20", "2026-10-21", "2026-11-02"],
    fechasOcupadasAirbnb: ["2026-10-25", "2026-10-26"],
    theme: { primary: "#1d4a2c", accent: "#bef264", preset: "selva", font: "sans", rationale: "Eco-natural: verde selva profundo con acento lima, sin serifas modernas" },
  },
  {
    id: "bio-bogota-02",
    titulo: "Subarriendo mensual — Loft con huerto en Chapinero",
    tipo: "subarriendo",
    categoria: "Subarriendo",
    ciudad: "Bogotá",
    precioNoche: 95000,
    precioMes: 2400000,
    rating: 4.8,
    resenas: 98,
    huespedes: 3,
    imagen: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
    galeria: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80",
    ],
    descripcion: "Loft amoblado con huerto urbano en Chapinero. Contrato mensual flexible, ideal voluntariado largo. Incluye servicios.",
    amenidades: ["Cocina equipada", "Huerto", "Lavandería", "Pet friendly"],
    politicas: "Estancia mínima 30 días · Depósito 1 mes · Contrato digital.",
    anfitrion: { nombre: "Lucía Méndez", plan: "premium", verificado: true, avatar: "LM", seguidores: 8900 },
    fechasOcupadasBooking: [],
    fechasOcupadasAirbnb: ["2026-11-01", "2026-11-30"],
    theme: { primary: "#1e3a8a", accent: "#93c5fd", preset: "urbano", font: "sans", rationale: "Urbano moderno: azul nocturno con acento celeste, sans-serif geométrica" },
  },
  {
    id: "bio-tayrona-03",
    titulo: "Eco-cabaña bambú frente al mar Tayrona",
    tipo: "reserva",
    categoria: "Cabaña",
    ciudad: "Santa Marta",
    precioNoche: 320000,
    rating: 5.0,
    resenas: 421,
    huespedes: 4,
    imagen: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&q=80",
    galeria: [
      "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&q=80",
      "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800&q=80",
    ],
    descripcion: "Cabaña de bambú con paneles solares, ducha exterior y hamacas frente al Tayrona. Experiencia premium cero plásticos.",
    amenidades: ["Playa privada", "Paneles solares", "Yoga deck", "Tour Tayrona"],
    politicas: "Check-in 14:00 · Cancelación flexible 7 días · Capacidad 4.",
    anfitrion: { nombre: "Selva Viva Tayrona", plan: "premium", verificado: true, avatar: "SV", seguidores: 12400 },
    fechasOcupadasBooking: ["2026-10-18", "2026-10-19"],
    fechasOcupadasAirbnb: [],
    theme: { primary: "#0e7490", accent: "#fef3c7", preset: "mar", font: "sans", rationale: "Costero: azul oceánico profundo con acento arena dorada, sans-serif limpia" },
  },
  {
    id: "bio-medellin-04",
    titulo: "Habitación privada — Casa cowork Laureles",
    tipo: "reserva",
    categoria: "Privada",
    ciudad: "Medellín",
    precioNoche: 95000,
    rating: 4.7,
    resenas: 187,
    huespedes: 2,
    imagen: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800&q=80",
    galeria: ["https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800&q=80"],
    descripcion: "Habitación privada en casa cowork con terraza en Laureles. Plan gratuito del anfitrión: descripción corta y 1 foto.",
    amenidades: ["Wifi 500mb", "Escritorio", "Cocina compartida"],
    politicas: "Política básica plan gratuito · Cancelación 24h.",
    anfitrion: { nombre: "Host Paisa", plan: "gratuito", verificado: false, avatar: "HP", seguidores: 340 },
    fechasOcupadasBooking: [],
    fechasOcupadasAirbnb: [],
    theme: { primary: "#3f3f46", accent: "#e4e4e7", preset: "minimal", font: "sans", rationale: "Minimalista: gris neutro con acento plata, sans-serif limpia y funcional" },
  },
  {
    id: "bio-cartagena-05",
    titulo: "Subarriendo — Casa colonial Getsemaní 2 hab",
    tipo: "subarriendo",
    categoria: "Subarriendo",
    ciudad: "Cartagena",
    precioNoche: 140000,
    precioMes: 3200000,
    rating: 4.6,
    resenas: 64,
    huespedes: 4,
    imagen: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
    galeria: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80"],
    descripcion: "Casa colonial amoblada para subarrendar por meses en Getsemaní. Patio con hamacas, ideal teletrabajo y voluntarios.",
    amenidades: ["2 hab", "Wifi", "Patio hamacas", "Aire acondicionado"],
    politicas: "Mínimo 1 mes · Servicios incluidos · Se acepta voluntariado parcial.",
    anfitrion: { nombre: "Andrés Ruiz", plan: "corporativo", verificado: true, avatar: "AR", seguidores: 1200 },
    fechasOcupadasBooking: ["2026-10-28"],
    fechasOcupadasAirbnb: ["2026-10-28", "2026-10-29"],
    theme: { primary: "#92400e", accent: "#fcd34d", preset: "colonial", font: "serif", rationale: "Colonial: dorado ámbar con acento mostaza, serif elegante para evocar historia" },
  },
  {
    id: "bio-salento-06",
    titulo: "Dormitorio compartido — Terraza cafetera",
    tipo: "reserva",
    categoria: "Hostel",
    ciudad: "Salento",
    precioNoche: 55000,
    rating: 4.8,
    resenas: 540,
    huespedes: 1,
    imagen: "https://images.unsplash.com/photo-1537225228614-56cc3556d7ed?w=800&q=80",
    galeria: ["https://images.unsplash.com/photo-1537225228614-56cc3556d7ed?w=800&q=80"],
    descripcion: "Dormitorio 6 camas con vista al valle del Cocora. Desayuno campesino con café de origen incluido.",
    amenidades: ["Desayuno", "Lockers", "Tour Cocora", "Agua caliente"],
    politicas: "Check-in 13:00 · Silencio 22:00 · Cancelación 48h.",
    anfitrion: { nombre: "Casa Cocora", plan: "gratuito", verificado: true, avatar: "CC", seguidores: 6700 },
    fechasOcupadasBooking: [],
    fechasOcupadasAirbnb: [],
    theme: { primary: "#1d4a2c", accent: "#bef264", preset: "selva", font: "sans", rationale: "Eco-natural: verde selva con acento lima, sans-serif fresca para viajeros" },
  },
];

export type Ad = { empresa: string; categoria: string; titulo: string; texto: string; color: string; image?: string };

export const ADS: Ad[] = [
  { empresa: "TechStay", categoria: "Tecnología", titulo: "Cerraduras inteligentes -20%", texto: "Check-in sin llaves para tu hostel.", color: "#0ea5e9" },
  { empresa: "Dulce Sueño Bio", categoria: "Colchones", titulo: "Colchones orgánicos para anfitriones", texto: "Mejora tu rating con descanso real.", color: "#10b981" },
  { empresa: "EcoClean", categoria: "Higiene", titulo: "Kit higiene biodegradable", texto: "Amenidades compostables a granel.", color: "#8b5cf6" },
  { empresa: "SolarAndina", categoria: "Energía", titulo: "Paneles para hostels", texto: "Ahorra 40% en energía.", color: "#f59e0b" },
];

export const SPONSORS = [
  { nombre: "Fundación Reforesta", aporte: "1 reserva = 1 árbol", logo: "tree" },
  { nombre: "Fundación Mar Limpio", aporte: "Hostels cero plástico", logo: "waves" },
  { nombre: "Educa Viaja", aporte: "Becas voluntariado", logo: "book" },
];

export const PAQUETES = [
  { id: "voluntariado", nombre: "Voluntariado", precioCOP: 149000, precioNota: "inscripción", desc: "2-8 semanas: hospedaje + comidas por 4h/día de apoyo. Incluye certificado y seguro.", icono: "hands" },
  { id: "inscripcion", nombre: "Inscripción", precioCOP: 59000, precioNota: "/ año", desc: "Membresía viajera: descuentos 15%, cancelación flexible y puntos bio.", icono: "ticket" },
  { id: "premium-pack", nombre: "Premium Pack", precioCOP: 449000, precioNota: "", desc: "Voluntariado + inscripción + 5 noches gratis en red BioHostel + kit bienvenida.", icono: "gem" },
];

export function comisionPara(plan: PlanId, subtotal: number) {
  const p = PLANS.find((x) => x.id === plan)!;
  const comision = Math.round(subtotal * p.comisionValor);
  return { comision, total: subtotal + comision, tasa: p.comisionValor };
}

// Simulación IA de reservas: verifica booking + airbnb
export function aiVerificarReserva(l: Listing, checkIn: string, checkOut: string) {
  const noches: string[] = [];
  const ini = new Date(checkIn);
  const fin = new Date(checkOut);
  for (let d = new Date(ini); d < fin; d.setDate(d.getDate() + 1)) {
    noches.push(d.toISOString().slice(0, 10));
  }
  const choqueBooking = noches.filter((n) => l.fechasOcupadasBooking.includes(n));
  const choqueAirbnb = noches.filter((n) => l.fechasOcupadasAirbnb.includes(n));
  if (choqueBooking.length === 0 && choqueAirbnb.length === 0) {
    return {
      disponible: true,
      mensaje: `Verificación IA: ${noches.length} noches libres en Booking y Airbnb. Al reservar se bloquean en ambas plataformas.`,
      sugerencia: null as string | null,
    };
  }
  // sugerir siguiente día libre
  const todas = [...l.fechasOcupadasBooking, ...l.fechasOcupadasAirbnb];
  const sugerida = new Date(fin);
  for (let i = 0; i < 14; i++) {
    const s = sugerida.toISOString().slice(0, 10);
    if (!todas.includes(s)) break;
    sugerida.setDate(sugerida.getDate() + 1);
  }
  return {
    disponible: false,
    mensaje: `La IA encontró ocupación: Booking [${choqueBooking.join(", ") || "—"}] · Airbnb [${choqueAirbnb.join(", ") || "—"}]. No se puede reservar esas fechas.`,
    sugerencia: `Te sugerimos mover tu llegada al ${sugerida.toISOString().slice(0, 10)} o ver "${l.ciudad}" en otro alojamiento disponible.`,
  };
}
