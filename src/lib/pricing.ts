export function dynamicPrice(priceNight: number, tipo: "reserva" | "subarriendo", priceMonth?: number, fechas?: { checkIn: string; checkOut: string }, guests?: number, baseGuests?: number, registrado?: boolean): number {
  const noches = fechas ? Math.max(1, Math.round((new Date(fechas.checkOut + "T12:00:00").getTime() - new Date(fechas.checkIn + "T12:00:00").getTime()) / 86400000)) : 1;
  const base = tipo === "subarriendo" && priceMonth ? priceMonth : priceNight * noches;

  // Descuento por estancia larga (solo para registrados)
  let descuento = 0;
  if (registrado) {
    if (tipo === "subarriendo") descuento = Math.min(0.2, noches / 90);
    else if (noches >= 14) descuento = 0.15;
    else if (noches >= 7) descuento = 0.1;
  }

  // Extra por huésped (solo para registrados)
  const extraHuespedes = registrado ? Math.max(0, (guests ?? baseGuests ?? 2) - (baseGuests ?? 2)) * 0.1 : 0;

  // Multiplicador demanda simulado (aleatorio controlado para no romper datos)
  const demanda = Math.random() * 0.2; // 0 a +20%

  const total = base * (1 + extraHuespedes + demanda) * (1 - descuento);
  return Math.round(total);
}
