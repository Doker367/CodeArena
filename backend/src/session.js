const crypto = require("node:crypto");
const { getDb } = require("./db");

const SESSION_COOKIE = "oc_session";
const CART_COOKIE = "oc_cart";

function parseCookies(req) {
  const header = req.headers.cookie || "";
  const result = {};
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (key) result[key] = decodeURIComponent(value);
  }
  return result;
}

function getSessionUser(req) {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (!token) return null;
  const row = getDb()
    .prepare(
      `SELECT u.id,u.name,u.email,u.phone,u.role,u.producer_id
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token = ? AND s.expires_at > ?`,
    )
    .get(token, new Date().toISOString());
  return row ?? null;
}

function createSession(res, userId) {
  const db = getDb();
  const token = crypto.randomBytes(24).toString("hex");
  const expires = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
  db.prepare("INSERT INTO sessions (token,user_id,expires_at) VALUES (?,?,?)").run(token, userId, expires);
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 3600 * 1000,
    secure: process.env.NODE_ENV === "production" && process.env.COOKIE_SECURE === "true",
  });
  return token;
}

function destroySession(req, res) {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (token) getDb().prepare("DELETE FROM sessions WHERE token = ?").run(token);
  res.clearCookie(SESSION_COOKIE, { path: "/" });
}

function ensureCart(req, res) {
  const cookies = parseCookies(req);
  let cartId = cookies[CART_COOKIE];
  const db = getDb();
  if (cartId) {
    const exists = db.prepare("SELECT id FROM carts WHERE id = ?").get(cartId);
    if (exists) return cartId;
  }
  cartId = crypto.randomBytes(16).toString("hex");
  db.prepare("INSERT INTO carts (id,user_id,created_at) VALUES (?,?,?)").run(
    cartId,
    getSessionUser(req)?.id ?? null,
    new Date().toISOString(),
  );
  try {
    const coffee = db.prepare("SELECT id FROM products WHERE slug = ?").get("cafe-arabica-tostado-1kg");
    const huipil = db.prepare("SELECT id FROM products WHERE slug = ?").get("huipil-bordado-artesanal");
    if (coffee) {
      db.prepare("INSERT INTO cart_items (cart_id, product_id, qty, note) VALUES (?,?,?,?)").run(
        cartId,
        coffee.id,
        2,
        "Por favor molido fino para cafetera moka italiana",
      );
    }
    if (huipil) {
      db.prepare("INSERT INTO cart_items (cart_id, product_id, qty, note) VALUES (?,?,?,?)").run(
        cartId,
        huipil.id,
        1,
        "Por favor envolver para regalo con dedicatoria tradicional",
      );
    }
  } catch {
    /* seed pending */
  }
  res.cookie(CART_COOKIE, cartId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 24 * 3600 * 1000,
  });
  return cartId;
}

function readCartId(req) {
  return parseCookies(req)[CART_COOKIE] ?? null;
}

module.exports = {
  SESSION_COOKIE,
  CART_COOKIE,
  parseCookies,
  getSessionUser,
  createSession,
  destroySession,
  ensureCart,
  readCartId,
};
