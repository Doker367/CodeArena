const express = require("express");
const { getDb } = require("../db");
const { getSessionUser } = require("../session");
const { getMessages, getThread, getThreads, getThreadsByProducer } = require("../queries");

const router = express.Router();

router.get("/", (req, res) => {
  const threadId = Number(req.query.thread || 0);
  if (threadId) {
    const thread = getThread(threadId);
    if (!thread) return res.status(404).json({ error: "Conversación no encontrada" });
    getDb().prepare("UPDATE threads SET unread = 0 WHERE id = ?").run(threadId);
    return res.json({ thread, messages: getMessages(threadId) });
  }
  const user = getSessionUser(req);
  if (!user) return res.json({ threads: getThreads() });
  if (user.role === "productor" && user.producer_id) {
    return res.json({ threads: getThreadsByProducer(user.producer_id) });
  }
  res.json({ threads: getThreads(user.id) });
});

router.post("/", (req, res) => {
  const { threadId: rawThreadId, producerId, body, productId } = req.body ?? {};
  if (!body?.trim()) {
    return res.status(400).json({ error: "Escribe un mensaje." });
  }
  const db = getDb();
  const user = getSessionUser(req);
  const buyerName = user?.name ?? "Alejandra Ruiz Moreno";
  let threadId = rawThreadId ? Number(rawThreadId) : 0;

  if (!threadId && producerId) {
    const producerThread = db
      .prepare("SELECT id FROM threads WHERE producer_id = ? AND (buyer_id IS ? OR buyer_id = ?) ORDER BY id ASC LIMIT 1")
      .get(producerId, user?.id ?? null, user?.id ?? -1);
    if (producerThread) {
      threadId = producerThread.id;
    } else {
      const result = db
        .prepare("INSERT INTO threads (producer_id,buyer_id,buyer_name,subject,unread,updated_at) VALUES (?,?,?,?,?,?)")
        .run(producerId, user?.id ?? null, buyerName, "Consulta directa", 1, new Date().toISOString());
      threadId = Number(result.lastInsertRowid);
    }
  }

  if (!threadId) return res.status(400).json({ error: "Conversación inválida" });

  db.prepare("INSERT INTO messages (thread_id,sender,body,product_id,created_at) VALUES (?,?,?,?,?)").run(
    threadId,
    "buyer",
    body.trim().slice(0, 2000),
    productId ?? null,
    new Date().toISOString(),
  );
  db.prepare("UPDATE threads SET updated_at = ?, unread = 1 WHERE id = ?").run(new Date().toISOString(), threadId);
  res.json({ threadId, messages: getMessages(threadId) });
});

module.exports = router;
