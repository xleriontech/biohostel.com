function nightsBetween(checkIn: string, checkOut: string): number {
  return Math.max(
    1,
    Math.round(
      (new Date(`${checkOut}T12:00:00`).getTime() - new Date(`${checkIn}T12:00:00`).getTime()) / 86400000,
    ),
  );
}

// Demanda determinística: el precio debe ser igual en la cotización y al
// confirmar, y no puede cambiar entre peticiones idénticas.
function demandMultiplier(tipo: "reserva" | "subarriendo", checkIn: string, checkOut: string): number {
  if (tipo !== "reserva") return 0;
  const nights = nightsBetween(checkIn, checkOut);
  let score = 0;
  const cursor = new Date(`${checkIn}T12:00:00`);
  for (let i = 0; i < nights; i++) {
    const weekday = cursor.getDay();
    const month = cursor.getMonth() + 1;
    const day = cursor.getDate();
    if (weekday === 5 || weekday === 6) score += 0.08;
    if ((month === 12 && day >= 20) || (month === 1 && day <= 10)) score += 0.12;
    else if (month === 6 || month === 7) score += 0.05;
    cursor.setDate(cursor.getDate() + 1);
  }
  return Math.min(0.2, score / nights);
}

export function dynamicPrice(
  priceNight: number,
  tipo: "reserva" | "subarriendo",
  priceMonth?: number,
  fechas?: { checkIn: string; checkOut: string },
  guests?: number,
  baseGuests?: number,
  registrado?: boolean,
): number {
  const noches = fechas ? nightsBetween(fechas.checkIn, fechas.checkOut) : 1;
  const base = tipo === "subarriendo" && priceMonth ? priceMonth : priceNight * noches;

  let descuento = 0;
  if (registrado) {
    if (tipo === "subarriendo") descuento = Math.min(0.2, noches / 90);
    else if (noches >= 14) descuento = 0.15;
    else if (noches >= 7) descuento = 0.1;
  }

  const extraHuespedes = registrado ? Math.max(0, (guests ?? baseGuests ?? 2) - (baseGuests ?? 2)) * 0.1 : 0;
  const demanda = fechas ? demandMultiplier(tipo, fechas.checkIn, fechas.checkOut) : 0;

  return Math.round(base * (1 + extraHuespedes + demanda) * (1 - descuento));
}
