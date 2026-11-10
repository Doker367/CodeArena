const express = require("express");
const { getDb } = require("../db");
const { ensureCart } = require("../session");
const { getCart } = require("../queries");

const router = express.Router();

router.get("/", (req, res) => {
  const cartId = ensureCart(req, res);
  res.json(getCart(cartId));
});

router.post("/", (req, res) => {
  const { productId, qty, note } = req.body ?? {};
  if (!productId) return res.status(400).json({ error: "productId es requerido" });
  const db = getDb();
  const product = db.prepare("SELECT id, stock, status FROM products WHERE id = ?").get(productId);
  if (!product || product.status !== "activo" || product.stock < 1) {
    return res.status(409).json({ error: "Producto no disponible" });
  }
  const cartId = ensureCart(req, res);
  const amount = Math.max(1, Math.min(Number(qty) || 1, 99));
  db.prepare(
    `INSERT INTO cart_items (cart_id, product_id, qty, note) VALUES (?,?,?,?)
     ON CONFLICT(cart_id, product_id) DO UPDATE SET qty = MIN(99, cart_items.qty + excluded.qty)`,
  ).run(cartId, product.id, amount, String(note ?? "").slice(0, 300));
  res.json(getCart(cartId));
});

router.patch("/", (req, res) => {
  const { lineId, qty, note } = req.body ?? {};
  if (!lineId) return res.status(400).json({ error: "lineId es requerido" });
  const db = getDb();
  const cartId = ensureCart(req, res);
  const line = db.prepare("SELECT * FROM cart_items WHERE id = ? AND cart_id = ?").get(lineId, cartId);
  if (!line) return res.status(404).json({ error: "Línea no encontrada" });

  if (typeof qty === "number") {
    const amount = Math.max(0, Math.min(99, Math.floor(qty)));
    if (amount === 0) {
      db.prepare("DELETE FROM cart_items WHERE id = ?").run(line.id);
    } else {
      db.prepare("UPDATE cart_items SET qty = ? WHERE id = ?").run(amount, line.id);
    }
  }
  if (typeof note === "string") {
    db.prepare("UPDATE cart_items SET note = ? WHERE id = ?").run(note.slice(0, 300), line.id);
  }
  res.json(getCart(cartId));
});

router.delete("/", (req, res) => {
  const { lineId, all } = req.body ?? {};
  const db = getDb();
  const cartId = ensureCart(req, res);
  if (all) {
    db.prepare("DELETE FROM cart_items WHERE cart_id = ?").run(cartId);
  } else if (lineId) {
    db.prepare("DELETE FROM cart_items WHERE id = ? AND cart_id = ?").run(lineId, cartId);
  }
  res.json(getCart(cartId));
});

module.exports = router;
