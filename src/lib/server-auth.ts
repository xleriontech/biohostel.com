import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { store } from "./store";

export const SESSION_COOKIE = "bio_session";

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const key = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${key}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hex] = stored.split(":");
  if (!salt || !hex) return false;
  try {
    const a = scryptSync(password, salt, 64);
    const b = Buffer.from(hex, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function currentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const sessions = await store.sessions();
  const s = sessions.find((x) => x.token === token && new Date(x.expiresAt) > new Date());
  if (!s) return null;
  const users = await store.users();
  const u = users.find((x) => x.id === s.userId) ?? null;
  if (!u || u.banned) return null;
  return u;
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const sessions = await store.sessions();
  sessions.push({ token, userId, expiresAt: new Date(Date.now() + 30 * 864e5).toISOString() });
  await store.saveSessions(sessions);
  (await cookies()).set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 30 * 86400 });
}

export async function destroySession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token) {
    const sessions = await store.sessions();
    await store.saveSessions(sessions.filter((s) => s.token !== token));
  }
  (await cookies()).delete(SESSION_COOKIE);
}

export function publicUser(u: { id: string; name: string; email: string; plan: string; role: string; favorites: string[]; follows: string[] }) {
  return { id: u.id, name: u.name, email: u.email, plan: u.plan, role: u.role, favorites: u.favorites, follows: u.follows };
}

export async function requireAdmin() {
  const me = await currentUser();
  if (!me) return { error: "Inicia sesión." as const, status: 401 as const };
  if (me.role !== "admin") return { error: "Solo el administrador maestro." as const, status: 403 as const };
  return { user: me };
}
