import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ensureCart, getSessionUser } from "@/lib/session";
import { getCart } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DELIVERY_COSTS: Record<string, number> = { recoger: 0, local: 45, nacional: 120 };

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    delivery?: string;
    payment?: string;
    note?: string;
  };

  const delivery = payload.delivery && payload.delivery in DELIVERY_COSTS ? payload.delivery : null;
  if (!payload.name?.trim() || !payload.phone?.trim() || !payload.email?.trim() || !payload.address?.trim() || !delivery || !payload.payment) {
    return NextResponse.json({ error: "Completa todos los datos de contacto, entrega y pago." }, { status: 400 });
  }

  const cartId = await ensureCart();
  const cart = getCart(cartId);
  if (cart.lines.length === 0) {
    return NextResponse.json({ error: "Tu carrito está vacío." }, { status: 409 });
  }

  const db = getDb();
  const user = await getSessionUser();
  const deliveryCost = DELIVERY_COSTS[delivery];
  const subtotal = cart.subtotal;
  const total = subtotal + deliveryCost;
  const count = (db.prepare("SELECT COUNT(*) AS n FROM orders").get() as { n: number }).n;
  const code = `ORD-${1083 + count}`;

  db.exec("BEGIN");
  try {
    const order = db
      .prepare(
        `INSERT INTO orders (code,user_id,name,phone,email,address,delivery_method,delivery_cost,payment_method,subtotal,total,status,note,created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      )
      .run(
        code,
        user?.id ?? null,
        payload.name.trim().slice(0, 120),
        payload.phone.trim().slice(0, 40),
        payload.email.trim().slice(0, 120),
        payload.address.trim().slice(0, 300),
        delivery,
        deliveryCost,
        payload.payment.slice(0, 60),
        subtotal,
        total,
        "Por preparar",
        payload.note?.slice(0, 400) ?? "",
        new Date().toISOString(),
      );
    const orderId = Number(order.lastInsertRowid);
    const insertItem = db.prepare(
      "INSERT INTO order_items (order_id,product_id,name,price,qty,image,producer_name) VALUES (?,?,?,?,?,?,?)",
    );
    for (const line of cart.lines) {
      insertItem.run(
        orderId,
        line.product.id,
        line.product.name,
        line.product.price,
        line.qty,
        line.product.image,
        line.producer.name,
      );
      db.prepare("UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?").run(line.qty, line.product.id);
      db.prepare(
        `INSERT INTO messages (thread_id, sender, body, product_id, created_at)
         SELECT id, 'buyer', ?, ?, ? FROM threads WHERE producer_id = ? LIMIT 1`,
      ).run(
        `¡Hola! Acabo de confirmar el pedido ${code} por ${line.qty} × ${line.product.name}. Coordinemos la entrega por aquí.`,
        line.product.id,
        new Date().toISOString(),
        line.producer.id,
      );
    }
    db.prepare("DELETE FROM cart_items WHERE cart_id = ?").run(cartId);
    db.exec("COMMIT");

    const producers = Array.from(new Map(cart.lines.map((l) => [l.producer.id, l.producer])).values());
    return NextResponse.json({
      code,
      subtotal,
      deliveryCost,
      total,
      producers: producers.map((p) => ({ name: p.name, whatsapp: p.whatsapp.replace(/\D/g, "") })),
    });
  } catch {
    db.exec("ROLLBACK");
    return NextResponse.json({ error: "No pudimos crear el pedido. Intenta de nuevo." }, { status: 500 });
  }
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ orders: [] });
  const orders = getDb()
    .prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC")
    .all(user.id) as unknown as Record<string, unknown>[];
  return NextResponse.json({ orders });
}
