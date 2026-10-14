import { NextResponse } from "next/server";
import { store, uid } from "@/lib/store";
import { currentUser } from "@/lib/server-auth";

export async function GET() {
  const me = await currentUser();
  if (!me) return NextResponse.json({ channels: [] });
  const all = await store.channels();
  return NextResponse.json({ channels: all.filter((c) => c.userId === me.id) });
}

export async function POST(req: Request) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  const { plataforma, cuenta } = await req.json().catch(() => ({}));
  if (!plataforma?.trim() || !cuenta?.trim()) {
    return NextResponse.json({ error: "Plataforma y cuenta son obligatorias." }, { status: 400 });
  }
  const all = await store.channels();
  const ch = {
    id: uid("ch"),
    userId: me.id,
    plataforma: String(plataforma).trim().slice(0, 40),
    cuenta: String(cuenta).trim().slice(0, 120),
    ultima: "ahora mismo",
  };
  all.unshift(ch);
  await store.saveChannels(all);
  return NextResponse.json({ channel: ch });
}

export async function DELETE(req: Request) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  const all = await store.channels();
  await store.saveChannels(all.filter((c) => !(c.id === id && c.userId === me.id)));
  return NextResponse.json({ ok: true });
}
