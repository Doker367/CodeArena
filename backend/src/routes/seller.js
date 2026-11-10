const express = require("express");
const { getDb, slugify } = require("../db");
const { getSessionUser } = require("../session");
const {
  getOrdersForProducer,
  getProducerById,
  getProducerProducts,
  getQuestions,
  getRecentOrdersFallback,
  getSellerStats,
} = require("../queries");

const router = express.Router();

function resolveProducerId(req, res) {
  const producerId = getSessionUser(req)?.producer_id;
  if (!producerId) {
    res.status(401).json({ error: "Inicia sesión con una cuenta de productor para administrar tu negocio." });
    return null;
  }
  return producerId;
}

router.get("/", (req, res) => {
  const producerId = resolveProducerId(req, res);
  if (!producerId) return;
  const producer = getProducerById(producerId);
  if (!producer) return res.status(404).json({ error: "Negocio no encontrado" });
  const products = getProducerProducts(producer.id);
  const orders = getOrdersForProducer(producer.id);
  res.json({
    producer,
    stats: getSellerStats(producer.id),
    products,
    orders: orders.length ? orders : getRecentOrdersFallback(),
    questions: getQuestions(producer.id),
  });
});

router.post("/", (req, res) => {
  const producerId = resolveProducerId(req, res);
  if (!producerId) return;
  const body = req.body ?? {};
  if (!body.name?.trim() || !body.price || Number(body.price) <= 0) {
    return res.status(400).json({ error: "Nombre y precio válidos son requeridos." });
  }
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
      String(body.description ?? "Nuevo producto de temporada.").slice(0, 160),
      String(body.description ?? "Nuevo producto de temporada.").slice(0, 500),
      Math.round(Number(body.price)),
      String(body.unit ?? "pieza").slice(0, 24),
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
  res.json({ id: Number(result.lastInsertRowid) });
});

router.patch("/", (req, res) => {
  const producerId = resolveProducerId(req, res);
  if (!producerId) return;
  const { id, status, price, stock } = req.body ?? {};
  if (!id) return res.status(400).json({ error: "id es requerido" });
  const db = getDb();
  const product = db.prepare("SELECT id FROM products WHERE id = ? AND producer_id = ?").get(id, producerId);
  if (!product) return res.status(404).json({ error: "Producto no encontrado" });
  if (status && ["activo", "pausado"].includes(status)) {
    db.prepare("UPDATE products SET status = ? WHERE id = ?").run(status, id);
  }
  if (typeof price === "number" && price > 0) {
    db.prepare("UPDATE products SET price = ? WHERE id = ?").run(Math.round(price), id);
  }
  if (typeof stock === "number" && stock >= 0) {
    db.prepare("UPDATE products SET stock = ?, stock_label = ? WHERE id = ?").run(
      Math.round(stock),
      `${Math.round(stock)} disponibles`,
      id,
    );
  }
  res.json({ ok: true });
});

router.patch("/orders", (req, res) => {
  const { id, status } = req.body ?? {};
  if (!id || !status) return res.status(400).json({ error: "id y status son requeridos" });
  if (!["Por preparar", "Listo para entrega", "Entregado", "En camino"].includes(status)) {
    return res.status(400).json({ error: "Estado no válido" });
  }
  getDb().prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, id);
  res.json({ ok: true });
});

router.patch("/questions", (req, res) => {
  const { id, answer } = req.body ?? {};
  if (!id || !answer?.trim()) {
    return res.status(400).json({ error: "id y respuesta son requeridos" });
  }
  getDb().prepare("UPDATE questions SET answer = ? WHERE id = ?").run(answer.trim().slice(0, 800), id);
  res.json({ ok: true });
});

module.exports = router;
