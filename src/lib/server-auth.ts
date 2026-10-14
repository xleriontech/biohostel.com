import { cookies } from "next/headers";
import { store } from "./store";

function hex(bytes: ArrayBuffer | Uint8Array): string {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return Array.from(b).map((x) => x.toString(16).padStart(2, "0")).join("");
}

function randomHex(n: number): string {
  const b = new Uint8Array(n);
  globalThis.crypto.getRandomValues(b);
  return hex(b);
}

// PBKDF2-SHA256 vía WebCrypto: funciona en Node y en Cloudflare Workers.
export async function hashPassword(password: string) {
  const salt = randomHex(16);
  const enc = new TextEncoder();
  const key = await globalThis.crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await globalThis.crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: enc.encode(salt), iterations: 120000, hash: "SHA-256" },
    key,
    256,
  );
  return `pbkdf2$120000$${salt}$${hex(bits)}`;
}

function constantEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function verifyPbkdf2(password: string, stored: string): Promise<boolean> {
  const [, iter, salt, expected] = stored.split("$");
  const enc = new TextEncoder();
  try {
    const key = await globalThis.crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
    const bits = await globalThis.crypto.subtle.deriveBits(
      { name: "PBKDF2", salt: enc.encode(salt), iterations: Number(iter) || 120000, hash: "SHA-256" },
      key,
      256,
    );
    return constantEqual(hex(bits), expected);
  } catch {
    return false;
  }
}

// Compatibilidad con cuentas viejas (scrypt). Requiere Node o flag nodejs_compat.
async function verifyLegacyScrypt(password: string, stored: string): Promise<boolean> {
  try {
    const { scryptSync, timingSafeEqual } = await import("node:crypto");
    const [salt, storedKey] = stored.split(":");
    if (!salt || !storedKey) return false;
    const candidate = scryptSync(password, salt, 64);
    const expected = Buffer.from(storedKey, "hex");
    return candidate.length === expected.length && timingSafeEqual(candidate, expected);
  } catch {
    return false;
  }
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (stored.startsWith("pbkdf2$")) return verifyPbkdf2(password, stored);
  return verifyLegacyScrypt(password, stored);
}

export const SESSION_COOKIE = "bio_session";

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
  const raw = new Uint8Array(32);
  globalThis.crypto.getRandomValues(raw);
  const token = btoa(String.fromCharCode(...raw)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
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
