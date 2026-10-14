import { NextResponse } from "next/server";
import { store, uid } from "@/lib/store";
import { currentUser } from "@/lib/server-auth";

// POST público: solicitudes de paquetes, publicidad, voluntariado, contacto
export async function POST(req: Request) {
  const { tipo, nombre, email, mensaje, detalle } = await req.json().catch(() => ({}));
  if (!nombre?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "Nombre y correo son obligatorios." }, { status: 400 });
  }
  const leads = await store.leads();
  const lead = {
    id: uid("lead"),
    tipo: String(tipo ?? "contacto").slice(0, 40),
    nombre: String(nombre).trim().slice(0, 80),
    email: String(email).trim().slice(0, 120),
    mensaje: String(mensaje ?? "").slice(0, 2000),
    detalle: String(detalle ?? "").slice(0, 300),
    estado: "nuevo",
    notas: "",
    createdAt: new Date().toISOString(),
  };
  leads.unshift(lead);
  await store.saveLeads(leads);
  return NextResponse.json({ ok: true, id: lead.id });
}

// GET: inbox para el panel
export async function GET() {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  return NextResponse.json({ leads: await store.leads() });
}
