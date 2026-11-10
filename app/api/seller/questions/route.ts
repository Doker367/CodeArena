import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { id?: number; answer?: string };
  if (!body.id || !body.answer?.trim()) {
    return NextResponse.json({ error: "id y respuesta son requeridos" }, { status: 400 });
  }
  getDb().prepare("UPDATE questions SET answer = ? WHERE id = ?").run(body.answer.trim().slice(0, 800), body.id);
  return NextResponse.json({ ok: true });
}
