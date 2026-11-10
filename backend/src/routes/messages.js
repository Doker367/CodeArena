const express = require("express");
const {
  createMessage,
  createThread,
  findThread,
  getMessages,
  getThreadForViewer,
  getThreadsForViewer,
  getUnreadCount,
  markThreadRead,
} = require("../queries");
const { getViewer } = require("../session");

const router = express.Router();

const RATE_LIMIT = 12;
const RATE_WINDOW_MS = 60 * 1000;
const buckets = new Map();

function rateLimited(key) {
  const now = Date.now();
  const entry = buckets.get(key);
  if (!entry || now - entry.start > RATE_WINDOW_MS) {
    buckets.set(key, { start: now, count: 1 });
    return false;
  }
  entry.count += 1;
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (now - v.start > RATE_WINDOW_MS) buckets.delete(k);
  }
  return entry.count > RATE_LIMIT;
}

function publicViewer(viewer) {
  return { role: viewer.role, name: viewer.name, isProducer: viewer.role === "producer" };
}

router.get("/unread", (req, res) => {
  const viewer = getViewer(req, res);
  res.json({ unread: getUnreadCount(viewer) });
});

router.get("/", (req, res) => {
  const viewer = getViewer(req, res);
  const threadId = Number(req.query.thread || 0);

  if (!threadId) {
    return res.json({
      threads: getThreadsForViewer(viewer),
      unread: getUnreadCount(viewer),
      me: publicViewer(viewer),
    });
  }

  const thread = getThreadForViewer(threadId, viewer);
  if (!thread) return res.status(404).json({ error: "Conversación no encontrada" });

  // Un visitante puede leer el hilo demo, pero no alterar sus contadores.
  const isReadOnlyDemo = viewer.role === "guest" && thread.is_demo === 1;
  const peek = req.query.peek === "1";
  if (!isReadOnlyDemo && !peek) markThreadRead(threadId, viewer);

  const result = getMessages(threadId, {
    before: req.query.before,
    limit: req.query.limit,
  });

  res.json({
    thread,
    messages: result.messages,
    hasMore: result.hasMore,
    unread: getUnreadCount(viewer),
    me: publicViewer(viewer),
    readOnlyDemo: isReadOnlyDemo,
  });
});

router.post("/", (req, res) => {
  const viewer = getViewer(req, res);
  const key = viewer.userId ? `u:${viewer.userId}` : `g:${viewer.guestId ?? req.ip}`;
  if (rateLimited(key)) {
    return res.status(429).json({ error: "Demasiados mensajes seguidos. Espera un minuto." });
  }

  const body = String(req.body?.body ?? "").trim();
  if (!body) return res.status(400).json({ error: "Escribe un mensaje." });
  if (body.length > 1500) return res.status(400).json({ error: "El mensaje supera los 1,500 caracteres." });

  const requestedThreadId = Number(req.body?.threadId || 0);
  const productId = req.body?.productId ? Number(req.body.productId) : null;
  let thread = requestedThreadId ? getThreadForViewer(requestedThreadId, viewer) : null;
  let demoProducerId = 0;

  if (requestedThreadId && !thread) {
    return res.status(403).json({ error: "No tienes acceso a esta conversación." });
  }

  // Un visitante que escribe en el hilo demo estrena su propia conversación
  // con el productor, para no mezclar su mensaje con datos de demostración.
  if (thread && viewer.role === "guest" && thread.is_demo === 1) {
    demoProducerId = thread.producer_id;
    thread = null;
  }

  if (!thread) {
    if (viewer.role === "producer") {
      return res.status(400).json({ error: "Los productores responden dentro de las conversaciones existentes." });
    }
    const producerId = Number(req.body?.producerId || demoProducerId || 0);
    if (!producerId) {
      return res.status(400).json({ error: "Selecciona un productor para iniciar la conversación." });
    }
    const existing = findThread(producerId, viewer);
    if (existing) {
      thread = getThreadForViewer(existing.id, viewer);
    }
    if (!thread) {
      const threadId = createThread({
        producerId,
        userId: viewer.userId,
        guestId: viewer.guestId,
        buyerName: viewer.name,
        subject: body.slice(0, 80),
      });
      thread = getThreadForViewer(threadId, viewer);
      if (!thread) return res.status(500).json({ error: "No pudimos abrir la conversación." });
    }
  }

  const sender = viewer.role === "producer" ? "producer" : "buyer";
  createMessage({
    threadId: thread.id,
    sender,
    body,
    productId,
    type: "text",
    lang: req.body?.lang === "es" ? "es" : "es",
  });
  markThreadRead(thread.id, viewer);

  const result = getMessages(thread.id, { limit: 50 });
  res.json({
    threadId: thread.id,
    thread,
    messages: result.messages,
    hasMore: result.hasMore,
    unread: getUnreadCount(viewer),
    me: publicViewer(viewer),
    sender,
  });
});

/** Marca explícitamente como leída una conversación (p. ej. al enfocar la pestaña). */
router.patch("/read", (req, res) => {
  const viewer = getViewer(req, res);
  const threadId = Number(req.body?.threadId || 0);
  const thread = threadId ? getThreadForViewer(threadId, viewer) : null;
  if (!thread) return res.status(404).json({ error: "Conversación no encontrada" });
  if (!(viewer.role === "guest" && thread.is_demo === 1)) {
    markThreadRead(threadId, viewer);
  }
  res.json({ ok: true, unread: getUnreadCount(viewer) });
});

module.exports = router;
