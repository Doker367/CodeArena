"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "./Logo";
import { useI18n } from "./I18nProvider";
import { LANGS } from "@/lib/i18n";

const ROLES = [
  {
    key: "comprador",
    icon: "shopping_bag",
    title: "Comprador",
    sub: "Quiero comprar café, textiles y apoyar sin intermediarios.",
  },
  {
    key: "productor",
    icon: "agriculture",
    title: "Productor",
    sub: "Elaboro café, textiles, de telar, ámbar o alimentos.",
  },
  {
    key: "eco",
    icon: "eco",
    title: "Ecoturismo / Oficio",
    sub: "Ofrezco recorridos comunitarios, talleres o transporte.",
  },
];

const BENEFITS: Record<string, { title: string; sub: string }[]> = {
  comprador: [
    { title: "Chat Directo con Creadores", sub: "Pregunta por origen, cosechas y pide pedidos a la medida sin barreras." },
    { title: "Rastreo de Origen Certificado", sub: "Conoce la comunidad exacta y la cooperativa detrás de cada café, miel o textil." },
  ],
  productor: [
    { title: "Tu tienda sin comisiones", sub: "Publica tu catálogo y recibe pedidos directo por WhatsApp y mensajería." },
    { title: "Panel y catálogo propio", sub: "Administra precios, stock, pedidos y preguntas desde un solo lugar." },
  ],
  eco: [
    { title: "Recorridos con identidad", sub: "Ofrece experiencias comunitarias y talleres con trazabilidad cultural." },
    { title: "Visitantes conscientes", sub: "Conecta con viajeros que buscan turismo justo en Chiapas." },
  ],
};

