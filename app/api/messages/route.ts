import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { getMessages, getThread, getThreads } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const threadId = Number(url.searchParams.get("thread") || 0);
  if (threadId) {
    const thread = getThread(threadId);
    if (!thread) return NextResponse.json({ error: "Conversación no encontrada" }, { status: 404 });
    const db = getDb();
    db.prepare("UPDATE threads SET unread = 0 WHERE id = ?").run(threadId);
    return NextResponse.json({ thread, messages: getMessages(threadId) });
  }
  const user = await getSessionUser();
  return NextResponse.json({ threads: getThreads(user?.id) });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    threadId?: number;
    producerId?: number;
    body?: string;
    productId?: number;
  };
  if (!body.body?.trim()) {
    return NextResponse.json({ error: "Escribe un mensaje." }, { status: 400 });
  }
  const db = getDb();
  const user = await getSessionUser();
  const buyerName = user?.name ?? "Alejandra Ruiz Moreno";
  let threadId = body.threadId ? Number(body.threadId) : 0;

  if (!threadId && body.producerId) {
    const producerThread = db
      .prepare("SELECT id FROM threads WHERE producer_id = ? AND (buyer_id IS ? OR buyer_id = ?) ORDER BY id ASC LIMIT 1")
      .get(body.producerId, user?.id ?? null, user?.id ?? -1) as { id: number } | undefined;
    if (producerThread) {
      threadId = producerThread.id;
    } else {
      const result = db
        .prepare(
          "INSERT INTO threads (producer_id,buyer_id,buyer_name,subject,unread,updated_at) VALUES (?,?,?,?,?,?)",
        )
        .run(body.producerId, user?.id ?? null, buyerName, "Consulta directa", 1, new Date().toISOString());
      threadId = Number(result.lastInsertRowid);
    }
  }

  if (!threadId) return NextResponse.json({ error: "Conversación inválida" }, { status: 400 });

  db.prepare("INSERT INTO messages (thread_id,sender,body,product_id,created_at) VALUES (?,?,?,?,?)").run(
    threadId,
    "buyer",
    body.body.trim().slice(0, 2000),
    body.productId ?? null,
    new Date().toISOString(),
  );
  db.prepare("UPDATE threads SET updated_at = ?, unread = 1 WHERE id = ?").run(new Date().toISOString(), threadId);
  return NextResponse.json({ threadId, messages: getMessages(threadId) });
}
