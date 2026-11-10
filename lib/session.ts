import { cookies } from "next/headers";
import crypto from "node:crypto";
import { getDb } from "./db";
import type { User } from "./types";

export const SESSION_COOKIE = "oc_session";
export const CART_COOKIE = "oc_cart";

export async function getSessionUser(): Promise<User | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const db = getDb();
  const row = db
    .prepare(
      `SELECT u.id,u.name,u.email,u.phone,u.role,u.producer_id
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token = ? AND s.expires_at > ?`,
    )
    .get(token, new Date().toISOString()) as User | undefined;
  return row ?? null;
}

export async function createSession(userId: number) {
  const db = getDb();
  const token = crypto.randomBytes(24).toString("hex");
  const expires = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
  db.prepare("INSERT INTO sessions (token,user_id,expires_at) VALUES (?,?,?)").run(token, userId, expires);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 3600,
    secure: process.env.NODE_ENV === "production",
  });
  return token;
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    getDb().prepare("DELETE FROM sessions WHERE token = ?").run(token);
  }
  store.delete(SESSION_COOKIE);
}

/** Returns the current cart id, creating the cart row when missing (route handlers only). */
export async function ensureCart(): Promise<string> {
  const store = await cookies();
  let cartId = store.get(CART_COOKIE)?.value;
  const db = getDb();
  if (cartId) {
    const exists = db.prepare("SELECT id FROM carts WHERE id = ?").get(cartId);
    if (exists) return cartId;
  }
  cartId = crypto.randomBytes(16).toString("hex");
  db.prepare("INSERT INTO carts (id,user_id,created_at) VALUES (?,?,?)").run(
    cartId,
    (await getSessionUser())?.id ?? null,
    new Date().toISOString(),
  );
  // A new visit starts with a sample direct-trade basket so the full cart,
  // checkout and messaging flows can be experienced immediately.
  try {
    const coffee = db.prepare("SELECT id FROM products WHERE slug = ?").get("cafe-arabica-tostado-1kg") as
      | { id: number }
      | undefined;
    const huipil = db.prepare("SELECT id FROM products WHERE slug = ?").get("huipil-bordado-artesanal") as
      | { id: number }
      | undefined;
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
    /* products not seeded yet: leave the cart empty */
  }
  store.set(CART_COOKIE, cartId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 24 * 3600,
    secure: process.env.NODE_ENV === "production",
  });
  return cartId;
}

export async function readCartId(): Promise<string | null> {
  return (await cookies()).get(CART_COOKIE)?.value ?? null;
}
