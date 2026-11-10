import { getDb } from "./db";
import type { CartLine, Message, Producer, Product, Thread } from "./types";

/** node:sqlite rows have a null prototype; RSC requires plain objects. */
const plainList = <T>(rows: T[]): T[] => rows.map((row) => ({ ...row }));
const plainOne = <T>(row: T | undefined): T | null => (row ? { ...row } : null);

export function getProducers(category?: string, q?: string): Producer[] {
  const db = getDb();
  let sql = "SELECT * FROM producers";
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (category && category !== "todos") {
    where.push("category = ?");
    params.push(category);
  }
  if (q) {
    where.push("(name LIKE ? OR municipality LIKE ? OR about LIKE ?)");
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (where.length) sql += " WHERE " + where.join(" AND ");
  sql += " ORDER BY review_count DESC";
  return plainList(db.prepare(sql).all(...params) as unknown as Producer[]);
}

export function getProducerBySlug(slug: string): Producer | null {
  const row = getDb().prepare("SELECT * FROM producers WHERE slug = ?").get(slug) as unknown as Producer | undefined;
  return plainOne(row);
}

export function getProducerById(id: number): Producer | null {
  const row = getDb().prepare("SELECT * FROM producers WHERE id = ?").get(id) as unknown as Producer | undefined;
  return plainOne(row);
}

export type ProductQuery = {
  category?: string;
  q?: string;
  producer?: string;
  sort?: string;
  min?: number;
  max?: number;
  page?: number;
  limit?: number;
  onlyActive?: boolean;
};

export function getProducts(opts: ProductQuery = {}): { items: Product[]; total: number } {
  const db = getDb();
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (opts.onlyActive !== false) where.push("p.status = 'activo'");
  if (opts.category && opts.category !== "todos") {
    where.push("p.category = ?");
    params.push(opts.category);
  }
  if (opts.producer) {
    where.push("pr.slug = ?");
    params.push(opts.producer);
  }
  if (opts.q) {
    where.push("(p.name LIKE ? OR p.tags LIKE ? OR pr.name LIKE ? OR pr.municipality LIKE ?)");
    const like = `%${opts.q}%`;
    params.push(like, like, like, like);
  }
  if (typeof opts.min === "number") {
    where.push("p.price >= ?");
    params.push(opts.min);
  }
  if (typeof opts.max === "number") {
    where.push("p.price <= ?");
    params.push(opts.max);
  }
  const whereSql = where.length ? " WHERE " + where.join(" AND ") : "";
  let order = " ORDER BY p.featured DESC, p.review_count DESC";
  if (opts.sort === "precio-asc") order = " ORDER BY p.price ASC";
  if (opts.sort === "precio-desc") order = " ORDER BY p.price DESC";
  if (opts.sort === "nuevos") order = " ORDER BY p.id DESC";
  if (opts.sort === "rating") order = " ORDER BY p.rating DESC";

  const limit = Math.min(opts.limit ?? 12, 48);
  const page = Math.max(opts.page ?? 1, 1);
  const totalRow = db
    .prepare(`SELECT COUNT(*) AS n FROM products p JOIN producers pr ON pr.id = p.producer_id${whereSql}`)
    .get(...params) as { n: number };
  const items = plainList(
    db
      .prepare(
        `SELECT p.* FROM products p JOIN producers pr ON pr.id = p.producer_id${whereSql}${order} LIMIT ? OFFSET ?`,
      )
      .all(...params, limit, (page - 1) * limit) as unknown as Product[],
  );
  return { items, total: totalRow.n };
}

export function getProductBySlug(slug: string): Product | null {
  const row = getDb().prepare("SELECT * FROM products WHERE slug = ?").get(slug) as unknown as Product | undefined;
  return plainOne(row);
}

export function getProductById(id: number): Product | null {
  const row = getDb().prepare("SELECT * FROM products WHERE id = ?").get(id) as unknown as Product | undefined;
  return plainOne(row);
}

export function getProducerProducts(producerId: number): Product[] {
  return plainList(
    getDb()
      .prepare("SELECT * FROM products WHERE producer_id = ? ORDER BY featured DESC, id ASC")
      .all(producerId) as unknown as Product[],
  );
}

export function getFeaturedProduct(): { product: Product; producer: Producer } | null {
  const db = getDb();
  const product = db.prepare("SELECT * FROM products WHERE featured = 1 LIMIT 1").get() as unknown as Product;
  if (!product) return null;
  const producer = plainOne(
    db.prepare("SELECT * FROM producers WHERE id = ?").get(product.producer_id) as unknown as Producer,
  );
  if (!producer) return null;
  return { product: { ...product }, producer };
}

export function getReviews(producerId: number) {
  return plainList(getDb()
    .prepare("SELECT * FROM reviews WHERE producer_id = ? ORDER BY id ASC")
    .all(producerId) as unknown as {
    id: number;
    producer_id: number;
    author: string;
    location: string;
    avatar: string;
    rating: number;
    body: string;
    verified: string;
    created_at: string;
  }[]);
}

export function getProcessSteps(producerId: number) {
  return plainList(getDb()
    .prepare("SELECT * FROM process_steps WHERE producer_id = ? ORDER BY id ASC")
    .all(producerId) as unknown as {
    id: number;
    step: string;
    title: string;
    body: string;
    image: string;
  }[]);
}

export function getCart(cartId: string | null): { lines: CartLine[]; subtotal: number; count: number } {
  if (!cartId) return { lines: [], subtotal: 0, count: 0 };
  const raw = getDb()
    .prepare(
      `SELECT ci.id AS line_id, ci.qty AS qty, ci.note AS note,
              p.id AS product_id, p.slug AS slug, p.producer_id AS producer_id, p.name AS name,
              p.short AS short, p.description AS description, p.price AS price, p.unit AS unit,
              p.image AS image, p.stock AS stock, p.stock_label AS stock_label, p.category AS category,
              p.tags AS tags, p.status AS status, p.featured AS featured, p.badge AS badge,
              p.rating AS rating, p.review_count AS review_count,
              pr.id AS prod_id, pr.name AS producer_name, pr.slug AS producer_slug,
              pr.municipality AS producer_municipality, pr.avatar AS producer_avatar,
              pr.phone AS producer_phone, pr.whatsapp AS producer_whatsapp
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       JOIN producers pr ON pr.id = p.producer_id
       WHERE ci.cart_id = ? ORDER BY ci.id ASC`,
    )
    .all(cartId) as unknown as Record<string, unknown>[];

  const lines: CartLine[] = raw.map((r) => ({
    id: Number(r.line_id),
    qty: Number(r.qty),
    note: String(r.note ?? ""),
    product: {
      id: Number(r.product_id),
      slug: String(r.slug),
      producer_id: Number(r.producer_id),
      name: String(r.name),
      short: String(r.short ?? ""),
      description: String(r.description ?? ""),
      price: Number(r.price),
      unit: String(r.unit),
      image: String(r.image),
      stock: Number(r.stock),
      stock_label: String(r.stock_label ?? ""),
      category: String(r.category ?? ""),
      tags: String(r.tags ?? ""),
      status: String(r.status ?? "activo"),
      featured: Number(r.featured ?? 0),
      badge: String(r.badge ?? ""),
      rating: Number(r.rating ?? 5),
      review_count: Number(r.review_count ?? 0),
    },
    producer: {
      id: Number(r.prod_id),
      name: String(r.producer_name),
      slug: String(r.producer_slug),
      municipality: String(r.producer_municipality),
      avatar: String(r.producer_avatar),
      phone: String(r.producer_phone),
      whatsapp: String(r.producer_whatsapp),
    },
  }));

  const subtotal = lines.reduce((sum, l) => sum + l.product.price * l.qty, 0);
  const count = lines.reduce((sum, l) => sum + l.qty, 0);
  return { lines, subtotal, count };
}

export function getThreads(userId?: number): Thread[] {
  return plainList(getDb()
    .prepare(
      `SELECT t.id, t.producer_id, t.buyer_name, t.subject, t.updated_at, t.unread,
              pr.name AS producer_name, pr.avatar AS producer_avatar,
              pr.municipality AS producer_municipality, pr.kind AS producer_kind,
              COALESCE((SELECT body FROM messages m WHERE m.thread_id = t.id ORDER BY m.id DESC LIMIT 1),'') AS last_body
       FROM threads t JOIN producers pr ON pr.id = t.producer_id
       ${userId ? "WHERE t.buyer_id = ?" : ""}
       ORDER BY datetime(t.updated_at) DESC`,
    )
    .all(...(userId ? [userId] : [])) as unknown as Thread[]);
}

export function getThread(id: number) {
  const thread = getDb()
    .prepare(
      `SELECT t.*, pr.name AS producer_name, pr.avatar AS producer_avatar, pr.municipality AS producer_municipality,
              pr.kind AS producer_kind, pr.hours AS producer_hours, pr.verified AS producer_verified
       FROM threads t JOIN producers pr ON pr.id = t.producer_id WHERE t.id = ?`,
    )
    .get(id) as unknown as
    | (Thread & {
        producer_hours: string;
        producer_verified: number;
      })
    | undefined;
  return thread ? { ...thread } : null;
}

export function getMessages(threadId: number): Message[] {
  return plainList(getDb()
    .prepare(
      `SELECT m.id, m.thread_id, m.sender, m.body, m.created_at, m.product_id,
              p.name AS product_name, p.price AS product_price, p.image AS product_image
       FROM messages m LEFT JOIN products p ON p.id = m.product_id
       WHERE m.thread_id = ? ORDER BY m.id ASC`,
    )
    .all(threadId) as unknown as Message[]);
}

export function getSellerStats(producerId: number) {
  const db = getDb();
  const products = db
    .prepare("SELECT COUNT(*) AS n FROM products WHERE producer_id = ?")
    .get(producerId) as { n: number };
  const active = db
    .prepare("SELECT COUNT(*) AS n FROM products WHERE producer_id = ? AND status = 'activo'")
    .get(producerId) as { n: number };
  const stock = db
    .prepare("SELECT COALESCE(SUM(stock),0) AS n FROM products WHERE producer_id = ?")
    .get(producerId) as { n: number };
  const questions = db
    .prepare("SELECT COUNT(*) AS n FROM questions WHERE producer_id = ? AND answer IS NULL")
    .get(producerId) as { n: number };
  return { products: products.n, active: active.n, stock: stock.n, questions: questions.n };
}

export function getQuestions(producerId: number) {
  return plainList(getDb()
    .prepare("SELECT * FROM questions WHERE producer_id = ? ORDER BY id ASC")
    .all(producerId) as unknown as {
    id: number;
    author: string;
    location: string;
    body: string;
    answer: string | null;
    created_at: string;
  }[]);
}

export function getOrdersForProducer(producerId: number) {
  return plainList(getDb()
    .prepare(
      `SELECT DISTINCT o.* FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       JOIN products p ON p.id = oi.product_id
       WHERE p.producer_id = ? ORDER BY o.code DESC LIMIT 12`,
    )
    .all(producerId) as unknown as {
    id: number;
    code: string;
    name: string;
    phone: string;
    total: number;
    status: string;
    note: string;
    created_at: string;
  }[]);
}

export function getRecentOrdersFallback() {
  return plainList(getDb().prepare("SELECT * FROM orders ORDER BY id DESC LIMIT 12").all() as unknown as {
    id: number;
    code: string;
    name: string;
    phone: string;
    total: number;
    status: string;
    note: string;
    created_at: string;
  }[]);
}
