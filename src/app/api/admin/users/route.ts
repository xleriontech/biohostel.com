import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { publicUser, requireAdmin } from "@/lib/server-auth";

export async function GET() {
  const gate = await requireAdmin();
  if ("error" in gate) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const users = await store.users();
  return NextResponse.json({ users: users.map(publicUser) });
}

export async function PATCH(req: Request) {
  const gate = await requireAdmin();
  if ("error" in gate) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const { id, plan, role, banned } = await req.json().catch(() => ({}));
  const users = await store.users();
  const u = users.find((x) => x.id === id);
  if (!u) return NextResponse.json({ error: "No existe." }, { status: 404 });
  if (typeof banned === "boolean") {
    if (u.id === gate.user.id) return NextResponse.json({ error: "No puedes banearte a ti mismo." }, { status: 400 });
    u.banned = banned;
  }
  if (plan && ["gratuito", "corporativo", "premium"].includes(plan)) u.plan = plan;
  if (role && ["user", "admin"].includes(role)) {
    if (u.id === gate.user.id && role !== "admin") {
      return NextResponse.json({ error: "No puedes quitarte tu propio acceso maestro." }, { status: 400 });
    }
    u.role = role;
  }
  await store.saveUsers(users);
  return NextResponse.json({ user: publicUser(u) });
}

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if ("error" in gate) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const { id, action } = await req.json().catch(() => ({}));
  if (action !== "reset-password") return NextResponse.json({ error: "Acción inválida." }, { status: 400 });
  const users = await store.users();
  const u = users.find((x) => x.id === id);
  if (!u) return NextResponse.json({ error: "No existe." }, { status: 404 });
  const temp = "Bio-" + Math.random().toString(36).slice(2, 8).toUpperCase();
  const { hashPassword } = await import("@/lib/server-auth");
  u.passwordHash = hashPassword(temp);
  await store.saveUsers(users);
  return NextResponse.json({ tempPassword: temp });
}

export async function DELETE(req: Request) {
  const gate = await requireAdmin();
  if ("error" in gate) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const id = new URL(req.url).searchParams.get("id");
  if (id === gate.user.id) return NextResponse.json({ error: "No puedes eliminarte a ti mismo." }, { status: 400 });
  const users = await store.users();
  await store.saveUsers(users.filter((u) => u.id !== id));
  return NextResponse.json({ ok: true });
}
