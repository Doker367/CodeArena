"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "./I18nProvider";
import { LANGS } from "@/lib/i18n";

type Me = { id: number; name: string; email: string; phone: string; role: string; producer_id: number | null };

export function AccountClient({ user }: { user: Me }) {
  const { lang, setLang, t, meta } = useI18n();
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/acceso");
    router.refresh();
  };

  const roleLabel =
    user.role === "productor" ? t("menu.producer") : user.role === "eco" ? t("menu.eco") : t("menu.buyer");

  return (
    <div className="w-full max-w-5xl mx-auto px-4 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">{t("account.title")}</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">{t("account.subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {user.producer_id ? (
            <Link href="/panel" className="px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md">
              {t("account.panel")}
            </Link>
          ) : (
            <Link href="/pedidos" className="px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md">
              {t("account.orders")}
            </Link>
          )}
          <button
            onClick={logout}
            className="px-4 py-2 rounded-lg bg-surface-container-low text-error font-label-md text-label-md hover:bg-error-container transition-colors"
          >
            {t("account.logout")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <section className="lg:col-span-5 bg-surface-container-lowest rounded-2xl p-5 shadow-sm">
          <h2 className="font-title-md text-title-md text-primary font-bold mb-3">{t("account.profile")}</h2>
          <div className="flex items-center gap-3">
            <span className="w-14 h-14 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-headline-sm text-headline-sm font-bold">
              {user.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
            </span>
            <div>
              <p className="font-headline-sm text-headline-sm text-primary">{user.name}</p>
              <p className="font-label-sm text-label-sm text-secondary">{roleLabel}</p>
            </div>
          </div>
          <dl className="mt-4 space-y-2 font-body-sm text-body-sm">
            <div className="flex items-center justify-between gap-3 py-2 border-t border-line">
              <dt className="text-outline">{t("auth.contact")}</dt>
              <dd className="text-primary font-semibold truncate">{user.email}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 py-2 border-t border-line">
              <dt className="text-outline">WhatsApp</dt>
              <dd className="text-primary font-semibold">{user.phone || "—"}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 py-2 border-t border-line">
              <dt className="text-outline">{t("account.role")}</dt>
              <dd className="text-primary font-semibold">{roleLabel}</dd>
            </div>
          </dl>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link href="/mensajes" className="px-3 py-2 rounded-lg bg-surface-container-low text-primary font-label-sm text-label-sm text-center">
              {t("menu.messages")}
            </Link>
            <Link href="/lenguas" className="px-3 py-2 rounded-lg bg-surface-container-low text-primary font-label-sm text-label-sm text-center">
              {t("menu.languages")}
            </Link>
          </div>
        </section>

        <section className="lg:col-span-7 bg-surface-container-lowest rounded-2xl p-5 shadow-sm">
          <h2 className="font-title-md text-title-md text-primary font-bold">{t("account.language")}</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{t("account.languageSub")}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
            {LANGS.map((option) => {
              const active = lang === option.code;
              return (
                <button
                  key={option.code}
                  onClick={() => setLang(option.code)}
                  className={`text-left p-3 rounded-xl border transition-colors ${
                    active ? "border-primary bg-surface-container-low" : "border-line hover:bg-surface-container-low/60"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-label-md text-label-md text-primary font-bold">{option.label}</span>
                    <span className="flex items-center gap-1">
                      {option.beta && (
                        <span className="px-1.5 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-[9px] font-bold">BETA</span>
                      )}
                      <span className="w-4 h-4 rounded-full border flex items-center justify-center border-outline">
                        {active && <span className="w-2 h-2 rounded-full bg-primary" />}
                      </span>
                    </span>
                  </div>
                  <p className="font-label-sm text-label-sm text-secondary">{option.native}</p>
                  <p className="font-label-sm text-[10px] text-outline mt-1">{option.coverage}% {t("account.language").toLowerCase()}</p>
                </button>
              );
            })}
          </div>
          {meta.beta && (
            <div className="mt-4 rounded-xl bg-tertiary-fixed/40 px-3 py-2.5">
              <p className="font-label-sm text-label-sm text-on-tertiary-fixed">
                {t("lang.partial", { lang: meta.label })}
              </p>
              <Link href="/lenguas" className="font-label-sm text-label-sm text-secondary font-bold hover:underline">
                {t("lang.help")} →
              </Link>
            </div>
          )}
        </section>

        <section id="favoritos" className="lg:col-span-12 bg-surface-container-low rounded-2xl p-5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">favorite</span>
            <h2 className="font-title-md text-title-md text-primary font-bold">{t("menu.favorites")}</h2>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            Guarda productores y piezas desde sus fichas para encontrarlas aquí. Aún no tienes favoritos.
          </p>
          <Link href="/marketplace" className="inline-flex mt-3 px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md">
            {t("common.shopping")}
          </Link>
        </section>
      </div>
    </div>
  );
}
