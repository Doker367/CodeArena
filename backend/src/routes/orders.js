const express = require("express");
const { getDb } = require("../db");
const { ensureCart, ensureGuest, getSessionUser } = require("../session");
const { createMessage, createThread, findThread, getCart } = require("../queries");

const router = express.Router();

const DELIVERY_COSTS = { recoger: 0, local: 45, nacional: 120 };

router.post("/", (req, res) => {
  const payload = req.body ?? {};
  const delivery = payload.delivery && payload.delivery in DELIVERY_COSTS ? payload.delivery : null;
  if (
    !payload.name?.trim() ||
    !payload.phone?.trim() ||
    !payload.email?.trim() ||
    !payload.address?.trim() ||
    !delivery ||
    !payload.payment
  ) {
    return res.status(400).json({ error: "Completa todos los datos de contacto, entrega y pago." });
  }

  const cartId = ensureCart(req, res);
  const cart = getCart(cartId);
  if (cart.lines.length === 0) {
    return res.status(409).json({ error: "Tu carrito está vacío." });
  }

  const db = getDb();
  const user = getSessionUser(req);
  const viewer = user
    ? { userId: user.id, role: "buyer", name: user.name }
    : { guestId: ensureGuest(req, res), role: "guest", name: payload.name.trim() };
  const deliveryCost = DELIVERY_COSTS[delivery];
  const subtotal = cart.subtotal;
  const total = subtotal + deliveryCost;
  const orderCount = db.prepare("SELECT COUNT(*) AS n FROM orders").get().n;
  const code = `ORD-${1083 + orderCount}`;

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
        String(payload.note ?? "").slice(0, 400),
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
      let thread = findThread(line.producer.id, viewer);
      if (!thread) {
        const threadId = createThread({
          producerId: line.producer.id,
          userId: user?.id ?? null,
          guestId: viewer.guestId,
          buyerName: payload.name.trim(),
          subject: `Pedido ${code}`,
        });
        thread = { id: threadId };
      }
      createMessage({
        threadId: thread.id,
        sender: "system",
        type: "system",
        body: `Pedido ${code} confirmado: ${line.qty} × ${line.product.name}. Coordina entrega y pago directo con el productor.`,
        productId: line.product.id,
      });
    }
    db.prepare("DELETE FROM cart_items WHERE cart_id = ?").run(cartId);
    db.exec("COMMIT");

    const producers = Array.from(new Map(cart.lines.map((l) => [l.producer.id, l.producer])).values());
    res.json({
      code,
      subtotal,
      deliveryCost,
      total,
      producers: producers.map((p) => ({ name: p.name, whatsapp: p.whatsapp.replace(/\D/g, "") })),
    });
  } catch (error) {
    db.exec("ROLLBACK");
    res.status(500).json({ error: "No pudimos crear el pedido. Intenta de nuevo." });
  }
});

router.get("/", (req, res) => {
  const user = getSessionUser(req);
  if (!user) return res.json({ orders: [] });
  const orders = getDb().prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC").all(user.id);
  res.json({ orders });
});

module.exports = router;
