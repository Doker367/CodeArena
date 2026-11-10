const crypto = require("node:crypto");
const express = require("express");
const { getDb } = require("../db");
const { LANGUAGES, TRANSLATION_RESEARCH } = require("../languages");
const { translateText } = require("../translation");
const { saveTranslation, getTranslation } = require("../queries");

const router = express.Router();
const recentRequests = new Map();

function hfConfigured() {
  return process.env.TRANSLATE_PROVIDER === "hf" && Boolean(process.env.HF_TOKEN);
}

function serializeLanguage(row) {
  return {
    code: row.code,
    name: row.name,
    nativeName: row.native_name,
    family: row.family,
    speakers: row.speakers,
    speakersLabel: row.speakers_label,
    status: row.status,
    region: row.region,
    municipalities: row.municipalities,
    color: row.color,
    description: row.description,
    resources: JSON.parse(row.resources || "[]"),
  };
}

function listLanguages() {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM languages ORDER BY speakers DESC").all();
  if (rows.length) return rows.map(serializeLanguage);
  return LANGUAGES;
}

router.get("/", (req, res) => {
  res.json({
    languages: listLanguages(),
    research: TRANSLATION_RESEARCH,
    automatic: {
      available: hfConfigured(),
      provider: hfConfigured() ? "hf-tsotsil-experimental" : "none",
      pairs: hfConfigured() ? ["tzo→es"] : [],
      message: hfConfigured()
        ? "Modelo experimental tsotsil→español habilitado. Requiere revisión humana."
        : "Sin proveedor automático configurado para las lenguas de Chiapas.",
    },
    human: {
      available: true,
      phone: process.env.INTERPRETER_PHONE || "8002442727",
      whatsapp: process.env.INTERPRETER_WHATSAPP || "529671234567",
      hours: "Lunes a sábado, 08:00–18:00 h (Centro de Chiapas)",
    },
  });
});

router.post("/translate", async (req, res) => {
  const { text, source = "es", target, messageId } = req.body ?? {};
  const validTarget = target === "es" || listLanguages().some((l) => l.code === target);
  if (!validTarget) {
    return res.status(400).json({ error: "Selecciona una lengua válida." });
  }

  const result = await translateText({
    text,
    source: source === "es" ? "es" : source,
    target,
  });

  if (result.available && messageId) {
    const message = getDb().prepare("SELECT id FROM messages WHERE id = ?").get(Number(messageId));
    if (message) saveTranslation(Number(messageId), target, result.text, result.provider);
  }

  res.json(result);
});

router.get("/translations/:messageId", (req, res) => {
  const lang = String(req.query.lang || "");
  const row = getTranslation(Number(req.params.messageId), lang);
  res.json(row ? { available: true, text: row.body, provider: row.provider } : { available: false });
});

router.post("/interpreter", (req, res) => {
  const { name, phone, language, message, channel = "whatsapp" } = req.body ?? {};
  const key = `${String(phone || "").replace(/\D/g, "")}:${req.ip}`;
  const now = Date.now();
  const previous = recentRequests.get(key);
  if (previous && now - previous < 60_000) {
    return res.status(429).json({ error: "Ya registramos una solicitud hace un momento. Espera un minuto." });
  }

  if (!name?.trim() || !phone?.trim() || !message?.trim()) {
    return res.status(400).json({ error: "Completa tu nombre, WhatsApp y el mensaje a traducir." });
  }
  if (phone.replace(/\D/g, "").length < 10) {
    return res.status(400).json({ error: "Ingresa un número de WhatsApp válido (10 dígitos)." });
  }
  const validLanguage = listLanguages().some((l) => l.code === language);
  if (!validLanguage) {
    return res.status(400).json({ error: "Selecciona una lengua originaria." });
  }
  if (message.length > 1000) {
    return res.status(400).json({ error: "El mensaje supera los 1,000 caracteres." });
  }

  const folio = `INT-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${crypto
    .randomBytes(2)
    .toString("hex")
    .toUpperCase()}`;
  getDb()
    .prepare(
      "INSERT INTO interpreter_requests (folio,name,phone,language,message,channel,status,created_at) VALUES (?,?,?,?,?,?,?,?)",
    )
    .run(
      folio,
      name.trim().slice(0, 120),
      phone.trim().slice(0, 40),
      language,
      message.trim().slice(0, 1000),
      ["whatsapp", "llamada", "email"].includes(channel) ? channel : "whatsapp",
      "pendiente",
      new Date().toISOString(),
    );
  recentRequests.set(key, now);

  res.json({
    folio,
    status: "pendiente",
    message:
      "Solicitud registrada. Una persona de la red de intérpretes comunitarios te contactará en horario de atención.",
    contact: {
      phone: process.env.INTERPRETER_PHONE || "8002442727",
      whatsapp: process.env.INTERPRETER_WHATSAPP || "529671234567",
    },
    preview: {
      name: name.trim(),
      language,
      text: message.trim().slice(0, 120),
    },
  });
});

router.get("/interpreter/:folio", (req, res) => {
  const request = getDb()
    .prepare("SELECT folio,language,status,created_at FROM interpreter_requests WHERE folio = ?")
    .get(req.params.folio);
  if (!request) return res.status(404).json({ error: "Folio no encontrado" });
  res.json({ request });
});

module.exports = router;
