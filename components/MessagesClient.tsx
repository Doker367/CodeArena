"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { money, relativeLabel, timeLabel } from "@/lib/format";
import type { Message, Producer, Thread } from "@/lib/types";

type ChatThread = Thread & { producer_hours?: string; producer_verified?: number };

const FILTERS = ["Todos", "Negocios Locales", "Compras Activas"];

export function MessagesClient({
  initialThreads,
  producers,
  initialProducerSlug,
  initialProductId,
}: {
  initialThreads: Thread[];
  producers: Producer[];
  initialProducerSlug?: string;
  initialProductId?: number;
}) {
  const initialProducer = producers.find((p) => p.slug === initialProducerSlug) ?? null;
  const initialThread = initialProducer
    ? initialThreads.find((t) => t.producer_id === initialProducer.id) ?? null
    : initialThreads[0] ?? null;

  const [threads, setThreads] = useState(initialThreads);
  const [activeId, setActiveId] = useState<number | null>(initialThread?.id ?? null);
  const [activeProducer, setActiveProducer] = useState<Producer | null>(
    initialProducer ?? producers.find((p) => p.id === initialThread?.producer_id) ?? null,
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [noticeOpen, setNoticeOpen] = useState(true);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadThread = async (id: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/messages?thread=${id}`, { cache: "no-store" });
      if (response.ok) {
        const data = (await response.json()) as { thread: ChatThread; messages: Message[] };
        setMessages(data.messages);
        setThreads((current) =>
          current.map((t) => (t.id === id ? { ...t, unread: 0 } : t)),
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeId) void loadThread(activeId);
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const openThread = (thread: Thread) => {
    setActiveId(thread.id);
    setActiveProducer(producers.find((p) => p.id === thread.producer_id) ?? null);
  };

  const send = async () => {
    if (!draft.trim() || sending) return;
    setSending(true);
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId: activeId ?? undefined,
          producerId: activeProducer?.id,
          body: draft.trim(),
          productId: initialProductId,
        }),
      });
      if (response.ok) {
        const data = (await response.json()) as { threadId: number; messages: Message[] };
        setMessages(data.messages);
        setActiveId(data.threadId);
        setDraft("");
        setThreads((current) =>
          current.map((t) =>
            t.id === data.threadId ? { ...t, last_body: draft.trim(), updated_at: new Date().toISOString() } : t,
          ),
        );
      }
    } finally {
      setSending(false);
    }
  };

  const visibleThreads = threads.filter((t) => {
    if (search && !`${t.producer_name} ${t.last_body} ${t.producer_municipality}`.toLowerCase().includes(search.toLowerCase()))
      return false;
    if (filter === "Negocios Locales" && !t.producer_municipality.includes("San Cristóbal")) return false;
    if (filter === "Compras Activas" && t.unread === 0) return false;
    return true;
  });

  const activeThread = threads.find((t) => t.id === activeId);
  const chatProducer = activeProducer ?? producers.find((p) => p.id === activeThread?.producer_id) ?? null;

  return (
    <div className="flex flex-col w-full">
      <div className="w-full bg-surface-container-high py-2 px-4 md:px-8 flex items-center justify-between">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-space-sm text-on-surface-variant font-label-sm text-label-sm">
            <span className="flex h-2 w-2 rounded-full bg-secondary animate-pulse" />
            <span>Canal Encriptado Punto a Punto • Sin Comisiones de Intermediación</span>
          </div>
          <div className="hidden sm:flex items-center gap-space-md font-label-sm text-label-sm text-secondary">
            <span className="material-symbols-outlined text-sm">shield</span>
            <span>Garantía de Identidad Comunitaria Chiapaneca</span>
          </div>
        </div>
      </div>

      <section className="max-w-7xl mx-auto w-full px-2 sm:px-4 lg:px-8 py-space-sm pb-space-lg flex-1">
        <div className="bg-surface-container-lowest rounded-xl shadow-[0_1px_3px_rgba(27,56,43,0.04),0_4px_12px_rgba(27,56,43,0.03)] h-[calc(100vh-12rem)] min-h-[640px] flex overflow-hidden">
          <aside className="w-full md:w-[360px] lg:w-[410px] bg-surface-container-low flex flex-col shrink-0">
            <div className="p-space-md bg-surface-container-lowest space-y-space-sm shadow-[0_1px_4px_rgba(27,56,43,0.02)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <span className="font-headline-sm text-headline-sm text-primary">Mensajes</span>
                  <span className="bg-secondary-container text-on-secondary-container font-label-sm text-label-sm px-2 py-0.5 rounded-full font-bold">
                    {threads.length} activos
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setActiveId(null);
                      setActiveProducer(initialProducer ?? null);
                    }}
                    className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-lg transition-colors flex items-center justify-center"
                    title="Nuevo acuerdo directo"
                  >
                    <span className="material-symbols-outlined text-lg">edit_square</span>
                  </button>
                  <button
                    className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-lg transition-colors flex items-center justify-center"
                    title="Opciones"
                  >
                    <span className="material-symbols-outlined text-lg">more_vert</span>
                  </button>
                </div>
              </div>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-outline text-lg pointer-events-none">search</span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-surface-container-low font-body-sm text-body-sm text-on-surface placeholder:text-outline pl-9 pr-8 py-2 rounded-lg focus:outline-none focus:bg-surface-container-lowest transition-colors shadow-inner"
                  placeholder="Buscar negocio, productor o pedido..."
                  type="text"
                />
                <span className="material-symbols-outlined absolute right-3 text-outline hover:text-on-surface cursor-pointer text-sm">tune</span>
              </div>
              <div className="flex items-center gap-1.5 pt-1 overflow-x-auto pb-0.5 no-scrollbar">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1 rounded-full font-label-sm text-label-sm shrink-0 transition-colors flex items-center gap-1 ${
                      filter === f
                        ? "bg-primary text-on-primary font-semibold shadow-sm"
                        : "bg-surface-container hover:bg-surface-variant text-on-surface-variant"
                    }`}
                  >
                    {f}
                    {f === "Compras Activas" && <span className="w-1.5 h-1.5 rounded-full bg-secondary" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-space-xs space-y-1">
              {visibleThreads.map((t) => {
                const active = t.id === activeId;
                return (
                  <article
                    key={t.id}
                    onClick={() => openThread(t)}
                    className={`p-space-sm rounded-xl cursor-pointer flex items-start gap-space-sm relative transition-all group ${
                      active
                        ? "bg-surface-container-lowest shadow-[0_2px_8px_rgba(27,56,43,0.06)]"
                        : "bg-transparent hover:bg-surface-container-lowest/70"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <Image src={t.producer_avatar} alt={t.producer_name} width={48} height={48} className="w-12 h-12 rounded-full object-cover" />
                      <span
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ${
                          active ? "bg-secondary ring-surface-container-lowest" : "bg-outline-variant ring-surface-container-low"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between mb-0.5">
                        <h3 className={`font-title-md text-title-md truncate pr-1 ${active ? "text-primary" : "text-on-surface"}`}>
                          {t.producer_name}
                        </h3>
                        <span className={`font-label-sm text-label-sm shrink-0 ${active ? "text-secondary font-bold" : "text-outline"}`}>
                          {relativeLabel(t.updated_at)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 font-label-sm text-label-sm text-outline mb-1">
                        <span className="material-symbols-outlined text-xs text-secondary">verified</span>
                        <span className="truncate">
                          {t.producer_municipality.split(" / ")[0]} • {t.producer_kind.split(" · ")[0]}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <p className={`font-body-sm text-body-sm truncate ${active ? "text-on-surface font-semibold" : "text-on-surface-variant"}`}>
                          {t.last_body.replace(/<[^>]*>/g, "").slice(0, 70)}
                          {t.last_body.length > 70 ? "..." : ""}
                        </p>
                        {t.unread > 0 && (
                          <span className="bg-secondary text-on-secondary font-label-sm text-label-sm rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                            {t.unread}
                          </span>
                        )}
                      </div>
                    </div>
                    {active && <div className="absolute left-0 top-3 bottom-3 w-1 bg-secondary rounded-r-full" />}
                  </article>
                );
              })}
              {visibleThreads.length === 0 && (
                <p className="p-space-md font-body-sm text-body-sm text-outline">No hay conversaciones que coincidan.</p>
              )}
            </div>

            <div className="px-space-md py-3 bg-surface-container-lowest flex items-center justify-between shrink-0">
              <span className="flex items-center gap-1.5 font-label-sm text-label-sm text-on-surface-variant">
                <span className="material-symbols-outlined text-base text-secondary">volunteer_activism</span>
                Economía Solidaria Activa
              </span>
              <Link href="/como-funciona" className="font-label-sm text-label-sm text-secondary hover:underline">
                Cómo acordar pagos →
              </Link>
            </div>
          </aside>

          <main className="flex-1 flex flex-col bg-surface-container-lowest relative min-w-0">
            {chatProducer ? (
              <>
                <div className="h-16 px-space-md flex items-center justify-between border-b border-surface-container shrink-0">
                  <div className="flex items-center gap-space-sm min-w-0">
                    <Image
                      src={chatProducer.avatar}
                      alt={chatProducer.name}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h2 className="font-title-md text-title-md text-primary truncate">{chatProducer.name}</h2>
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-secondary-container/70 text-on-secondary-container font-label-sm text-[10px]">
                          <span className="material-symbols-outlined text-[10px]">verified</span> Verificado
                        </span>
                      </div>
                      <div className="flex items-center gap-1 font-label-sm text-label-sm text-outline">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                        <span className="truncate">
                          En línea • {chatProducer.municipality.split(" / ")[0]} • {chatProducer.kind.split(" · ")[0]}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Link
                      href={`/negocio/${chatProducer.slug}`}
                      className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container text-primary font-label-sm text-label-sm hover:bg-surface-container-high transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">store</span> Ver ficha del negocio
                    </Link>
                    <a
                      href={`https://wa.me/${chatProducer.whatsapp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary text-on-secondary font-label-sm text-label-sm hover:bg-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">call</span> Llamar por WhatsApp
                    </a>
                    <button className="p-1.5 text-outline hover:text-primary">
                      <span className="material-symbols-outlined text-lg">more_vert</span>
                    </button>
                  </div>
                </div>

                {noticeOpen && (
                  <div className="mx-space-sm mt-space-sm bg-secondary-container/40 border border-secondary/20 rounded-lg p-3 relative shrink-0">
                    <div className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-secondary text-lg shrink-0">verified_user</span>
                      <p className="font-body-sm text-body-sm text-on-secondary-fixed-variant">
                        <strong className="text-on-secondary-container">Trato directo y transparente:</strong> Este canal
                        conecta de forma directa al comprador y al productor chiapaneco sin ninguna comisión comercial.
                        Acuerden directamente el punto de entrega y la forma de pago (transferencia SPEI directa, pago
                        contra entrega o tajeta).
                      </p>
                      <button
                        onClick={() => setNoticeOpen(false)}
                        className="text-outline hover:text-on-surface shrink-0"
                        aria-label="Cerrar aviso"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex-1 overflow-y-auto px-space-md py-space-md flex flex-col gap-space-md">
                  <div className="text-center">
                    <span className="inline-block px-3 py-1 rounded-full bg-surface-container font-label-sm text-label-sm text-outline">
                      Hoy, 24 de Octubre 2024
                    </span>
                  </div>

                  {messages.map((m) => (
                    <div key={m.id} className={`flex flex-col ${m.sender === "buyer" ? "items-end" : "items-start"}`}>
                      {m.sender === "producer" && (
                        <div className="flex items-center gap-2 mb-1">
                          <Image
                            src={chatProducer.avatar}
                            alt={chatProducer.name}
                            width={24}
                            height={24}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <span className="font-label-sm text-label-sm text-on-surface-variant">
                            {chatProducer.name}
                          </span>
                        </div>
                      )}
                      <div
                        className={`max-w-[78%] rounded-2xl px-4 py-3 font-body-md text-body-md leading-relaxed ${
                          m.sender === "buyer"
                            ? "bg-primary-container text-on-primary rounded-br-md"
                            : "bg-surface-container-low text-on-surface rounded-bl-md"
                        }`}
                      >
                        {m.body}
                      </div>
                      <span className={`font-label-sm text-[10px] text-outline mt-1 ${m.sender === "buyer" ? "flex items-center gap-1" : ""}`}>
                        {timeLabel(m.created_at)}
                        {m.sender === "buyer" && <span className="material-symbols-outlined text-[12px] text-secondary">done_all</span>}
                      </span>

                      {m.product_id && m.product_name && (
                        <div className="mt-2 w-[78%] max-w-md rounded-xl border border-surface-container-high bg-surface-container-lowest shadow-sm overflow-hidden">
                          <div className="px-3 py-1.5 bg-secondary-container/50 font-label-sm text-[10px] uppercase tracking-wider text-on-secondary-container font-bold">
                            Referencia de compra:
                          </div>
                          <div className="p-3 flex gap-3">
                            <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0">
                              <Image src={m.product_image ?? "/img/img-30.jpg"} alt={m.product_name} fill sizes="64px" className="object-cover" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-title-md text-sm text-primary font-bold leading-tight">{m.product_name}</p>
                              <p className="font-body-sm text-xs text-on-surface-variant">Cosecha Tenejapa • Tostado a la leña</p>
                              <p className="font-headline-sm text-headline-sm text-primary font-bold mt-0.5">
                                {money(m.product_price ?? 240)} <span className="text-xs font-normal">MXN</span>
                              </p>
                            </div>
                          </div>
                          <div className="px-3 py-2 border-t border-surface-container flex items-center justify-between font-label-sm text-[11px]">
                            <span className="text-on-surface-variant">
                              Disponibilidad comunitaria: <strong className="text-primary">14 kg en tostador</strong>
                            </span>
                            <button className="px-2 py-1 rounded bg-primary text-on-primary font-semibold">Confirmar cantidad en chat</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {loading && <p className="text-center font-label-sm text-label-sm text-outline">Cargando conversación…</p>}
                  {!loading && messages.length === 0 && (
                    <div className="text-center py-10">
                      <span className="material-symbols-outlined text-4xl text-outline">forum</span>
                      <p className="font-body-md text-body-md text-on-surface-variant mt-2">
                        Inicia la conversación directa con {chatProducer.name}.
                      </p>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>

                <div className="px-space-md pb-2 shrink-0">
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    <span className="font-label-sm text-label-sm text-outline whitespace-nowrap mr-1">Respuestas rápidas:</span>
                    {["¿Acepta 2 kilos por favor?", "Paso mañana a las 4pm a Real de Guadalupe", "¿Cuál es su número de cuenta?"].map(
                      (reply) => (
                        <button
                          key={reply}
                          onClick={() => setDraft(reply)}
                          className="px-2.5 py-1 rounded-full bg-surface-container hover:bg-surface-container-high font-label-sm text-label-sm text-on-surface-variant whitespace-nowrap transition-colors"
                        >
                          {reply}
                        </button>
                      ),
                    )}
                  </div>
                </div>

                <div className="px-space-md pb-space-md shrink-0">
                  <div className="flex items-end gap-2 rounded-xl bg-surface-container-low p-2">
                    <div className="flex items-center gap-1 pb-1">
                      {["sentiment_satisfied", "attach_file", "location_on"].map((icon) => (
                        <button key={icon} className="p-1.5 text-outline hover:text-primary transition-colors" aria-label={icon}>
                          <span className="material-symbols-outlined text-lg">{icon}</span>
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          void send();
                        }
                      }}
                      rows={1}
                      placeholder={`Escribe tu mensaje o acuerdo directo a ${chatProducer.name.split(" ").slice(0, 2).join(" ")}...`}
                      className="flex-1 bg-transparent font-body-md text-body-md text-on-surface placeholder:text-outline resize-none focus:outline-none py-2"
                    />
                    <button
                      onClick={send}
                      disabled={sending || !draft.trim()}
                      className="px-4 py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-surface-tint transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      Enviar <span className="material-symbols-outlined text-lg">send</span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-2 px-1">
                    <span className="flex items-center gap-1 font-label-sm text-[10px] text-outline">
                      <span className="material-symbols-outlined text-xs text-secondary">verified_user</span>
                      Trato directo sin comisiones: {chatProducer.name} recibe el 100% de lo acordado
                    </span>
                    <span className="hidden sm:inline font-label-sm text-[10px] text-outline">Presiona Enter para enviar</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
                <span className="material-symbols-outlined text-5xl text-outline">forum</span>
                <h2 className="font-headline-sm text-headline-sm text-primary">Selecciona una conversación</h2>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-sm">
                  Elige un productor verificado para acordar directamente cantidades, entrega y pago sin intermediarios.
                </p>
                <Link href="/marketplace" className="mt-2 px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md">
                  Explorar el mercado
                </Link>
              </div>
            )}
          </main>
        </div>
      </section>
    </div>
  );
}
