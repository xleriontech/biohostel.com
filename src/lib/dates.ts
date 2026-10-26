export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function defaultStayRange(minNights = 1, today = new Date()) {
  const nights = Math.max(1, Math.floor(minNights) || 1);
  return {
    checkIn: toISODate(today),
    checkOut: toISODate(addDays(today, nights)),
  };
}
