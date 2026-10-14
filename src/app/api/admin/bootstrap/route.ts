import { NextResponse } from "next/server";
import { store, uid } from "@/lib/store";
import { createSession, currentUser, hashPassword, publicUser } from "@/lib/server-auth";

const SETUP_KEY = process.env.ADMIN_SETUP_KEY || "BIOHOSTEL-MASTER-2026";

// Crea el primer admin (o promueve un correo existente) con la clave de instalación.
export async function POST(req: Request) {
  const { name, email, password, setupKey } = await req.json().catch(() => ({}));
  if (setupKey !== SETUP_KEY) {
    return NextResponse.json({ error: "Clave de instalación incorrecta." }, { status: 403 });
  }
  if (!email?.trim()) {
    return NextResponse.json({ error: "Correo obligatorio." }, { status: 400 });
  }
  const users = await store.users();
  const existing = users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
  if (existing) {
    existing.role = "admin";
    await store.saveUsers(users);
    await createSession(existing.id);
    return NextResponse.json({ user: publicUser(existing), promoted: true });
  }
  if (!name?.trim()) return NextResponse.json({ error: "Nombre obligatorio para cuenta nueva." }, { status: 400 });
  if (!password || password.length < 6) {
    return NextResponse.json({ error: "Contraseña de 6+ caracteres." }, { status: 400 });
  }
  const admin = {
    id: uid("u"),
    name: String(name).trim().slice(0, 80),
    email: String(email).trim().toLowerCase(),
    passwordHash: hashPassword(String(password)),
    plan: "premium" as const,
    role: "admin" as const,
    favorites: [] as string[],
    follows: [] as string[],
    createdAt: new Date().toISOString(),
  };
  users.push(admin);
  await store.saveUsers(users);
  await createSession(admin.id);
  return NextResponse.json({ user: publicUser(admin), promoted: false });
}

export async function GET() {
  const users = await store.users().catch(() => []);
  const me = await currentUser().catch(() => null);
  return NextResponse.json({ hasAdmin: users.some((u) => u.role === "admin"), isAdmin: me?.role === "admin", me: me ? publicUser(me) : null });
}
