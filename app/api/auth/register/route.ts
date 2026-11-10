import { NextResponse } from "next/server";
import { getDb, newToken, slugify } from "@/lib/db";
import crypto from "node:crypto";
import { createSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
    role?: string;
  };
  const role = ["comprador", "productor", "eco"].includes(body.role ?? "") ? body.role! : "comprador";
  if (!body.name?.trim() || !body.email?.trim() || !body.phone?.trim() || !body.password) {
    return NextResponse.json({ error: "Completa tu nombre, teléfono, correo y contraseña." }, { status: 400 });
  }
  if (body.password.length < 6) {
    return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres." }, { status: 400 });
  }
  if (!/^\S+@\S+\.\S+$/.test(body.email)) {
    return NextResponse.json({ error: "Ingresa un correo electrónico válido." }, { status: 400 });
  }

  const db = getDb();
  const existing = db
    .prepare("SELECT id FROM users WHERE lower(email) = lower(?) OR phone = ?")
    .get(body.email.trim(), body.phone.trim());
  if (existing) {
    return NextResponse.json({ error: "Ya existe una cuenta con este correo o WhatsApp. Inicia sesión." }, { status: 409 });
  }

  let producerId: number | null = null;
  if (role === "productor") {
    const base = slugify(body.name) || "emprendimiento";
    const slug = `${base}-${newToken().slice(0, 5)}`;
    const result = db
      .prepare(
        `INSERT INTO producers (slug,name,kind,municipality,region,rating,review_count,verified,tagline,about,avatar,cover,phone,whatsapp,hours,delivery,badge,category)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      )
      .run(
        slug,
        body.name.trim(),
        "Emprendimiento en verificación",
        "San Cristóbal de Las Casas",
        "Los Altos",
        5,
        0,
        0,
        "Nuevo emprendimiento comunitario",
        "Este emprendimiento acaba de unirse a Origen Chiapas.",
        "/img/img-01.jpg",
        "/img/img-08.jpg",
        body.phone,
        body.phone,
        "Lunes a Sábado 08:00–18:00",
        "Entrega local y envío nacional",
        "Nuevo",
        "artesania",
      );
    producerId = Number(result.lastInsertRowid);
  }

  const insert = db
    .prepare("INSERT INTO users (name,email,phone,password_hash,role,producer_id,created_at) VALUES (?,?,?,?,?,?,?)")
    .run(
      body.name.trim().slice(0, 120),
      body.email.trim(),
      body.phone.trim().slice(0, 40),
      hashPassword(body.password),
      role,
      producerId,
      new Date().toISOString(),
    );
  const userId = Number(insert.lastInsertRowid);
  await createSession(userId);
  return NextResponse.json({
    user: { id: userId, name: body.name.trim(), email: body.email.trim(), phone: body.phone, role, producer_id: producerId },
  });
}
