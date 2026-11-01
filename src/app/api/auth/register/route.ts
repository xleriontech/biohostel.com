import { NextResponse } from "next/server";
import { store, uid } from "@/lib/store";
import { createSession, hashPassword, publicUser } from "@/lib/server-auth";
import { appendConsent, newConsentRecord, requestMeta } from "@/lib/consent";

export async function POST(req: Request) {
  const { name, email, password, consent } = await req.json().catch(() => ({}));
  if (!name?.trim() || !email?.trim() || !password || password.length < 6) {
    return NextResponse.json({ error: "Nombre, correo válido y contraseña de 6+ caracteres." }, { status: 400 });
  }
  if (consent !== true) {
    return NextResponse.json(
      { error: "Debes autorizar el tratamiento de tus datos personales para crear la cuenta (Ley 1581 de 2012)." },
      { status: 400 },
    );
  }
  const users = await store.users();
  if (users.some((u) => u.email.toLowerCase() === String(email).toLowerCase())) {
    return NextResponse.json({ error: "Ese correo ya tiene cuenta. Inicia sesión." }, { status: 409 });
  }

  const id = uid("u");
  const normalizedEmail = String(email).trim().toLowerCase();
  const meta = requestMeta(req);
  const record = newConsentRecord({ kind: "registro", userId: id, email: normalizedEmail, ...meta });
  if (!(await appendConsent(record))) {
    return NextResponse.json({ error: "No se pudo registrar tu consentimiento. Intenta de nuevo." }, { status: 503 });
  }

  const user = {
    id,
    name: String(name).trim().slice(0, 80),
    email: normalizedEmail,
    passwordHash: await hashPassword(String(password)),
    plan: "gratuito" as const,
    role: "user" as const,
    favorites: [] as string[],
    follows: [] as string[],
    createdAt: record.acceptedAt,
    consentVersion: record.policyVersion,
    consentAt: record.acceptedAt,
    consentIp: meta.ip,
  };
  users.push(user);
  await store.saveUsers(users);
  await createSession(user.id);
  return NextResponse.json({ user: publicUser(user) });
}
