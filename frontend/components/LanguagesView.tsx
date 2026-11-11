"use client";

import { useState } from "react";
import Link from "next/link";
import type { Language, TranslationResearch } from "@/lib/types";

export type LanguagesPayload = {
  languages: Language[];
  research: TranslationResearch;
  automatic: {
    available: boolean;
    provider: string;
    pairs: string[];
    message: string;
    local?: boolean;
    tseltalPhrases?: number;
  };
  human: { available: boolean; phone: string; whatsapp: string; hours: string };
};

const STATUS: Record<string, { label: string; className: string }> = {
  vital: { label: "Vital", className: "bg-secondary-container text-on-secondary-container" },
  riesgo: { label: "En riesgo", className: "bg-tertiary-fixed text-on-tertiary-fixed" },
  critico: { label: "Crítica", className: "bg-error-container text-on-error-container" },
};

export function LanguagesView({ data }: { data: LanguagesPayload }) {
  const [tab, setTab] = useState<"automatico" | "interprete">("interprete");
  const [target, setTarget] = useState(data.languages[0]?.code ?? "tzo");
  const [text, setText] = useState("");
  const [translation, setTranslation] = useState<{ text: string; provider: string; warning?: string } | null>(null);
  const [reason, setReason] = useState("");
  const [translating, setTranslating] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);

  const [form, setForm] = useState({ name: "", phone: "", language: data.languages[0]?.code ?? "tzo", message: "", channel: "whatsapp" });
  const [request, setRequest] = useState<{ folio: string; message: string; contact: { phone: string; whatsapp: string } } | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const activeLanguage = data.languages.find((l) => l.code === target) ?? data.languages[0];

  const translate = async () => {
    if (!text.trim()) return;
    setTranslating(true);
    setReason("");
    setTranslation(null);
    try {
      const response = await fetch("/api/languages/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, source: "es", target }),
      });
      const result = await response.json();
      if (result.available) {
        setTranslation({ text: result.text, provider: result.provider, warning: result.warning });
      } else {
        setReason(result.reason || result.error || "Traducción automática no disponible.");
      }
    } finally {
      setTranslating(false);
    }
  };

  const requestInterpreter = async () => {
    setError("");
    if (!form.name.trim() || !form.phone.trim() || !form.message.trim()) {
      setError("Completa tu nombre, WhatsApp y el mensaje que necesitas traducir.");
      return;
    }
    setSending(true);
    try {
      const response = await fetch("/api/languages/interpreter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error ?? "No pudimos registrar la solicitud.");
        return;
      }
      setRequest(result);
    } finally {
      setSending(false);
    }
  };

  const askForMessage = (language: Language) => {
    setSelectedLanguage(language.code);
    setForm((current) => ({ ...current, language: language.code, message: text }));
    setTab("interprete");
    document.getElementById("traductor")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="flex flex-col w-full">
      {/* HERO */}
      <section className="w-full bg-surface-container-low py-space-xl px-4 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm uppercase tracking-wider">
              <span className="material-symbols-outlined text-sm">translate</span>
              Lenguas originarias · Chiapas
            </span>
            <h1 className="font-display-lg text-display-lg text-primary tracking-tight mt-3">
              Doce lenguas, una misma dignidad
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant mt-2 max-w-2xl">
              Chiapas reconoce 12 lenguas indígenas. Aquí puedes consultar sus territorios, recursos y conectar con
              personas intérpretes de la red comunitaria para tus compras y acuerdos directos.
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-5">
              <a href="#traductor" className="px-5 py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md">
                Ir al traductor comunitario
              </a>
              <a href="#lenguas" className="px-4 py-2.5 rounded-lg bg-surface-container-lowest text-primary font-label-md text-label-md shadow-sm">
                Ver las 12 lenguas
              </a>
            </div>
            <div className="flex flex-wrap gap-4 mt-6 font-label-sm text-label-sm text-on-surface-variant">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-secondary" /> 3 lenguas vitales
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-tertiary-container" /> 7 en riesgo
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-error" /> 2 en estado crítico
              </span>
            </div>
          </div>
          <div className="lg:col-span-5 bg-surface-container-lowest rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-secondary">fact_check</span>
              <h2 className="font-title-md text-title-md text-primary font-bold">Estado real de la traducción automática</h2>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">{data.research.summary}</p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {data.research.providers.map((p) => (
                <div key={p.name} className="p-2.5 rounded-lg bg-surface-container-low">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-label-sm text-label-sm text-primary font-bold leading-tight">{p.name}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full font-label-sm text-[9px] font-bold whitespace-nowrap ${
                        p.chiapas ? "bg-secondary-container text-on-secondary-container" : "bg-surface-container-highest text-on-surface-variant"
                      }`}
                    >
                      {p.chiapas ? "Parcial" : "No cubre"}
                    </span>
                  </div>
                  <p className="font-label-sm text-[10px] text-outline mt-1 leading-snug">{p.note}</p>
                  <a href={p.url} target="_blank" rel="noreferrer" className="font-label-sm text-[10px] text-secondary hover:underline">
                    Ver fuente ↗
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* LANGUAGES */}
      <section id="lenguas" className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-5">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight">Las lenguas de Chiapas</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Reconocidas por la Constitución Política del Estado (Art. 7). Cifras aproximadas de INEGI 2020 y CELALI.
            </p>
          </div>
          <span className="font-label-sm text-label-sm text-outline">Ordenadas por número de hablantes</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data.languages.map((language) => {
            const status = STATUS[language.status] ?? STATUS.riesgo;
            return (
              <article key={language.code} className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col">
                <div className="h-1.5" style={{ backgroundColor: language.color }} />
                <div className="p-4 flex flex-col gap-2 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-headline-sm text-headline-sm text-primary">{language.name}</h3>
                      <p className="font-label-sm text-label-sm text-secondary">{language.nativeName} · {language.family}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full font-label-sm text-label-sm font-bold ${status.className}`}>
                      {status.label}
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{language.description}</p>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div className="rounded-lg bg-surface-container-low px-2.5 py-1.5">
                      <p className="font-label-sm text-[9px] uppercase tracking-wider text-outline">Hablantes</p>
                      <p className="font-label-md text-label-md text-primary font-bold">{language.speakersLabel}</p>
                    </div>
                    <div className="rounded-lg bg-surface-container-low px-2.5 py-1.5">
                      <p className="font-label-sm text-[9px] uppercase tracking-wider text-outline">Región</p>
                      <p className="font-label-sm text-label-sm text-primary font-semibold leading-tight">{language.region}</p>
                    </div>
                  </div>
                  <p className="font-label-sm text-label-sm text-outline flex items-start gap-1">
                    <span className="material-symbols-outlined text-xs mt-0.5 text-secondary">location_on</span>
                    {language.municipalities}
                  </p>
                  <div className="mt-auto pt-2 border-t border-line flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => askForMessage(language)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm"
                    >
                      <span className="material-symbols-outlined text-sm">translate</span>
                      Pedir intérprete
                    </button>
                    {language.resources.slice(0, 1).map((resource) => (
                      <a
                        key={resource.url}
                        href={resource.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-label-sm text-label-sm text-secondary hover:underline"
                      >
                        {resource.label.split(" · ")[0]} ↗
                      </a>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* TRANSLATOR */}
      <section id="traductor" className="max-w-7xl mx-auto px-4 lg:px-8 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-surface-container-lowest rounded-2xl shadow-sm p-5 lg:p-6">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
              <div>
                <h2 className="font-headline-md text-headline-md text-primary">Traductor comunitario</h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Traducción automática cuando existe; intérprete humano cuando no.
                </p>
              </div>
              <div className="flex items-center bg-surface-container-low rounded-lg p-1">
                <button
                  onClick={() => setTab("interprete")}
                  className={`px-3 py-1.5 rounded-md font-label-sm text-label-sm transition-colors ${
                    tab === "interprete" ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm align-text-bottom mr-1">support_agent</span>
                  Intérprete
                </button>
                <button
                  onClick={() => setTab("automatico")}
                  className={`px-3 py-1.5 rounded-md font-label-sm text-label-sm transition-colors ${
                    tab === "automatico" ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm align-text-bottom mr-1">translate</span>
                  Automático (beta)
                </button>
              </div>
            </div>

            {tab === "automatico" ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-label-sm font-label-sm text-on-surface-variant">
                  <span className="px-2 py-1 rounded bg-surface-container-low">Español</span>
                  <span className="material-symbols-outlined text-base text-secondary">arrow_forward</span>
                  <select
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    className="px-2 py-1.5 rounded-lg bg-surface-container-low font-label-sm text-label-sm text-primary focus:outline-none"
                  >
                    {data.languages.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.name} ({l.nativeName})
                      </option>
                    ))}
                  </select>
                </div>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={5}
                  placeholder="Escribe en español: “¿Cuánto cuesta el café tostado y hacen envíos a Tuxtla?”"
                  className="w-full px-3 py-2.5 rounded-xl bg-surface-container-low font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary resize-none"
                />
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-label-sm text-[10px] text-outline">
                    {data.automatic.available
                      ? data.automatic.message
                      : "Sin proveedor automático: Google y Microsoft solo traducen maya yucateco; NLLB-200 no incluye estas lenguas."}
                  </span>
                  <button
                    onClick={translate}
                    disabled={translating || !text.trim()}
                    className="px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md disabled:opacity-50"
                  >
                    {translating ? "Traduciendo…" : "Traducir"}
                  </button>
                </div>

                {translation && (
                  <div className="rounded-xl bg-secondary-container/30 border border-secondary/20 p-4">
                    <p className="font-label-sm text-[10px] uppercase tracking-wider text-secondary font-bold">
                      {activeLanguage.name} ·{" "}
                      {translation.provider === "tseltal-memory"
                        ? "memoria tseltal · frase real"
                        : translation.provider.startsWith("madlad")
                          ? "MADLAD-400 · IA abierta"
                          : translation.provider === "hf-tsotsil-experimental"
                            ? "modelo experimental"
                            : "traducción"}
                    </p>
                    <p className="font-body-lg text-body-lg text-primary mt-1">{translation.text}</p>
                    {translation.warning && <p className="font-label-sm text-[10px] text-outline mt-1">{translation.warning}</p>}
                  </div>
                )}

                {reason && (
                  <div className="rounded-xl bg-tertiary-fixed/40 border border-tertiary-container/20 p-4">
                    <div className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-tertiary-container">info</span>
                      <div>
                        <p className="font-label-md text-label-md text-on-surface font-bold">Traducción automática no disponible</p>
                        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{reason}</p>
                        <button onClick={() => setTab("interprete")} className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm">
                          <span className="material-symbols-outlined text-sm">translate</span>
                          Solicitar intérprete comunitario
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {data.automatic.tseltalPhrases ? (
                  <div className="rounded-xl bg-secondary-container/30 p-3 flex items-start gap-2">
                    <span className="material-symbols-outlined text-secondary text-lg">menu_book</span>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">
                      <strong className="text-primary">{data.automatic.tseltalPhrases.toLocaleString("es-MX")} frases tseltal</strong>{" "}
                      verificadas del corpus comunitario. Prueba «¿Cuánto cuesta?», «Buenos días», «Gracias» o «café».
                    </p>
                  </div>
                ) : null}

                {!data.automatic.available && (
                  <div className="rounded-xl bg-surface-container-low p-3 flex items-start gap-2">
                    <span className="material-symbols-outlined text-secondary text-lg">science</span>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">
                      Para habilitar el modelo experimental tsotsil→español configura <code className="px-1 rounded bg-surface-container-high">TRANSLATE_PROVIDER=hf</code> y{" "}
                      <code className="px-1 rounded bg-surface-container-high">HF_TOKEN</code>. Requiere autorización del modelo y revisión humana.
                    </p>
                  </div>
                )}
              </div>
            ) : request ? (
              <div className="rounded-xl bg-secondary-container/30 border border-secondary/20 p-5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-2xl">task_alt</span>
                  <h3 className="font-headline-sm text-headline-sm text-primary">Solicitud registrada</h3>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">{request.message}</p>
                <p className="font-label-md text-label-md text-primary font-bold mt-3">Folio: {request.folio}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <a
                    href={`https://wa.me/${request.contact.whatsapp}?text=${encodeURIComponent(`Hola, solicité un intérprete de ${form.language} con folio ${request.folio}.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-secondary text-on-secondary font-label-sm text-label-sm"
                  >
                    <span className="material-symbols-outlined text-sm">chat</span> Abrir WhatsApp
                  </a>
                  <a href={`tel:${request.contact.phone}`} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-surface-container-low text-primary font-label-sm text-label-sm">
                    <span className="material-symbols-outlined text-sm">call</span> {request.contact.phone}
                  </a>
                  <button onClick={() => setRequest(null)} className="px-3 py-2 font-label-sm text-label-sm text-outline">
                    Nueva solicitud
                  </button>
                </div>
                <p className="font-label-sm text-[10px] text-outline mt-3">
                  Demostración local: la solicitud se guarda en este entorno y no se envía a una persona real.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="rounded-xl bg-surface-container-low p-3 flex items-start gap-2">
                  <span className="material-symbols-outlined text-secondary text-lg">translate</span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Una persona hablante de la lengua revisará tu mensaje y te responderá por WhatsApp. Sin costo para
                    compradores comunitarios.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-label-sm text-label-sm text-on-surface">Tu nombre *</label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Ej. María Pérez"
                      className="mt-1 w-full px-3 py-2.5 rounded-lg bg-surface-container-low font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                    />
                  </div>
                  <div>
                    <label className="font-label-sm text-label-sm text-on-surface">WhatsApp *</label>
                    <input
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="967 123 4567"
                      className="mt-1 w-full px-3 py-2.5 rounded-lg bg-surface-container-low font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-label-sm text-label-sm text-on-surface">Lengua *</label>
                    <select
                      value={form.language}
                      onChange={(e) => setForm({ ...form, language: e.target.value })}
                      className="mt-1 w-full px-3 py-2.5 rounded-lg bg-surface-container-low font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                    >
                      {data.languages.map((l) => (
                        <option key={l.code} value={l.code}>
                          {l.name} · {l.nativeName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-label-sm text-label-sm text-on-surface">Cómo prefieres la respuesta</label>
                    <select
                      value={form.channel}
                      onChange={(e) => setForm({ ...form, channel: e.target.value })}
                      className="mt-1 w-full px-3 py-2.5 rounded-lg bg-surface-container-low font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                    >
                      <option value="whatsapp">WhatsApp</option>
                      <option value="llamada">Llamada telefónica</option>
                      <option value="email">Correo electrónico</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="font-label-sm text-label-sm text-on-surface">Mensaje o acuerdo a traducir *</label>
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    rows={3}
                    placeholder="Ej. Quiero confirmar 2 kg de café molido para prensa francesa y envío a Tuxtla Gutiérrez."
                    className="mt-1 w-full px-3 py-2.5 rounded-lg bg-surface-container-low font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-secondary resize-none"
                  />
                </div>
                {selectedLanguage && (
                  <p className="font-label-sm text-[10px] text-secondary">
                    Lengua preseleccionada desde el directorio: {data.languages.find((l) => l.code === selectedLanguage)?.name}
                  </p>
                )}
                {error && <p className="px-3 py-2 rounded-lg bg-error-container text-on-error-container font-label-sm text-label-sm">{error}</p>}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-label-sm text-[10px] text-outline">
                    {data.human.hours} · {data.human.phone}
                  </span>
                  <button
                    onClick={requestInterpreter}
                    disabled={sending}
                    className="px-4 py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md disabled:opacity-50"
                  >
                    {sending ? "Registrando…" : "Solicitar intérprete comunitario"}
                  </button>
                </div>
              </div>
            )}
          </div>

          <aside className="lg:col-span-5 flex flex-col gap-4">
            <div className="bg-primary text-on-primary rounded-2xl p-5">
              <h3 className="font-headline-sm text-headline-sm">¿Por qué no hay un “Google Translate” de tsotsil?</h3>
              <ul className="mt-3 space-y-2 font-body-sm text-body-sm text-primary-fixed">
                <li className="flex gap-2">
                  <span className="material-symbols-outlined text-secondary-fixed text-base">close</span>
                  Google Cloud Translation y Microsoft Translator solo incorporan <strong>maya yucateco</strong>.
                </li>
                <li className="flex gap-2">
                  <span className="material-symbols-outlined text-secondary-fixed text-base">close</span>
                  NLLB-200 de Meta no incluye tsotsil, tseltal, ch'ol, tojolabal ni zoque en sus 200 lenguas.
                </li>
                <li className="flex gap-2">
                  <span className="material-symbols-outlined text-secondary-fixed text-base">science</span>
                  Existe un modelo experimental tsotsil→español en Hugging Face, con acceso restringido y sin evaluación pública.
                </li>
                <li className="flex gap-2">
                  <span className="material-symbols-outlined text-secondary-fixed text-base">check_circle</span>
                  La alternativa responsable es la <strong>traducción humana comunitaria</strong> y los diccionarios especializados.
                </li>
              </ul>
            </div>

            <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm">
              <h3 className="font-title-md text-title-md text-primary font-bold">Recursos y diccionarios</h3>
              <div className="mt-3 space-y-2">
                {[
                  { label: "DITSEL · Diccionario Tseltal en línea", url: "https://ditsel.aldelim.org", note: "8,109 entradas y audios" },
                  { label: "Glosbe · Tsotsil–Español", url: "https://es.glosbe.com/tzo/es", note: "Diccionario colaborativo" },
                  { label: "INALI · Atlas de las Lenguas", url: "https://atlas.inali.gob.mx/agrupaciones/mapa", note: "Información oficial" },
                  { label: "CELALI Chiapas", url: "https://www.celali.gob.mx", note: "Centro Estatal de Lenguas" },
                  { label: "Maya Bridge", url: "https://www.mayabridge.org", note: "Red de intérpretes mayas" },
                ].map((r) => (
                  <a key={r.url} href={r.url} target="_blank" rel="noreferrer" className="flex items-start justify-between gap-2 p-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors">
                    <div>
                      <p className="font-label-md text-label-md text-primary">{r.label}</p>
                      <p className="font-label-sm text-[10px] text-outline">{r.note}</p>
                    </div>
                    <span className="material-symbols-outlined text-sm text-secondary">open_in_new</span>
                  </a>
                ))}
              </div>
            </div>

            <div className="bg-secondary-container/40 rounded-2xl p-4">
              <p className="font-label-md text-label-md text-on-secondary-container font-bold">Atención en lenguas maternas</p>
              <p className="font-body-sm text-body-sm text-on-secondary-fixed-variant mt-1">
                Para compras, entregas y dudas sobre pedidos. También puedes escribir desde la mensajería directa y pedir
                traducción en cualquier conversación.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Link href="/mensajes" className="px-3 py-1.5 rounded-lg bg-surface-container-lowest text-primary font-label-sm text-label-sm">
                  Ir a mensajes
                </Link>
                <a href={`https://wa.me/${data.human.whatsapp}`} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-lg bg-secondary text-on-secondary font-label-sm text-label-sm">
                  WhatsApp comunitario
                </a>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 lg:px-8 pb-14">
        <div className="bg-surface-container-low rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <p className="font-body-sm text-body-sm text-on-surface-variant max-w-3xl">
            <strong className="text-primary">Fuentes y transparencia:</strong> Constitución de Chiapas (Art. 7), INEGI 2020,
            CELALI, INALI, Google Cloud Translation, Microsoft Translator, Meta NLLB-200, Hugging Face y diccionarios
            académicos. Las cifras son aproximadas y las traducciones humanas deben ser revisadas por hablantes de cada
            variante.
          </p>
          <Link href="/marketplace" className="px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md whitespace-nowrap">
            Explorar el mercado
          </Link>
        </div>
      </section>
    </div>
  );
}
