import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { currentUser, publicUser } from "@/lib/server-auth";

export async function POST(req: Request) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  const { id } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "Falta id." }, { status: 400 });
  const users = await store.users();
  const u = users.find((x) => x.id === me.id)!;
  u.follows = u.follows.includes(id) ? u.follows.filter((x) => x !== id) : [...u.follows, id];
  await store.saveUsers(users);
  return NextResponse.json({ user: publicUser(u) });
}