export function AuthClient({ initialRole, next }: { initialRole?: string; next?: string }) {
  const router = useRouter();
  const { t, lang, setLang } = useI18n();
  const [tab, setTab] = useState<"crear" | "entrar">("crear");
  const [role, setRole] = useState(
    initialRole === "productor" || initialRole === "eco" ? initialRole : "comprador",
  );
  const [form, setForm] = useState({ name: "", contact: "", password: "" });
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    if (!form.contact.trim() || !form.password) {
      setError("Ingresa tus datos de contacto y contraseña.");
      return;
    }
    if (tab === "crear" && !form.name.trim()) {
      setError("Ingresa tu nombre y apellidos.");
      return;
    }
    if (tab === "crear" && !accepted) {
      setError("Acepta los Términos de Comercio Justo para continuar.");
      return;
    }
    setLoading(true);
    try {
      const isEmail = form.contact.includes("@");
      if (tab === "entrar") {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            identifier: form.contact,
            password: form.password,
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          setError(data.error ?? "No pudimos iniciar sesión.");
          return;
        }
        router.push(next || (data.user?.producer_id ? "/panel" : "/marketplace"));
        router.refresh();
      } else {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            email: isEmail ? form.contact : `${form.contact.replace(/\D/g, "")}@whatsapp.origenchiapas.mx`,
            phone: form.contact,
            password: form.password,
            role,
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          setError(data.error ?? "No pudimos crear tu cuenta.");
          return;
        }
        router.push(next || (role === "productor" ? "/panel" : "/marketplace"));
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  const loginDemo = async () => {
    setTab("entrar");
    setForm({ name: "", contact: "margarito@origenchiapas.mx", password: "demo1234" });
    setError("");
  };

  const submitLabel =
    tab === "crear"
      ? role === "productor"
        ? "Registrar mi emprendimiento"
        : role === "eco"
          ? "Registrarme como Ecoturismo"
          : "Registrarme como Comprador Consciente"
      : "Entrar a Origen Chiapas";

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-surface-container-lowest/80 backdrop-blur-md border-b border-line">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="h-9 w-9" />
            <div className="flex flex-col leading-none">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold tracking-tight text-primary text-lg">ORIGEN CHIAPAS</span>
                <span className="hidden sm:inline px-1.5 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-[10px] tracking-wider">
                  OFICIAL
                </span>
              </div>
              <span className="hidden sm:block font-label-sm text-label-sm text-outline mt-1">Comercio Directo &amp; Soberanía Comunitaria</span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as typeof lang)}
              className="px-2 py-1.5 rounded-lg bg-surface-container-low font-label-sm text-label-sm text-primary focus:outline-none"
              aria-label="Idioma"
            >
              {LANGS.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                </option>
              ))}
            </select>
            <Link href="/marketplace" className="inline-flex items-center gap-1 font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors whitespace-nowrap">
              <span className="material-symbols-outlined text-base">arrow_back</span>
              <span className="hidden sm:inline">{t("common.backHome")}</span>
              <span className="sm:hidden">Inicio</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <aside className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-surface-container-low rounded-2xl p-5">
            <div className="flex flex-col gap-2 items-start mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-lowest font-label-sm text-label-sm text-primary shadow-sm">
                <span className="material-symbols-outlined text-sm text-secondary">where_to_vote</span> 124 Municipios Conectados
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container font-label-sm text-label-sm text-on-secondary-container">
                <span className="material-symbols-outlined text-sm">savings</span> 0% Comisiones Abusivas
              </span>
            </div>
            <div className="relative w-full h-56 rounded-xl overflow-hidden">
              <Image src="/img/img-52.jpg" alt="Mujer tejedora tzotzil trabajando en telar de cintura en Chiapas" fill sizes="(max-width: 1024px) 100vw, 480px" className="object-cover" priority />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/20 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 text-on-primary">
                <p className="font-label-sm text-[10px] tracking-widest uppercase text-primary-fixed-dim">Identidad Territorial</p>
                <p className="font-headline-sm text-headline-sm font-bold leading-tight">El valor real de la tierra a tus manos</p>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-4 mt-4 shadow-sm">
              <span className="text-tertiary-container font-bold text-2xl leading-none block" aria-hidden="true">“</span>
              <p className="font-body-sm text-body-sm text-on-surface-variant italic mt-1">
                “Cada compra apoya directamente a las familias de Los Altos, la Selva y la Costa. Sin intermediarios que
                encarezcan el esfuerzo de nuestros pueblos.”
              </p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-line">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Consejo Autónomo de Productores</span>
                <span className="font-label-sm text-label-sm text-primary font-semibold">Zinacantán &amp; Tenejapa</span>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Beneficios por perfil:</span>
              <span className="font-label-sm text-label-sm text-secondary capitalize">{role}</span>
            </div>
            <div className="flex flex-col gap-3">
              {(BENEFITS[role] ?? BENEFITS.comprador).map((b) => (
                <div key={b.title} className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-secondary text-lg mt-0.5">forum</span>
                  <div>
                    <p className="font-label-md text-label-md text-primary font-bold">{b.title}</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{b.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Link href="/lenguas" className="bg-surface-container-low rounded-xl p-4 flex items-center gap-3 hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-2xl text-secondary">translate</span>
            <div>
              <p className="font-label-md text-label-md text-primary font-bold">Atención en Lenguas Maternas</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Acompañamiento bilingüe y red de intérpretes: Tsotsil, Tseltal, Ch'ol y más.
              </p>
            </div>
            <span className="material-symbols-outlined text-outline ml-auto">arrow_forward</span>
          </Link>
        </aside>

        <section className="lg:col-span-7 bg-surface-container-lowest rounded-2xl shadow-sm p-6 lg:p-8">
          <div className="flex items-center bg-surface-container-low rounded-xl p-1 w-full max-w-sm ml-auto">
            <button
              onClick={() => setTab("crear")}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg font-label-md text-label-md transition-colors ${
                tab === "crear" ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant"
              }`}
            >
              <span className="material-symbols-outlined text-base">person_add</span> {t("auth.create")}
            </button>
            <button
              onClick={() => setTab("entrar")}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg font-label-md text-label-md transition-colors ${
                tab === "entrar" ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant"
              }`}
            >
              <span className="material-symbols-outlined text-base">login</span> {t("auth.login")}
            </button>
          </div>

          <div className="text-center mt-5">
            <h1 className="font-headline-sm text-headline-sm text-primary">{t("auth.title")}</h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{t("auth.subtitle")}</p>
          </div>

          {tab === "crear" && (
            <div className="mt-5">
              <p className="font-label-md text-label-md text-primary mb-2">{t("auth.role")}:</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {ROLES.map((item) => {
                  const active = role === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => setRole(item.key)}
                      className={`text-left p-3 rounded-xl border transition-colors ${
                        active ? "border-primary bg-surface-container-low" : "border-line bg-surface-container-lowest hover:bg-surface-container-low/60"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`material-symbols-outlined ${active ? "text-secondary" : "text-outline"}`}>{item.icon}</span>
                        <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${active ? "border-primary" : "border-outline"}`}>
                          {active && <span className="w-2 h-2 rounded-full bg-primary" />}
                        </span>
                      </div>
                      <p className="font-label-md text-label-md text-primary mt-2 font-bold">
                        {item.key === "comprador" ? t("auth.buyer") : item.key === "productor" ? t("auth.producer") : t("auth.eco")}
                      </p>
                      <p className="font-body-sm text-[12px] text-on-surface-variant leading-snug mt-0.5">{item.sub}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-5 space-y-3">
            {tab === "crear" && (
              <div>
                <label className="font-label-sm text-label-sm text-on-surface">
                  {t("auth.name")} <span className="text-error">*</span>
                </label>
                <div className="relative mt-1">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-base">person</span>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ej. Rosalba Gómez Gómez"
                    className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-line bg-surface-container-lowest font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
                  />
                </div>
              </div>
            )}
            <div>
              <div className="flex items-center justify-between">
                <label className="font-label-sm text-label-sm text-on-surface">
                  {t("auth.contact")} <span className="text-error">*</span>
                </label>
                {tab === "crear" && (
                  <span className="inline-flex items-center gap-1 font-label-sm text-[11px] text-secondary">
                    <span className="material-symbols-outlined text-sm">chat</span> Acepta WhatsApp
                  </span>
                )}
              </div>
              <div className="relative mt-1">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-base">phone_iphone</span>
                <input
                  value={form.contact}
                  onChange={(e) => setForm({ ...form, contact: e.target.value })}
                  placeholder="Ej. 967 123 4567 o tu@correo.com"
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-line bg-surface-container-lowest font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
                />
              </div>
            </div>
            <div>
              <label className="font-label-sm text-label-sm text-on-surface">
                {t("auth.password")} <span className="text-error">*</span>
              </label>
              <div className="relative mt-1">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-base">lock</span>
                <input
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-line bg-surface-container-lowest font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
                />
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline text-base">visibility</span>
              </div>
            </div>
          </div>

          {tab === "crear" && (
            <label className="flex items-start gap-2 mt-4 cursor-pointer">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-secondary"
              />
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                <span className="material-symbols-outlined text-secondary text-sm align-text-bottom">check_circle</span>{" "}
                {t("auth.accept")}
              </span>
            </label>
          )}

          {error && (
            <p className="mt-3 px-3 py-2 rounded-lg bg-error-container text-on-error-container font-label-sm text-label-sm">{error}</p>
          )}

          <button
            onClick={submit}
            disabled={loading}
            className="w-full mt-4 py-3 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-bold hover:bg-primary-container transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-base">{tab === "entrar" ? "login" : "how_to_reg"}</span>
            {loading ? "…" : tab === "entrar" ? t("auth.submitLogin") : submitLabel}
          </button>

          <div className="flex items-center gap-3 my-4">
            <span className="flex-1 h-px bg-line" />
            <span className="font-label-sm text-[10px] text-outline uppercase tracking-wider">O ingresa de forma sencilla con</span>
            <span className="flex-1 h-px bg-line" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setTab("entrar");
                setForm({ ...form, contact: "alejandra@ejemplo.com", password: "demo1234" });
              }}
              className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-secondary-container/50 text-on-secondary-container font-label-md text-label-md hover:bg-secondary-container transition-colors"
            >
              <span className="material-symbols-outlined text-base">chat</span> Código por WhatsApp
            </button>
            <button
              onClick={loginDemo}
              className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-surface-container-low text-on-surface font-label-md text-label-md hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-base">account_circle</span> {t("auth.demo")}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mt-5 pt-4 border-t border-line">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-secondary text-lg">support_agent</span>
              <div>
                <p className="font-label-sm text-label-sm text-on-surface">{t("auth.support")}</p>
                <p className="font-body-sm text-[12px] text-on-surface-variant">
                  Llama sin costo o manda mensaje a promotores comunitarios.
                </p>
              </div>
            </div>
            <a
              href="tel:8002442727"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary-container text-on-secondary-container font-label-md text-label-md font-bold"
            >
              800 244 2727 <span className="material-symbols-outlined text-sm">call</span>
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
