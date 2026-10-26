import { NextResponse } from "next/server";
import { store, uid } from "@/lib/store";
import { currentUser } from "@/lib/server-auth";

// POST público: solicitudes de paquetes, publicidad, voluntariado, contacto
export async function POST(req: Request) {
  const { tipo, nombre, email, mensaje, detalle } = await req.json().catch(() => ({}));
  const tipoLead = String(tipo ?? "contacto").slice(0, 40);
  let nombreLead = String(nombre ?? "").trim().slice(0, 80);
  let emailLead = String(email ?? "").trim().slice(0, 120);
  const detalleLead = String(detalle ?? "").slice(0, 300);
  if (tipoLead === "plan") {
    const me = await currentUser();
    if (!me) return NextResponse.json({ error: "Inicia sesión para solicitar un plan." }, { status: 401 });
    if (!["gratuito", "corporativo", "premium"].includes(detalleLead)) {
      return NextResponse.json({ error: "Plan inválido." }, { status: 400 });
    }
    // El plan solicitado siempre queda asociado a la cuenta autenticada.
    nombreLead = me.name;
    emailLead = me.email;
  }
  if (!nombreLead || !emailLead) {
    return NextResponse.json({ error: "Nombre y correo son obligatorios." }, { status: 400 });
  }
  const leads = await store.leads();
  const lead = {
    id: uid("lead"),
    tipo: tipoLead,
    nombre: nombreLead,
    email: emailLead,
    mensaje: String(mensaje ?? "").slice(0, 2000),
    detalle: detalleLead,
    estado: "nuevo",
    notas: "",
    createdAt: new Date().toISOString(),
  };
  leads.unshift(lead);
  await store.saveLeads(leads);
  return NextResponse.json({ ok: true, id: lead.id });
}

// GET: solo las solicitudes propias (el admin usa /api/admin/leads)
export async function GET() {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  const all = await store.leads();
  if (me.role === "admin") return NextResponse.json({ leads: all });
  const mine = all.filter((l) => l.email.toLowerCase() === me.email.toLowerCase());
  return NextResponse.json({ leads: mine });
}
