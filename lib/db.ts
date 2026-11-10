import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {
  panelOrders,
  panelQuestions,
  processSteps,
  producers,
  products,
  reviews,
} from "./seed-data";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "origen.db");

declare global {
  // eslint-disable-next-line no-var
  var __origenDb: DatabaseSync | undefined;
}

function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 64).toString("hex");
  const a = Buffer.from(candidate, "hex");
  const b = Buffer.from(hash, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function newToken() {
  return crypto.randomBytes(24).toString("hex");
}

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function createSchema(db: DatabaseSync) {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS producers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      kind TEXT NOT NULL,
      municipality TEXT NOT NULL,
      region TEXT NOT NULL,
      rating REAL NOT NULL DEFAULT 5,
      review_count INTEGER NOT NULL DEFAULT 0,
      verified INTEGER NOT NULL DEFAULT 1,
      tagline TEXT NOT NULL DEFAULT '',
      about TEXT NOT NULL DEFAULT '',
      avatar TEXT NOT NULL DEFAULT '',
      cover TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      whatsapp TEXT NOT NULL DEFAULT '',
      hours TEXT NOT NULL DEFAULT '',
      delivery TEXT NOT NULL DEFAULT '',
      badge TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      producer_id INTEGER NOT NULL REFERENCES producers(id),
      name TEXT NOT NULL,
      short TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      price INTEGER NOT NULL,
      unit TEXT NOT NULL DEFAULT 'pieza',
      image TEXT NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      stock_label TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT '',
      tags TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'activo',
      featured INTEGER NOT NULL DEFAULT 0,
      badge TEXT NOT NULL DEFAULT '',
      rating REAL NOT NULL DEFAULT 5,
      review_count INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      producer_id INTEGER NOT NULL REFERENCES producers(id),
      author TEXT NOT NULL,
      location TEXT NOT NULL,
      avatar TEXT NOT NULL,
      rating INTEGER NOT NULL,
      body TEXT NOT NULL,
      verified TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS process_steps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      producer_id INTEGER NOT NULL REFERENCES producers(id),
      step TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      image TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'comprador',
      producer_id INTEGER REFERENCES producers(id),
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      expires_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS carts (
      id TEXT PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cart_id TEXT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id),
      qty INTEGER NOT NULL DEFAULT 1,
      note TEXT NOT NULL DEFAULT '',
      UNIQUE(cart_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      user_id INTEGER REFERENCES users(id),
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      address TEXT NOT NULL,
      delivery_method TEXT NOT NULL,
      delivery_cost INTEGER NOT NULL DEFAULT 0,
      payment_method TEXT NOT NULL,
      subtotal INTEGER NOT NULL,
      total INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'Por preparar',
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      price INTEGER NOT NULL,
      qty INTEGER NOT NULL,
      image TEXT NOT NULL DEFAULT '',
      producer_name TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS threads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      producer_id INTEGER NOT NULL REFERENCES producers(id),
      buyer_id INTEGER REFERENCES users(id),
      buyer_name TEXT NOT NULL,
      subject TEXT NOT NULL DEFAULT '',
      unread INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      thread_id INTEGER NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
      sender TEXT NOT NULL,
      body TEXT NOT NULL,
      product_id INTEGER REFERENCES products(id),
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      producer_id INTEGER NOT NULL REFERENCES producers(id),
      author TEXT NOT NULL,
      location TEXT NOT NULL DEFAULT '',
      body TEXT NOT NULL,
      answer TEXT,
      created_at TEXT NOT NULL
    );
  `);
}

function seed(db: DatabaseSync) {
  const count = db.prepare("SELECT COUNT(*) AS n FROM producers").get() as { n: number };
  if (count.n > 0) return;

  const insertProducer = db.prepare(`
    INSERT INTO producers (slug,name,kind,municipality,region,rating,review_count,verified,tagline,about,avatar,cover,phone,whatsapp,hours,delivery,badge,category)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `);

  db.exec("BEGIN");
  try {
    for (const p of producers) {
      insertProducer.run(
        p.slug,
        p.name,
        p.kind,
        p.municipality,
        p.region,
        p.rating,
        p.review_count,
        p.verified,
        p.tagline,
        p.about,
        p.avatar,
        p.cover,
        p.phone,
        p.whatsapp,
        p.hours,
        p.delivery,
        p.badge,
        p.category,
      );
    }

    const producerId = new Map<string, number>();
    for (const row of db.prepare("SELECT id, slug FROM producers").all() as { id: number; slug: string }[]) {
      producerId.set(row.slug, row.id);
    }

    const insertProduct = db.prepare(`
      INSERT INTO products (slug,producer_id,name,short,description,price,unit,image,stock,stock_label,category,tags,status,featured,badge,rating,review_count)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `);
    for (const p of products) {
      insertProduct.run(
        p.slug,
        producerId.get(p.producer)!,
        p.name,
        p.short,
        p.description,
        p.price,
        p.unit,
        p.image,
        p.stock,
        p.stock_label,
        p.category,
        p.tags,
        p.status,
        p.featured,
        p.badge,
        p.rating,
        p.review_count,
      );
    }

    const insertReview = db.prepare(`
      INSERT INTO reviews (producer_id,author,location,avatar,rating,body,verified,created_at)
      VALUES (?,?,?,?,?,?,?,?)
    `);
    for (const r of reviews) {
      insertReview.run(
        producerId.get(r.producer)!,
        r.author,
        r.location,
        r.avatar,
        r.rating,
        r.body,
        r.verified,
        r.date,
      );
    }

    const insertStep = db.prepare(`
      INSERT INTO process_steps (producer_id,step,title,body,image) VALUES (?,?,?,?,?)
    `);
    for (const s of processSteps) {
      insertStep.run(producerId.get("cafetales-don-margarito")!, s.step, s.title, s.body, s.image);
    }

    const margarito = producerId.get("cafetales-don-margarito")!;
    const insertUser = db.prepare(`
      INSERT INTO users (name,email,phone,password_hash,role,producer_id,created_at) VALUES (?,?,?,?,?,?,?)
    `);
    insertUser.run(
      "Don Margarito",
      "margarito@origenchiapas.mx",
      "+529671234567",
      hashPassword("demo1234"),
      "productor",
      margarito,
      new Date().toISOString(),
    );
    insertUser.run(
      "Alejandra Ruiz Moreno",
      "alejandra@ejemplo.com",
      "+529671234567",
      hashPassword("demo1234"),
      "comprador",
      null,
      new Date().toISOString(),
    );
    insertUser.run(
      "Admin Origen Chiapas",
      "admin@origenchiapas.mx",
      "8002442727",
      hashPassword("demo1234"),
      "eco",
      null,
      new Date().toISOString(),
    );
    const alejandra = db.prepare("SELECT id FROM users WHERE email = ?").get("alejandra@ejemplo.com") as {
      id: number;
    };

    // Recent orders shown in the seller panel
    const insertOrder = db.prepare(`
      INSERT INTO orders (code,user_id,name,phone,email,address,delivery_method,delivery_cost,payment_method,subtotal,total,status,note,created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `);
    const now = Date.now();
    const productId = new Map<string, number>();
    for (const row of db.prepare("SELECT id, slug FROM products").all() as { id: number; slug: string }[]) {
      productId.set(row.slug, row.id);
    }
    const insertOrderItem = db.prepare(
      "INSERT INTO order_items (order_id,product_id,name,price,qty,image,producer_name) VALUES (?,?,?,?,?,?,?)",
    );
    const seededItems = [
      [
        ["cafe-altura-margarito-1kg", 2],
        ["miel-virgen-acahual-750ml", 1],
      ],
      [["miel-virgen-acahual-750ml", 1]],
      [["cafe-especialidad-lavado-500g", 3]],
    ];
    panelOrders.forEach((order, i) => {
      const result = insertOrder.run(
        order.code,
        null,
        order.customer,
        "+529671234567",
        "cliente@ejemplo.com",
        "San Cristóbal de Las Casas, Chiapas",
        i === 1 ? "Entrega local" : "Recoger en taller",
        i === 1 ? 45 : 0,
        "Transferencia SPEI",
        i === 0 ? 980 : i === 1 ? 180 : 870,
        i === 0 ? 980 : i === 1 ? 225 : 870,
        order.status,
        order.items,
        new Date(now - (i + 1) * 22 * 3600 * 1000).toISOString(),
      );
      const orderId = Number(result.lastInsertRowid);
      for (const [slug, qty] of seededItems[i] as [string, number][]) {
        const product = db.prepare("SELECT id, name, price, image FROM products WHERE slug = ?").get(slug) as
          | { id: number; name: string; price: number; image: string }
          | undefined;
        if (product) {
          insertOrderItem.run(
            orderId,
            product.id,
            product.name,
            product.price,
            Number(qty),
            product.image,
            "Cafetales Don Margarito",
          );
        }
      }
    });

    const insertQuestion = db.prepare(`
      INSERT INTO questions (producer_id,author,location,body,created_at) VALUES (?,?,?,?,?)
    `);
    panelQuestions.forEach((q, i) => {
      insertQuestion.run(margarito, q.author, q.location, q.body, new Date(now - (i + 1) * 8 * 3600 * 1000).toISOString());
    });

    // Message threads + seeded conversation
    const insertThread = db.prepare(`
      INSERT INTO threads (producer_id,buyer_id,buyer_name,subject,unread,updated_at) VALUES (?,?,?,?,?,?)
    `);
    const threadSeed = [
      {
        producer: "cafetales-don-margarito",
        subject: "Café de altura y envío a CDMX",
        unread: 1,
        updated: "2026-11-10T10:42:00",
      },
      {
        producer: "tejedoras-xpakinte",
        subject: "Huipil ceremonial a medida",
        unread: 0,
        updated: "2026-11-09T18:20:00",
      },
      {
        producer: "ambar-real-simojovel",
        subject: "Certificado de autenticidad",
        unread: 0,
        updated: "2026-11-08T12:05:00",
      },
      {
        producer: "queseria-la-chiapaneca",
        subject: "Entrega de queso bola",
        unread: 0,
        updated: "2026-11-07T09:40:00",
      },
    ];
    for (const t of threadSeed) {
      insertThread.run(
        producerId.get(t.producer)!,
        alejandra.id,
        "Alejandra Ruiz Moreno",
        t.subject,
        t.unread,
        t.updated,
      );
    }

    const coffee = db.prepare("SELECT id FROM products WHERE slug = ?").get("cafe-arabica-tostado-1kg") as {
      id: number;
    };
    const insertMessage = db.prepare(`
      INSERT INTO messages (thread_id,sender,body,product_id,created_at) VALUES (?,?,?,?,?)
    `);
    const t1 = db.prepare("SELECT id FROM threads WHERE producer_id = ?").get(margarito) as { id: number };
    insertMessage.run(
      t1.id,
      "buyer",
      "¡Hola Don Margarito! Buen día. Vi su publicación del café arábica de Los Altos. ¿Tendría disponible molienda especial para prensa francesa (molinda media-gruesa)?",
      coffee.id,
      "2026-11-10T10:28:00",
    );
    insertMessage.run(
      t1.id,
      "producer",
      "¡Dios le bendiga marchante! Claro que sí, con mucho gusto. Hoy por la mañana terminamos de tostar lote fresco de la variedad Typica y Bourbon. Aún tengo calibrado el molino de discos precisamente en grosor rústico para prensa francesa para no perder los aceites esenciales. ¿Cuántos kilos necesita para su negocio?",
      null,
      "2026-11-10T10:29:00",
    );

    const t2 = db.prepare("SELECT id FROM threads WHERE producer_id = ?").get(
      producerId.get("tejedoras-xpakinte")!,
    ) as { id: number };
    insertMessage.run(t2.id, "buyer", "Buenas tardes, ¿el huipil se puede mandar a México? ¿Cuánto cuesta el envío?", null, "2026-11-09T18:10:00");
    insertMessage.run(t2.id, "producer", "¡Claro que sí! Envío por paquetería comunitaria, llega en 3 días. El envío tiene costo de $120 MXN.", null, "2026-11-09T18:20:00");

    const t3 = db.prepare("SELECT id FROM threads WHERE producer_id = ?").get(
      producerId.get("ambar-real-simojovel")!,
    ) as { id: number };
    insertMessage.run(t3.id, "buyer", "¿La pieza incluye certificado de autenticidad?", null, "2026-11-08T12:00:00");
    insertMessage.run(t3.id, "producer", "Sí, cada pieza va con su certificado y ficha de origen.", null, "2026-11-08T12:05:00");

    const t4 = db.prepare("SELECT id FROM threads WHERE producer_id = ?").get(
      producerId.get("queseria-la-chiapaneca")!,
    ) as { id: number };
    insertMessage.run(t4.id, "buyer", "¿Cuándo tendrán queso bola fresco?", null, "2026-11-07T09:30:00");
    insertMessage.run(t4.id, "producer", "El miércoles tenemos queso recién hecho. Podemos entregar en Tuxtla.", null, "2026-11-07T09:40:00");

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function getDb() {
  if (globalThis.__origenDb) return globalThis.__origenDb;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const db = new DatabaseSync(DB_PATH);
  createSchema(db);
  seed(db);
  globalThis.__origenDb = db;
  return db;
}
