import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { id?: number; status?: string };
  if (!body.id || !body.status) {
    return NextResponse.json({ error: "id y status son requeridos" }, { status: 400 });
  }
  if (!["Por preparar", "Listo para entrega", "Entregado", "En camino"].includes(body.status)) {
    return NextResponse.json({ error: "Estado no válido" }, { status: 400 });
  }
  getDb().prepare("UPDATE orders SET status = ? WHERE id = ?").run(body.status, body.id);
  return NextResponse.json({ ok: true });
}
