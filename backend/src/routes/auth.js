const crypto = require("node:crypto");
const express = require("express");
const { getDb, newToken, slugify, verifyPassword } = require("../db");
const { createSession, destroySession, getSessionUser } = require("../session");

const router = express.Router();

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function normalizePhone(value) {
  const raw = String(value ?? "").trim();
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return `${raw.startsWith("+") ? "+" : ""}${digits}`;
}

// Deja solo dígitos y compara los últimos 10: tolera espacios, guiones,
// paréntesis y lada de país (+52) al iniciar sesión.
function phoneDigitsSql(column) {
  return `replace(replace(replace(replace(replace(${column},' ',''),'-',''),'(',''),')',''),'+','')`;
}
function phoneMatchSql(column) {
  return `substr(${phoneDigitsSql(column)}, -10) = substr(?, -10)`;
}
function phoneDigits(value) {
  return normalizePhone(value).replace(/\D/g, "");
}

router.post("/login", (req, res) => {
  const { identifier, email, password } = req.body ?? {};
  const login = String(identifier ?? email ?? "").trim();
  if (!login || !password) {
    return res.status(400).json({ error: "Ingresa tu correo o WhatsApp y contraseña." });
  }
  const phone = phoneDigits(login);
  const user = getDb()
    .prepare(
      `SELECT id,name,email,phone,role,producer_id,password_hash FROM users
       WHERE lower(email) = lower(?)
          OR (? <> '' AND ${phoneMatchSql("phone")})`,
    )
    .get(login, phone, phone);
  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: "Correo o contraseña incorrectos." });
  }
  createSession(res, user.id);
  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      producer_id: user.producer_id,
    },
  });
});

router.post("/register", (req, res) => {
  const body = req.body ?? {};
  const role = ["comprador", "productor", "eco"].includes(body.role) ? body.role : "comprador";
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  const phone = normalizePhone(body.phone);
  if (!name || !email || !body.password) {
    return res.status(400).json({ error: "Completa tu nombre, correo y contraseña." });
  }
  if (body.password.length < 6) {
    return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres." });
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: "Ingresa un correo electrónico válido." });
  }

  const db = getDb();
  const existing = db
    .prepare(
      `SELECT id FROM users
       WHERE lower(email) = lower(?)
          OR (? <> '' AND ${phoneMatchSql("phone")})`,
    )
    .get(email, phoneDigits(phone), phoneDigits(phone));
  if (existing) {
    return res.status(409).json({ error: "Ya existe una cuenta con este correo o WhatsApp. Inicia sesión." });
  }

  let producerId = null;
  if (role === "productor") {
    const base = slugify(name) || "emprendimiento";
    const slug = `${base}-${newToken().slice(0, 5)}`;
    const result = db
      .prepare(
        `INSERT INTO producers (slug,name,kind,municipality,region,rating,review_count,verified,tagline,about,avatar,cover,phone,whatsapp,hours,delivery,badge,category)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      )
      .run(
        slug,
        name.slice(0, 120),
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
        phone || email,
        phone || email,
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
      name.slice(0, 120),
      email,
      phone.slice(0, 40),
      hashPassword(body.password),
      role,
      producerId,
      new Date().toISOString(),
    );
  const userId = Number(insert.lastInsertRowid);
  createSession(res, userId);
  res.json({
    user: {
      id: userId,
      name,
      email,
      phone,
      role,
      producer_id: producerId,
    },
  });
});

router.post("/logout", (req, res) => {
  destroySession(req, res);
  res.json({ ok: true });
});

router.get("/me", (req, res) => {
  res.json({ user: getSessionUser(req) });
});

module.exports = router;
