import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { currentUser, publicUser } from "@/lib/server-auth";

async function toggle(req: Request, field: "favorites" | "follows") {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  const { id } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "Falta id." }, { status: 400 });
  const users = await store.users();
  const u = users.find((x) => x.id === me.id)!;
  u[field] = u[field].includes(id) ? u[field].filter((x) => x !== id) : [...u[field], id];
  await store.saveUsers(users);
  return NextResponse.json({ user: publicUser(u) });
}

export async function POST(req: Request) {
  return toggle(req, "favorites");
}
