import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { createSession, publicUser, verifyPassword } from "@/lib/server-auth";
import { rateLimit } from "@/lib/security";

export async function POST(req: Request) {
  const clientKey = req.headers.get("x-forwarded-for") || "unknown";
  if (!rateLimit(`login-${clientKey}`, 5, 30000)) return NextResponse.json({ error: "Demasiados intentos. Intenta en 30s." }, { status: 429 });
  const { email, password } = await req.json().catch(() => ({}));
  const users = await store.users();
  const user = users.find((u) => u.email.toLowerCase() === String(email ?? "").toLowerCase());
  if (!user || !verifyPassword(String(password ?? ""), user.passwordHash)) {
    return NextResponse.json({ error: "Correo o contraseña incorrectos." }, { status: 401 });
  }
  if (user.banned) {
    return NextResponse.json({ error: "Cuenta suspendida. Contacta a soporte." }, { status: 403 });
  }
  await createSession(user.id);
  return NextResponse.json({ user: publicUser(user) });
}
