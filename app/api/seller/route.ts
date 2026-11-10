import { NextResponse } from "next/server";
import { getDb, slugify } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import {
  getProducerById,
  getProducerProducts,
  getQuestions,
  getOrdersForProducer,
  getRecentOrdersFallback,
  getSellerStats,
} from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function resolveProducerId() {
  const user = await getSessionUser();
  return user?.producer_id ?? 1;
}

export async function GET() {
  const producerId = await resolveProducerId();
  const producer = getProducerById(producerId) ?? getProducerById(1)!;
  const stats = getSellerStats(producer.id);
  const products = getProducerProducts(producer.id);
  const orders = getOrdersForProducer(producer.id);
  return NextResponse.json({
    producer,
    stats,
    products,
    orders: orders.length ? orders : getRecentOrdersFallback(),
    questions: getQuestions(producer.id),
  });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    price?: number;
    stock?: number;
    unit?: string;
    description?: string;
    category?: string;
    image?: string;
  };
  if (!body.name?.trim() || !body.price || Number(body.price) <= 0) {
    return NextResponse.json({ error: "Nombre y precio válidos son requeridos." }, { status: 400 });
  }
  const producerId = await resolveProducerId();
  const db = getDb();
  const slug = `${slugify(body.name)}-${Date.now().toString(36).slice(-4)}`;
  const image = body.image?.startsWith("/img/") ? body.image : "/img/img-24.jpg";
  const result = db
    .prepare(
      `INSERT INTO products (slug,producer_id,name,short,description,price,unit,image,stock,stock_label,category,tags,status,featured,badge,rating,review_count)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    )
    .run(
      slug,
      producerId,
      body.name.trim().slice(0, 140),
      body.description?.trim().slice(0, 160) ?? "Nuevo producto de temporada.",
      body.description?.trim().slice(0, 500) ?? "Nuevo producto de temporada.",
      Math.round(Number(body.price)),
      body.unit?.slice(0, 24) || "pieza",
      image,
      Math.max(0, Math.round(Number(body.stock ?? 1))),
      `${Math.max(0, Math.round(Number(body.stock ?? 1)))} disponibles`,
      body.category || "cafe",
      "Nuevo",
      "activo",
      0,
      "Nuevo",
      5,
      0,
    );
  return NextResponse.json({ id: Number(result.lastInsertRowid) });
}

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    id?: number;
    status?: string;
    price?: number;
    stock?: number;
  };
  if (!body.id) return NextResponse.json({ error: "id es requerido" }, { status: 400 });
  const producerId = await resolveProducerId();
  const db = getDb();
  const product = db.prepare("SELECT * FROM products WHERE id = ? AND producer_id = ?").get(body.id, producerId) as
    | { id: number }
    | undefined;
  if (!product) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  if (body.status && ["activo", "pausado"].includes(body.status)) {
    db.prepare("UPDATE products SET status = ? WHERE id = ?").run(body.status, body.id);
  }
  if (typeof body.price === "number" && body.price > 0) {
    db.prepare("UPDATE products SET price = ? WHERE id = ?").run(Math.round(body.price), body.id);
  }
  if (typeof body.stock === "number" && body.stock >= 0) {
    db.prepare("UPDATE products SET stock = ?, stock_label = ? WHERE id = ?").run(
      Math.round(body.stock),
      `${Math.round(body.stock)} disponibles`,
      body.id,
    );
  }
  return NextResponse.json({ ok: true });
}
