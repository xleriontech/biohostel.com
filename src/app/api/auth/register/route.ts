import { NextResponse } from "next/server";
import { store, uid } from "@/lib/store";
import { createSession, hashPassword, publicUser } from "@/lib/server-auth";

export async function POST(req: Request) {
  const { name, email, password } = await req.json().catch(() => ({}));
  if (!name?.trim() || !email?.trim() || !password || password.length < 6) {
    return NextResponse.json({ error: "Nombre, correo válido y contraseña de 6+ caracteres." }, { status: 400 });
  }
  const users = await store.users();
  if (users.some((u) => u.email.toLowerCase() === String(email).toLowerCase())) {
    return NextResponse.json({ error: "Ese correo ya tiene cuenta. Inicia sesión." }, { status: 409 });
  }
  const user = {
    id: uid("u"),
    name: String(name).trim().slice(0, 80),
    email: String(email).trim().toLowerCase(),
    passwordHash: await hashPassword(String(password)),
    plan: "gratuito" as const,
    role: "user" as const,
    favorites: [] as string[],
    follows: [] as string[],
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  await store.saveUsers(users);
  await createSession(user.id);
  return NextResponse.json({ user: publicUser(user) });
}
