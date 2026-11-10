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
exports.getThreads = getThreadsForViewer;
exports.getThreadsForViewer = getThreadsForViewer;
exports.getThreadsByProducer = getThreadsByProducer;
exports.getThread = getThread;
exports.getThreadForViewer = getThreadForViewer;
exports.canAccessThread = canAccessThread;
exports.findThread = findThread;
exports.createThread = createThread;
exports.createMessage = createMessage;
exports.getMessages = getMessages;
exports.markThreadRead = markThreadRead;
exports.getUnreadCount = getUnreadCount;
exports.saveTranslation = saveTranslation;
exports.getTranslation = getTranslation;
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
function viewerClause(viewer) {
    if (viewer.role === "producer" && viewer.producerId) {
        return { where: "t.producer_id = ?", params: [viewer.producerId], unread: "t.producer_unread" };
    }
    if (viewer.userId) {
        return { where: "t.buyer_id = ?", params: [viewer.userId], unread: "t.buyer_unread" };
    }
    if (viewer.guestId) {
        return { where: "(t.is_demo = 1 OR t.buyer_guest = ?)", params: [viewer.guestId], unread: "t.buyer_unread" };
    }
    return { where: "t.is_demo = 1", params: [], unread: "t.buyer_unread" };
}

function getThreadsForViewer(viewer) {
    const clause = viewerClause(viewer);
    return plainList((0, db_1.getDb)()
        .prepare(
            `SELECT t.id, t.producer_id, t.buyer_id, t.buyer_guest, t.buyer_name, t.subject,
              t.updated_at, t.is_demo, ${clause.unread} AS unread,
              pr.name AS producer_name, pr.avatar AS producer_avatar,
              pr.municipality AS producer_municipality, pr.kind AS producer_kind,
              COALESCE((SELECT body FROM messages m WHERE m.thread_id = t.id ORDER BY m.id DESC LIMIT 1),'') AS last_body,
              COALESCE((SELECT m.sender FROM messages m WHERE m.thread_id = t.id ORDER BY m.id DESC LIMIT 1),'') AS last_sender
       FROM threads t JOIN producers pr ON pr.id = t.producer_id
       WHERE ${clause.where}
       ORDER BY datetime(t.updated_at) DESC, t.id DESC`,
        )
        .all(...clause.params));
}

function getThreadsByProducer(producerId) {
    return getThreadsForViewer({ role: "producer", producerId });
}

function getThread(id) {
    const thread = (0, db_1.getDb)()
        .prepare(`SELECT t.*, pr.name AS producer_name, pr.avatar AS producer_avatar, pr.municipality AS producer_municipality,
              pr.kind AS producer_kind, pr.hours AS producer_hours, pr.verified AS producer_verified
       FROM threads t JOIN producers pr ON pr.id = t.producer_id WHERE t.id = ?`)
        .get(id);
    return thread ? { ...thread } : null;
}

function getThreadForViewer(id, viewer) {
    const thread = getThread(id);
    if (!thread) return null;
    return canAccessThread(thread, viewer) ? thread : null;
}

function canAccessThread(thread, viewer) {
    if (!thread) return false;
    if (viewer.role === "producer") return thread.producer_id === viewer.producerId;
    if (viewer.userId) return thread.buyer_id === viewer.userId;
    if (viewer.guestId) return thread.is_demo === 1 || thread.buyer_guest === viewer.guestId;
    return thread.is_demo === 1;
}

function findThread(producerId, viewer) {
    const db = (0, db_1.getDb)();
    if (viewer.role === "producer") return null;
    if (viewer.userId) {
        return db
            .prepare("SELECT id FROM threads WHERE producer_id = ? AND buyer_id = ? ORDER BY id ASC LIMIT 1")
            .get(producerId, viewer.userId);
    }
    if (viewer.guestId) {
        return db
            .prepare("SELECT id FROM threads WHERE producer_id = ? AND buyer_guest = ? ORDER BY id ASC LIMIT 1")
            .get(producerId, viewer.guestId);
    }
    return null;
}

