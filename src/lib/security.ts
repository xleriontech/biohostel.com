const limits: Record<string, { count: number; reset: number }> = {};

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  if (!limits[key] || now > limits[key].reset) {
    limits[key] = { count: 1, reset: now + windowMs };
    return true;
  }
  limits[key].count++;
  return limits[key].count <= max;
}
