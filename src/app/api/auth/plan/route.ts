import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { publicUser, requireAdmin } from "@/lib/server-auth";

// El plan solo lo cambia el administrador maestro (o un pago aprobado).
// Los anfitriones envían una solicitud desde el panel y queda en Leads.
export async function PATCH(req: Request) {
  const gate = await requireAdmin();
  if ("error" in gate) {
    return NextResponse.json(
      { error: "El cambio de plan requiere aprobación del administrador." },
      { status: 403 },
    );
  }
  const { plan } = await req.json().catch(() => ({}));
  if (!["gratuito", "corporativo", "premium"].includes(plan)) {
    return NextResponse.json({ error: "Plan inválido." }, { status: 400 });
  }
  const users = await store.users();
  const u = users.find((x) => x.id === gate.user.id);
  if (!u) return NextResponse.json({ error: "Cuenta no encontrada." }, { status: 404 });
  u.plan = plan;
  await store.saveUsers(users);
  const cfg = await store.config().catch(() => ({ rates: { gratuito: 0.1, corporativo: 0.05, premium: 0 } }));
  return NextResponse.json({ user: publicUser(u), rate: cfg.rates[plan as keyof typeof cfg.rates] ?? 0 });
}