function createThread({ producerId, userId, guestId, buyerName, subject }) {
    const db = (0, db_1.getDb)();
    const result = db
        .prepare(
            "INSERT INTO threads (producer_id,buyer_id,buyer_guest,buyer_name,subject,is_demo,updated_at) VALUES (?,?,?,?,?,?,?)",
        )
        .run(producerId, userId ?? null, guestId ?? null, buyerName, (subject || "Consulta directa").slice(0, 120), 0, new Date().toISOString());
    return Number(result.lastInsertRowid);
}

function createMessage({ threadId, sender, body, productId = null, type = "text", lang = "es" }) {
    const db = (0, db_1.getDb)();
    const now = new Date().toISOString();
    const result = db
        .prepare("INSERT INTO messages (thread_id,sender,body,product_id,type,lang,created_at) VALUES (?,?,?,?,?,?,?)")
        .run(threadId, sender, body, productId, type, lang, now);
    const unreadColumn = sender === "producer" ? "buyer_unread" : "producer_unread";
    db.prepare(`UPDATE threads SET updated_at = ?, ${unreadColumn} = ${unreadColumn} + 1 WHERE id = ?`).run(now, threadId);
    return Number(result.lastInsertRowid);
}

function getMessages(threadId, options = {}) {
    const limit = Math.min(Math.max(Number(options.limit) || 50, 1), 100);
    const before = Number(options.before) || null;
    const rows = (0, db_1.getDb)()
        .prepare(
            `SELECT m.id, m.thread_id, m.sender, m.body, m.created_at, m.product_id, m.type, m.lang, m.read_at,
              p.name AS product_name, p.price AS product_price, p.image AS product_image
       FROM messages m LEFT JOIN products p ON p.id = m.product_id
       WHERE m.thread_id = ? ${before ? "AND m.id < ?" : ""}
       ORDER BY m.id DESC LIMIT ?`,
        )
        .all(...(before ? [threadId, before, limit + 1] : [threadId, limit + 1]));
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    return { messages: plainList(page).reverse(), hasMore };
}

function markThreadRead(threadId, viewer) {
    const db = (0, db_1.getDb)();
    if (viewer.role === "producer") {
        db.prepare("UPDATE threads SET producer_unread = 0 WHERE id = ?").run(threadId);
        db.prepare("UPDATE messages SET read_at = ? WHERE thread_id = ? AND sender IN ('buyer','system') AND read_at IS NULL").run(
            new Date().toISOString(),
            threadId,
        );
    } else {
        db.prepare("UPDATE threads SET buyer_unread = 0 WHERE id = ?").run(threadId);
        db.prepare("UPDATE messages SET read_at = ? WHERE thread_id = ? AND sender = 'producer' AND read_at IS NULL").run(
            new Date().toISOString(),
            threadId,
        );
    }
}

function getUnreadCount(viewer) {
    const clause = viewerClause(viewer);
    const row = (0, db_1.getDb)()
        .prepare(`SELECT COALESCE(SUM(${clause.unread}),0) AS n FROM threads t WHERE ${clause.where}`)
        .get(...clause.params);
    return Number(row?.n ?? 0);
}

function saveTranslation(messageId, lang, body, provider) {
    (0, db_1.getDb)()
        .prepare(
            "INSERT INTO message_translations (message_id,lang,body,provider,created_at) VALUES (?,?,?,?,?) ON CONFLICT(message_id,lang) DO UPDATE SET body = excluded.body, provider = excluded.provider",
        )
        .run(messageId, lang, body, provider, new Date().toISOString());
}

function getTranslation(messageId, lang) {
    return (0, db_1.getDb)()
        .prepare("SELECT body, provider FROM message_translations WHERE message_id = ? AND lang = ?")
        .get(messageId, lang);
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
