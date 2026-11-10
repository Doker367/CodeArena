import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ensureCart } from "@/lib/session";
import { getCart } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const cartId = await ensureCart();
  return NextResponse.json(getCart(cartId));
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    productId?: number;
    qty?: number;
    note?: string;
  };
  if (!body.productId) {
    return NextResponse.json({ error: "productId es requerido" }, { status: 400 });
  }
  const db = getDb();
  const product = db.prepare("SELECT id, stock, status FROM products WHERE id = ?").get(body.productId) as
    | { id: number; stock: number; status: string }
    | undefined;
  if (!product || product.status !== "activo" || product.stock < 1) {
    return NextResponse.json({ error: "Producto no disponible" }, { status: 409 });
  }
  const cartId = await ensureCart();
  const qty = Math.max(1, Math.min(Number(body.qty ?? 1), 99));
  db.prepare(
    `INSERT INTO cart_items (cart_id, product_id, qty, note) VALUES (?,?,?,?)
     ON CONFLICT(cart_id, product_id) DO UPDATE SET qty = MIN(99, cart_items.qty + excluded.qty)`,
  ).run(cartId, product.id, qty, body.note?.slice(0, 300) ?? "");
  return NextResponse.json(getCart(cartId));
}

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    lineId?: number;
    qty?: number;
    note?: string;
  };
  if (!body.lineId) return NextResponse.json({ error: "lineId es requerido" }, { status: 400 });
  const db = getDb();
  const cartId = await ensureCart();
  const line = db.prepare("SELECT * FROM cart_items WHERE id = ? AND cart_id = ?").get(body.lineId, cartId) as
    | { id: number; qty: number }
    | undefined;
  if (!line) return NextResponse.json({ error: "Línea no encontrada" }, { status: 404 });

  if (typeof body.qty === "number") {
    const qty = Math.max(0, Math.min(99, Math.floor(body.qty)));
    if (qty === 0) {
      db.prepare("DELETE FROM cart_items WHERE id = ?").run(line.id);
    } else {
      db.prepare("UPDATE cart_items SET qty = ? WHERE id = ?").run(qty, line.id);
    }
  }
  if (typeof body.note === "string") {
    db.prepare("UPDATE cart_items SET note = ? WHERE id = ?").run(body.note.slice(0, 300), line.id);
  }
  return NextResponse.json(getCart(cartId));
}

export async function DELETE(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { lineId?: number; all?: boolean };
  const db = getDb();
  const cartId = await ensureCart();
  if (body.all) {
    db.prepare("DELETE FROM cart_items WHERE cart_id = ?").run(cartId);
  } else if (body.lineId) {
    db.prepare("DELETE FROM cart_items WHERE id = ? AND cart_id = ?").run(body.lineId, cartId);
  }
  return NextResponse.json(getCart(cartId));
}
