"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProducers = getProducers;
exports.getProducerBySlug = getProducerBySlug;
exports.getProducerById = getProducerById;
exports.getProducts = getProducts;
exports.getProductBySlug = getProductBySlug;
exports.getProductById = getProductById;
exports.getProducerProducts = getProducerProducts;
exports.getFeaturedProduct = getFeaturedProduct;
exports.getReviews = getReviews;
exports.getProcessSteps = getProcessSteps;
exports.getCart = getCart;
exports.getThreads = getThreads;
exports.getThreadsByProducer = getThreadsByProducer;
exports.getThread = getThread;
exports.getMessages = getMessages;
exports.getSellerStats = getSellerStats;
exports.getQuestions = getQuestions;
exports.getOrdersForProducer = getOrdersForProducer;
exports.getRecentOrdersFallback = getRecentOrdersFallback;
const db_1 = require("./db");
/** node:sqlite rows have a null prototype; RSC requires plain objects. */
const plainList = (rows) => rows.map((row) => ({ ...row }));
const plainOne = (row) => (row ? { ...row } : null);
function getProducers(category, q) {
    const db = (0, db_1.getDb)();
    let sql = "SELECT * FROM producers";
    const where = [];
    const params = [];
    if (category && category !== "todos") {
        where.push("category = ?");
        params.push(category);
    }
    if (q) {
        where.push("(name LIKE ? OR municipality LIKE ? OR about LIKE ?)");
        params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    if (where.length)
        sql += " WHERE " + where.join(" AND ");
    sql += " ORDER BY review_count DESC";
    return plainList(db.prepare(sql).all(...params));
}
function getProducerBySlug(slug) {
    const row = (0, db_1.getDb)().prepare("SELECT * FROM producers WHERE slug = ?").get(slug);
    return plainOne(row);
}
function getProducerById(id) {
    const row = (0, db_1.getDb)().prepare("SELECT * FROM producers WHERE id = ?").get(id);
    return plainOne(row);
}
function getProducts(opts = {}) {
    const db = (0, db_1.getDb)();
    const where = [];
    const params = [];
    if (opts.onlyActive !== false)
        where.push("p.status = 'activo'");
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
    if (opts.sort === "precio-asc")
        order = " ORDER BY p.price ASC";
    if (opts.sort === "precio-desc")
        order = " ORDER BY p.price DESC";
    if (opts.sort === "nuevos")
        order = " ORDER BY p.id DESC";
    if (opts.sort === "rating")
        order = " ORDER BY p.rating DESC";
    const limit = Math.min(opts.limit ?? 12, 48);
    const page = Math.max(opts.page ?? 1, 1);
    const totalRow = db
        .prepare(`SELECT COUNT(*) AS n FROM products p JOIN producers pr ON pr.id = p.producer_id${whereSql}`)
        .get(...params);
    const items = plainList(db
        .prepare(`SELECT p.* FROM products p JOIN producers pr ON pr.id = p.producer_id${whereSql}${order} LIMIT ? OFFSET ?`)
        .all(...params, limit, (page - 1) * limit));
    return { items, total: totalRow.n };
}
function getProductBySlug(slug) {
    const row = (0, db_1.getDb)().prepare("SELECT * FROM products WHERE slug = ?").get(slug);
    return plainOne(row);
}
function getProductById(id) {
    const row = (0, db_1.getDb)().prepare("SELECT * FROM products WHERE id = ?").get(id);
    return plainOne(row);
}
function getProducerProducts(producerId) {
    return plainList((0, db_1.getDb)()
        .prepare("SELECT * FROM products WHERE producer_id = ? ORDER BY featured DESC, id ASC")
        .all(producerId));
}
function getFeaturedProduct() {
    const db = (0, db_1.getDb)();
    const product = db.prepare("SELECT * FROM products WHERE featured = 1 LIMIT 1").get();
    if (!product)
        return null;
    const producer = plainOne(db.prepare("SELECT * FROM producers WHERE id = ?").get(product.producer_id));
    if (!producer)
        return null;
    return { product: { ...product }, producer };
}
function getReviews(producerId) {
    return plainList((0, db_1.getDb)()
        .prepare("SELECT * FROM reviews WHERE producer_id = ? ORDER BY id ASC")
        .all(producerId));
}
function getProcessSteps(producerId) {
    return plainList((0, db_1.getDb)()
        .prepare("SELECT * FROM process_steps WHERE producer_id = ? ORDER BY id ASC")
        .all(producerId));
}
function getCart(cartId) {
    if (!cartId)
        return { lines: [], subtotal: 0, count: 0 };
    const raw = (0, db_1.getDb)()
        .prepare(`SELECT ci.id AS line_id, ci.qty AS qty, ci.note AS note,
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
       WHERE ci.cart_id = ? ORDER BY ci.id ASC`)
        .all(cartId);
    const lines = raw.map((r) => ({
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
function getThreads(userId) {
    return plainList((0, db_1.getDb)()
        .prepare(`SELECT t.id, t.producer_id, t.buyer_name, t.subject, t.updated_at, t.unread,
              pr.name AS producer_name, pr.avatar AS producer_avatar,
              pr.municipality AS producer_municipality, pr.kind AS producer_kind,
              COALESCE((SELECT body FROM messages m WHERE m.thread_id = t.id ORDER BY m.id DESC LIMIT 1),'') AS last_body
       FROM threads t JOIN producers pr ON pr.id = t.producer_id
       ${userId ? "WHERE t.buyer_id = ?" : ""}
       ORDER BY datetime(t.updated_at) DESC`)
        .all(...(userId ? [userId] : [])));
}
function getThreadsByProducer(producerId) {
    return plainList((0, db_1.getDb)()
        .prepare(
            `SELECT t.id, t.producer_id, t.buyer_name, t.subject, t.updated_at, t.unread,
              pr.name AS producer_name, pr.avatar AS producer_avatar,
              pr.municipality AS producer_municipality, pr.kind AS producer_kind,
              COALESCE((SELECT body FROM messages m WHERE m.thread_id = t.id ORDER BY m.id DESC LIMIT 1),'') AS last_body
       FROM threads t JOIN producers pr ON pr.id = t.producer_id
       WHERE t.producer_id = ?
       ORDER BY datetime(t.updated_at) DESC`,
        )
        .all(producerId));
}

function getThread(id) {
    const thread = (0, db_1.getDb)()
        .prepare(`SELECT t.*, pr.name AS producer_name, pr.avatar AS producer_avatar, pr.municipality AS producer_municipality,
              pr.kind AS producer_kind, pr.hours AS producer_hours, pr.verified AS producer_verified
       FROM threads t JOIN producers pr ON pr.id = t.producer_id WHERE t.id = ?`)
        .get(id);
    return thread ? { ...thread } : null;
}
function getMessages(threadId) {
    return plainList((0, db_1.getDb)()
        .prepare(`SELECT m.id, m.thread_id, m.sender, m.body, m.created_at, m.product_id,
              p.name AS product_name, p.price AS product_price, p.image AS product_image
       FROM messages m LEFT JOIN products p ON p.id = m.product_id
       WHERE m.thread_id = ? ORDER BY m.id ASC`)
        .all(threadId));
}
function getSellerStats(producerId) {
    const db = (0, db_1.getDb)();
    const products = db
        .prepare("SELECT COUNT(*) AS n FROM products WHERE producer_id = ?")
        .get(producerId);
    const active = db
        .prepare("SELECT COUNT(*) AS n FROM products WHERE producer_id = ? AND status = 'activo'")
        .get(producerId);
    const stock = db
        .prepare("SELECT COALESCE(SUM(stock),0) AS n FROM products WHERE producer_id = ?")
        .get(producerId);
    const questions = db
        .prepare("SELECT COUNT(*) AS n FROM questions WHERE producer_id = ? AND answer IS NULL")
        .get(producerId);
    return { products: products.n, active: active.n, stock: stock.n, questions: questions.n };
}
function getQuestions(producerId) {
    return plainList((0, db_1.getDb)()
        .prepare("SELECT * FROM questions WHERE producer_id = ? ORDER BY id ASC")
        .all(producerId));
}
function getOrdersForProducer(producerId) {
    return plainList((0, db_1.getDb)()
        .prepare(`SELECT DISTINCT o.* FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       JOIN products p ON p.id = oi.product_id
       WHERE p.producer_id = ? ORDER BY o.code DESC LIMIT 12`)
        .all(producerId));
}
function getRecentOrdersFallback() {
    return plainList((0, db_1.getDb)().prepare("SELECT * FROM orders ORDER BY id DESC LIMIT 12").all());
}
