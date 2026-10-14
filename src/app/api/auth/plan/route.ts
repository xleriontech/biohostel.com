import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { currentUser, publicUser } from "@/lib/server-auth";



export async function PATCH(req: Request) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  const { plan } = await req.json().catch(() => ({}));
  if (!["gratuito", "corporativo", "premium"].includes(plan)) {
    return NextResponse.json({ error: "Plan inválido." }, { status: 400 });
  }
  const users = await store.users();
  const u = users.find((x) => x.id === me.id)!;
  u.plan = plan;
  await store.saveUsers(users);
  const cfg = await store.config().catch(() => ({ rates: { gratuito: 0.1, corporativo: 0.05, premium: 0 } }));
  return NextResponse.json({ user: publicUser(u), rate: cfg.rates[plan as keyof typeof cfg.rates] ?? 0 });
}
