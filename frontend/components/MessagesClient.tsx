"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { money, relativeLabel, timeLabel } from "@/lib/format";
import type { Language, Message, Producer, Thread } from "@/lib/types";

type Viewer = { role: "buyer" | "producer" | "guest"; name: string; isProducer: boolean };

type ThreadHeader = Thread & {
  producer_hours?: string;
  producer_verified?: number;
  buyer_id?: number | null;
};

const FILTERS = ["Todos", "Negocios Locales", "Compras Activas"];

export function MessagesClient({
  initialThreads,
  producers,
  initialProducerSlug,
  initialProductId,
  initialMe,
}: {
  initialThreads: Thread[];
  producers: Producer[];
  initialProducerSlug?: string;
  initialProductId?: number;
  initialMe: Viewer | null;
}) {
  const initialProducer = producers.find((p) => p.slug === initialProducerSlug) ?? null;
  const initialThread =
    (initialProducer && initialThreads.find((t) => t.producer_id === initialProducer.id)) ||
    initialThreads[0] ||
    null;

  const [threads, setThreads] = useState(initialThreads);
  const [activeId, setActiveId] = useState<number | null>(initialThread?.id ?? null);
  const [activeProducer, setActiveProducer] = useState<Producer | null>(
    initialProducer ?? producers.find((p) => p.id === initialThread?.producer_id) ?? null,
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [me, setMe] = useState<Viewer | null>(initialMe);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [noticeOpen, setNoticeOpen] = useState(true);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [readOnlyDemo, setReadOnlyDemo] = useState(false);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [newChatSearch, setNewChatSearch] = useState("");
  const [languages, setLanguages] = useState<{ code: string; name: string; nativeName: string }[]>([]);
  const [targetLang, setTargetLang] = useState("tzo");
  const [translations, setTranslations] = useState<Record<number, { text: string; provider: string }>>({});
  const [translatingId, setTranslatingId] = useState<number | null>(null);
  const [translationNotice, setTranslationNotice] = useState<string>("");
  const [hasMore, setHasMore] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollOnNext = useRef(false);

  const chatProducer = activeProducer ?? producers.find((p) => p.id === threads.find((t) => t.id === activeId)?.producer_id) ?? null;

  const loadLanguages = async () => {
    try {
      const response = await fetch("/api/languages", { cache: "no-store" });
      if (response.ok) {
        const data = (await response.json()) as { languages: Language[] };
        setLanguages(data.languages.map((l) => ({ code: l.code, name: l.name, nativeName: l.nativeName })));
      }
    } catch {
      setLanguages([
        { code: "tzo", name: "Tsotsil", nativeName: "Bats'i k'op" },
        { code: "tzh", name: "Tseltal", nativeName: "Bats'il k'op" },
        { code: "ctu", name: "Ch'ol", nativeName: "Lakty'an" },
      ]);
    }
  };

  const loadThread = async (id: number, peek = false) => {
    if (!peek) setLoading(true);
    try {
      const response = await fetch(`/api/messages?thread=${id}${peek ? "&peek=1" : ""}`, { cache: "no-store" });
      if (response.ok) {
        const data = (await response.json()) as {
          thread: ThreadHeader;
          messages: Message[];
          hasMore: boolean;
          me: Viewer;
          readOnlyDemo: boolean;
        };
        setMessages(data.messages);
        setHasMore(data.hasMore);
        scrollOnNext.current = data.messages.length > 0;
        setMe(data.me);
        setReadOnlyDemo(data.readOnlyDemo);
        setThreads((current) => current.map((t) => (t.id === id ? { ...t, unread: 0, last_body: data.messages.at(-1)?.body ?? t.last_body } : t)));
      }
    } finally {
      if (!peek) setLoading(false);
    }
  };

  const loadThreads = async () => {
    try {
      const response = await fetch("/api/messages", { cache: "no-store" });
      if (response.ok) {
        const data = (await response.json()) as { threads: Thread[] };
        setThreads(data.threads);
      }
    } catch {
      /* keep current */
    }
  };

  useEffect(() => {
    void loadLanguages();
  }, []);

  useEffect(() => {
    if (activeId) void loadThread(activeId);
  }, [activeId]);

  useEffect(() => {
    if (scrollOnNext.current) {
      scrollOnNext.current = false;
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages.length, translations]);

  useEffect(() => {
    if (!activeId) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadThread(activeId, true);
    }, 12000);
    return () => window.clearInterval(timer);
  }, [activeId]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        if (activeId) void loadThread(activeId, true);
        void loadThreads();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [activeId]);

  const openThread = (thread: Thread) => {
    setActiveId(thread.id);
    setActiveProducer(producers.find((p) => p.id === thread.producer_id) ?? null);
    setTranslations({});
    setTranslationNotice("");
  };

  const send = async () => {
    if (!draft.trim() || sending) return;
    setSending(true);
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId: readOnlyDemo ? undefined : activeId ?? undefined,
          producerId: activeProducer?.id,
          body: draft.trim(),
          productId: initialProductId,
        }),
      });
      if (!response.ok) return;
      const data = (await response.json()) as {
        threadId: number;
        thread: ThreadHeader;
        messages: Message[];
        me: Viewer;
        readOnlyDemo?: boolean;
      };
      setMessages(data.messages);
      setMe(data.me);
      setReadOnlyDemo(false);
      setDraft("");
      setTranslationNotice("");
      scrollOnNext.current = true;
      if (data.threadId !== activeId) {
        setActiveId(data.threadId);
        setActiveProducer(producers.find((p) => p.id === data.thread.producer_id) ?? activeProducer);
      }
      await loadThreads();
    } finally {
      setSending(false);
    }
  };

  const translate = async (message: Message) => {
    if (!targetLang) return;
    setTranslatingId(message.id);
    setTranslationNotice("");
    try {
      const response = await fetch("/api/languages/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: message.body,
          source: message.lang || "es",
          target: targetLang,
          messageId: message.id,
        }),
      });
      const data = (await response.json()) as {
        available: boolean;
        text?: string;
        provider?: string;
        reason?: string;
        error?: string;
        warning?: string;
      };
      if (data.available && data.text) {
        setTranslations((current) => ({
          ...current,
          [message.id]: { text: data.text!, provider: data.provider ?? "auto" },
        }));
        if (data.warning) setTranslationNotice(data.warning);
      } else {
        setTranslationNotice(data.reason || data.error || "Traducción automática no disponible.");
      }
    } finally {
      setTranslatingId(null);
    }
  };

  const visibleThreads = threads.filter((t) => {
    if (search && !`${t.producer_name} ${t.last_body} ${t.producer_municipality}`.toLowerCase().includes(search.toLowerCase()))
      return false;
    if (filter === "Negocios Locales" && !t.producer_municipality.includes("San Cristóbal")) return false;
    if (filter === "Compras Activas" && t.unread === 0) return false;
    return true;
  });

  const newChatCandidates = producers.filter((p) =>
    `${p.name} ${p.municipality} ${p.kind}`.toLowerCase().includes(newChatSearch.toLowerCase()),
  );

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
        <div className="bg-surface-container-lowest rounded-xl shadow-[0_1px_3px_rgba(27,56,43,0.04),0_4px_12px_rgba(27,56,43,0.03)] h-[calc(100vh-11rem)] min-h-[640px] flex overflow-hidden">
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
                    onClick={() => setNewChatOpen(true)}
                    disabled={me?.isProducer}
                    className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-lg transition-colors flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                    title={me?.isProducer ? "Los productores reciben consultas de compradores" : "Nuevo acuerdo directo"}
                  >
                    <span className="material-symbols-outlined text-lg">edit_square</span>
                  </button>
                  <Link
                    href="/lenguas"
                    className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-lg transition-colors flex items-center justify-center"
                    title="Lenguas originarias e intérpretes"
                  >
                    <span className="material-symbols-outlined text-lg">translate</span>
                  </Link>
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
                <span className="material-symbols-outlined absolute right-3 text-outline text-sm">tune</span>
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
                        {t.is_demo === 1 && (
                          <span className="px-1.5 py-0.5 rounded bg-surface-container font-label-sm text-[9px] uppercase tracking-wide">
                            Demo
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <p className={`font-body-sm text-body-sm truncate ${active ? "text-on-surface font-semibold" : "text-on-surface-variant"}`}>
                          {t.last_sender === "system" ? "Pedido comunitario · " : ""}
                          {t.last_body.replace(/<[^>]*>/g, "").slice(0, 70)}
                          {t.last_body.length > 70 ? "..." : ""}
                        </p>
                        {t.unread > 0 && (
                          <span className="bg-secondary text-on-secondary font-label-sm text-label-sm rounded-full min-w-5 h-5 px-1 flex items-center justify-center shrink-0">
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
                <div className="p-space-md text-center">
                  <p className="font-body-sm text-body-sm text-outline">No hay conversaciones que coincidan.</p>
                  {!me?.isProducer && (
                    <button onClick={() => setNewChatOpen(true)} className="mt-2 text-secondary font-label-sm text-label-sm hover:underline">
                      Iniciar un acuerdo directo
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="px-space-md py-3 bg-surface-container-lowest flex items-center justify-between shrink-0">
              <span className="flex items-center gap-1.5 font-label-sm text-label-sm text-on-surface-variant">
                <span className="material-symbols-outlined text-base text-secondary">volunteer_activism</span>
                Economía Solidaria Activa
              </span>
              <Link href="/lenguas" className="font-label-sm text-label-sm text-secondary hover:underline">
                Traducción e intérpretes →
              </Link>
            </div>
          </aside>

          <main className="flex-1 flex flex-col bg-surface-container-lowest relative min-w-0">
            {chatProducer ? (
              <>
                <div className="min-h-16 px-space-md py-2 flex items-center justify-between border-b border-surface-container shrink-0 gap-2">
                  <div className="flex items-center gap-space-sm min-w-0">
                    <Image
                      src={chatProducer.avatar}
                      alt={chatProducer.name}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h2 className="font-title-md text-title-md text-primary truncate">{chatProducer.name}</h2>
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-secondary-container/70 text-on-secondary-container font-label-sm text-[10px]">
                          <span className="material-symbols-outlined text-[10px]">verified</span> Verificado
                        </span>
                        {me?.isProducer && (
                          <span className="px-1.5 py-0.5 rounded-full bg-primary-container text-primary-fixed font-label-sm text-[10px]">
                            Panel productor
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 font-label-sm text-label-sm text-outline">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                        <span className="truncate">
                          {me?.isProducer ? `Comprador: ${threads.find((t) => t.id === activeId)?.buyer_name ?? "Visitante"}` : `En línea • ${chatProducer.municipality.split(" / ")[0]}`}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <label className="hidden lg:flex items-center gap-1 px-2 py-1.5 rounded-lg bg-surface-container text-primary font-label-sm text-label-sm">
                      <span className="material-symbols-outlined text-sm text-secondary">translate</span>
                      <select
                        value={targetLang}
                        onChange={(e) => {
                          setTargetLang(e.target.value);
                          setTranslationNotice("");
                        }}
                        className="bg-transparent font-label-sm text-label-sm cursor-pointer focus:outline-none max-w-[100px]"
                        aria-label="Traducir mensajes a"
                      >
                        <option value="tzo">Tsotsil</option>
                        {languages
                          .filter((l) => l.code !== "tzo")
                          .map((l) => (
                            <option key={l.code} value={l.code}>
                              {l.name}
                            </option>
                          ))}
                      </select>
                    </label>
                    <Link
                      href={`/negocio/${chatProducer.slug}`}
                      className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container text-primary font-label-sm text-label-sm hover:bg-surface-container-high transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">store</span> Ver ficha
                    </Link>
                    <a
                      href={`https://wa.me/${chatProducer.whatsapp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary text-on-secondary font-label-sm text-label-sm hover:bg-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">call</span> WhatsApp
                    </a>
                  </div>
                </div>

                {noticeOpen && (
                  <div className="mx-space-sm mt-space-sm bg-secondary-container/40 border border-secondary/20 rounded-lg p-3 relative shrink-0">
                    <div className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-secondary text-lg shrink-0">verified_user</span>
                      <p className="font-body-sm text-body-sm text-on-secondary-fixed-variant">
                        <strong className="text-on-secondary-container">Trato directo y transparente:</strong> Este canal
                        conecta de forma directa al comprador y al productor chiapaneco sin comisiones. Acuerden punto de
                        entrega y pago (SPEI directo, efectivo contra entrega o terminal).
                      </p>
                      <button onClick={() => setNoticeOpen(false)} className="text-outline hover:text-on-surface shrink-0" aria-label="Cerrar aviso">
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>
                  </div>
                )}

                {readOnlyDemo && (
                  <div className="mx-space-sm mt-space-sm bg-surface-container-low rounded-lg px-3 py-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-base">info</span>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">
                      Estás leyendo una conversación de demostración. Al escribir se abrirá tu propio hilo con este productor.
                    </p>
                  </div>
                )}

                <div className="flex-1 overflow-y-auto px-space-md py-3 flex flex-col gap-3">
                  <div className="text-center">
                    <span className="inline-block px-3 py-1 rounded-full bg-surface-container font-label-sm text-label-sm text-outline">
                      Acuerdo comunitario directo
                    </span>
                  </div>

                  {hasMore && (
                    <div className="text-center">
                      <span className="font-label-sm text-label-sm text-outline">Hay mensajes anteriores en este hilo</span>
                    </div>
                  )}

                  {messages.map((m) => {
                    const mine =
                      (me?.isProducer && m.sender === "producer") || (!me?.isProducer && m.sender === "buyer");
                    if (m.sender === "system") {
                      return (
                        <div key={m.id} className="flex justify-center">
                          <div className="max-w-[80%] px-4 py-2 rounded-xl bg-secondary-container/40 text-on-secondary-fixed-variant font-label-sm text-label-sm flex items-start gap-2">
                            <span className="material-symbols-outlined text-sm text-secondary">receipt_long</span>
                            <span>{m.body}</span>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                        {!mine && (
                          <div className="flex items-center gap-2 mb-1">
                            {m.sender === "producer" ? (
                              <Image src={chatProducer.avatar} alt={chatProducer.name} width={24} height={24} className="w-6 h-6 rounded-full object-cover" />
                            ) : (
                              <span className="w-6 h-6 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-[10px] flex items-center justify-center">
                                {(threads.find((t) => t.id === activeId)?.buyer_name ?? "V").slice(0, 2).toUpperCase()}
                              </span>
                            )}
                            <span className="font-label-sm text-label-sm text-on-surface-variant">
                              {m.sender === "producer" ? chatProducer.name : threads.find((t) => t.id === activeId)?.buyer_name ?? "Comprador"}
                            </span>
                          </div>
                        )}
                        <div
                          className={`max-w-[78%] rounded-2xl px-4 py-3 font-body-md text-body-md leading-relaxed ${
                            mine
                              ? "bg-primary-container text-on-primary rounded-br-md"
                              : "bg-surface-container-low text-on-surface rounded-bl-md"
                          }`}
                        >
                          {m.body}
                        </div>
                        <div className={`flex items-center gap-2 mt-1 ${mine ? "flex-row-reverse" : ""}`}>
                          <span className="font-label-sm text-[10px] text-outline">{timeLabel(m.created_at)}</span>
                          {mine && (
                            <span
                              className={`material-symbols-outlined text-[12px] ${m.read_at ? "text-secondary" : "text-outline"}`}
                              title={m.read_at ? "Leído" : "Enviado"}
                            >
                              {m.read_at ? "done_all" : "done"}
                            </span>
                          )}
                          <button
                            onClick={() => translate(m)}
                            disabled={translatingId === m.id}
                            className="inline-flex items-center gap-0.5 font-label-sm text-[10px] text-secondary hover:underline disabled:opacity-50"
                            title={`Traducir a ${languages.find((l) => l.code === targetLang)?.name ?? "lengua originaria"}`}
                          >
                            <span className="material-symbols-outlined text-[12px]">translate</span>
                            {translatingId === m.id ? "Traduciendo…" : "Traducir"}
                          </button>
                        </div>
                        {translations[m.id] && (
                          <div className={`mt-1 max-w-[78%] rounded-xl border border-secondary/20 bg-secondary-container/20 px-3 py-2 ${mine ? "text-right" : ""}`}>
                            <span className="font-label-sm text-[9px] uppercase tracking-wider text-secondary font-bold">
                              {languages.find((l) => l.code === targetLang)?.name ?? targetLang} · {translations[m.id].provider === "hf-tsotsil-experimental" ? "beta" : "comunidad"}
                            </span>
                            <p className="font-body-sm text-body-sm text-on-surface">{translations[m.id].text}</p>
                          </div>
                        )}
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
                              <button
                                onClick={() => setDraft(`Confirmo ${m.product_name ?? "el producto"}. ¿Coordinamos la entrega?`)}
                                className="px-2 py-1 rounded bg-primary text-on-primary font-semibold"
                              >
                                Confirmar cantidad
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {loading && <p className="text-center font-label-sm text-label-sm text-outline">Cargando conversación…</p>}
                  {!loading && messages.length === 0 && (
                    <div className="text-center py-10">
                      <span className="material-symbols-outlined text-4xl text-outline">forum</span>
                      <p className="font-body-md text-body-md text-on-surface-variant mt-2">
                        {me?.isProducer
                          ? "Aún no hay mensajes en esta conversación."
                          : `Inicia la conversación directa con ${chatProducer.name}.`}
                      </p>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>

                {translationNotice && (
                  <div className="mx-space-md mb-2 rounded-lg bg-tertiary-container/10 border border-tertiary-container/20 px-3 py-2 flex items-start gap-2">
                    <span className="material-symbols-outlined text-tertiary-container text-base">info</span>
                    <p className="font-label-sm text-label-sm text-on-surface-variant flex-1">{translationNotice}</p>
                    <Link href="/lenguas" className="font-label-sm text-label-sm text-secondary font-bold whitespace-nowrap hover:underline">
                      Solicitar intérprete →
                    </Link>
                  </div>
                )}

                <div className="px-space-md pb-2 shrink-0">
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    <span className="font-label-sm text-label-sm text-outline whitespace-nowrap mr-1">Respuestas rápidas:</span>
                    {[
                      "¿Acepta 2 kilos por favor?",
                      "Paso mañana a las 4pm a Real de Guadalupe",
                      "¿Cuál es su número de cuenta?",
                      "¿Puede enviarlo a Tuxtla?",
                    ].map((reply) => (
                      <button
                        key={reply}
                        onClick={() => setDraft(reply)}
                        className="px-2.5 py-1 rounded-full bg-surface-container hover:bg-surface-container-high font-label-sm text-label-sm text-on-surface-variant whitespace-nowrap transition-colors"
                      >
                        {reply}
                      </button>
                    ))}
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
                      placeholder={
                        me?.isProducer
                          ? "Responder como productor comunitario..."
                          : `Escribe tu mensaje o acuerdo directo a ${chatProducer.name.split(" ").slice(0, 2).join(" ")}...`
                      }
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
                      Trato directo sin comisiones · {chatProducer.name} recibe el 100%
                    </span>
                    <span className="hidden sm:inline font-label-sm text-[10px] text-outline">Enter para enviar</span>
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
                <button onClick={() => setNewChatOpen(true)} className="mt-2 px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md">
                  Iniciar acuerdo directo
                </button>
              </div>
            )}
          </main>
        </div>
      </section>

      {newChatOpen && (
        <div className="fixed inset-0 z-[80] bg-primary/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setNewChatOpen(false)}>
          <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-headline-sm text-headline-sm text-primary">Nuevo acuerdo directo</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Elige un productor verificado.</p>
              </div>
              <button onClick={() => setNewChatOpen(false)} className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <input
              value={newChatSearch}
              onChange={(e) => setNewChatSearch(e.target.value)}
              placeholder="Buscar por nombre o municipio..."
              className="w-full px-3 py-2 rounded-lg bg-surface-container-low font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-secondary mb-3"
            />
            <div className="max-h-80 overflow-y-auto space-y-1.5">
              {newChatCandidates.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setActiveId(null);
                    setActiveProducer(p);
                    setMessages([]);
                    setTranslations({});
                    setTranslationNotice("");
                    setReadOnlyDemo(false);
                    setNewChatOpen(false);
                    setNewChatSearch("");
                  }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-surface-container-low text-left transition-colors"
                >
                  <Image src={p.avatar} alt={p.name} width={40} height={40} className="w-10 h-10 rounded-full object-cover" />
                  <div className="min-w-0">
                    <p className="font-title-md text-sm text-primary truncate">{p.name}</p>
                    <p className="font-label-sm text-label-sm text-outline truncate">
                      {p.municipality.split(" / ")[0]} • {p.kind}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
