export type Currency = { code: string; nombre: string; flag: string; locale: string };

// Monedas más usadas: base COP + mundo + LATAM
export const CURRENCIES: Currency[] = [
  { code: "COP", nombre: "Peso colombiano", flag: "🇨🇴", locale: "es-CO" },
  { code: "USD", nombre: "Dólar EE. UU.", flag: "🇺🇸", locale: "en-US" },
  { code: "EUR", nombre: "Euro", flag: "🇪🇺", locale: "es-ES" },
  { code: "MXN", nombre: "Peso mexicano", flag: "🇲🇽", locale: "es-MX" },
  { code: "BRL", nombre: "Real brasileño", flag: "🇧🇷", locale: "pt-BR" },
  { code: "ARS", nombre: "Peso argentino", flag: "🇦🇷", locale: "es-AR" },
  { code: "CLP", nombre: "Peso chileno", flag: "🇨🇱", locale: "es-CL" },
  { code: "PEN", nombre: "Sol peruano", flag: "🇵🇪", locale: "es-PE" },
  { code: "GBP", nombre: "Libra esterlina", flag: "🇬🇧", locale: "en-GB" },
  { code: "CAD", nombre: "Dólar canadiense", flag: "🇨🇦", locale: "en-CA" },
  { code: "JPY", nombre: "Yen japonés", flag: "🇯🇵", locale: "ja-JP" },
  { code: "CHF", nombre: "Franco suizo", flag: "🇨🇭", locale: "de-CH" },
];

// COP por 1 unidad extranjera (respaldo si no hay internet; la tasa del día la actualiza /api/rates)
export const FALLBACK_RATES: Record<string, number> = {
  COP: 1, USD: 4300, EUR: 4680, MXN: 218, BRL: 760, ARS: 4.6, CLP: 4.55,
  PEN: 1160, GBP: 5450, CAD: 3120, JPY: 28.5, CHF: 4860,
};
