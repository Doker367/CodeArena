import { NextResponse } from "next/server";
import { getDb, verifyPassword } from "@/lib/db";
import { createSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
    identifier?: string;
  };
  const identifier = (body.identifier ?? body.email ?? "").trim();
  if (!identifier || !body.password) {
    return NextResponse.json({ error: "Ingresa tu correo o WhatsApp y contraseña." }, { status: 400 });
  }
  const db = getDb();
  const user = db
    .prepare(
      "SELECT id,name,email,phone,role,producer_id,password_hash FROM users WHERE lower(email) = lower(?) OR phone = ? OR phone = ?",
    )
    .get(identifier, identifier, identifier.replace(/[^0-9+]/g, "")) as
    | { id: number; name: string; email: string; phone: string; role: string; producer_id: number | null; password_hash: string }
    | undefined;
  if (!user || !verifyPassword(body.password, user.password_hash)) {
    return NextResponse.json({ error: "Correo o contraseña incorrectos." }, { status: 401 });
  }
  await createSession(user.id);
  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, producer_id: user.producer_id },
  });
}

