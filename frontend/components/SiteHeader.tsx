"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useCart } from "./CartProvider";
import { useI18n } from "./I18nProvider";
import { LogoWordmark } from "./Logo";
import { LANGS } from "@/lib/i18n";

const NAV = [
  { href: "/", key: "nav.home" },
  { href: "/mapa", key: "nav.explore" },
  { href: "/mapa", key: "nav.map" },
  { href: "/marketplace", key: "nav.market" },
  { href: "/como-funciona", key: "nav.how" },
  { href: "/productores", key: "nav.producers" },
  { href: "/lenguas", key: "nav.languages" },
];

type Me = { id: number; name: string; role: string; producer_id: number | null } | null;

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { cart } = useCart();
  const { lang, meta, setLang, t } = useI18n();
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("all");
  const [me, setMe] = useState<Me>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setMe(d.user ?? null))
      .catch(() => setMe(null));
  }, [pathname]);

  useEffect(() => {
    let alive = true;
    const load = () => {
      fetch("/api/messages/unread", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => alive && setUnread(Number(d.unread) || 0))
        .catch(() => {});
    };
    load();
    const timer = window.setInterval(load, 25000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [pathname]);

  useEffect(() => {
    setMenuOpen(false);
    setLangOpen(false);
  }, [pathname]);

  const search = (event: FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (location !== "all") params.set("region", location);
    router.push(`/marketplace${params.size ? `?${params}` : ""}`);
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setMe(null);
    setMenuOpen(false);
    router.push("/acceso");
    router.refresh();
  };

  const activeKey = (() => {
    if (pathname === "/") return "nav.home";
    if (pathname.startsWith("/negocio")) return "nav.explore";
    if (pathname === "/mapa") return "nav.map";
    if (pathname.startsWith("/marketplace")) return "nav.market";
    if (pathname.startsWith("/como-funciona")) return "nav.how";
    if (pathname.startsWith("/productores")) return "nav.producers";
    if (pathname.startsWith("/lenguas")) return "nav.languages";
    return "";
  })();

  const isProducer = me?.role === "productor";
  const isEco = me?.role === "eco";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(27,56,43,0.06)]">
      <div className="bg-primary text-on-primary py-1 px-4 text-center">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-space-xs font-label-sm text-label-sm text-primary-fixed">
          <span className="material-symbols-outlined text-sm text-secondary-fixed">verified</span>
          <span>{t("header.topbar")}</span>
        </div>
      </div>

      <div className="h-28 max-w-7xl mx-auto px-4 lg:px-8 flex flex-col justify-between py-2">
        <div className="flex items-center justify-between gap-space-md">
          <Link href="/" className="flex items-center gap-space-sm shrink-0" aria-label="Origen Chiapas">
            <LogoWordmark />
            <span className="hidden 2xl:flex flex-col border-l border-outline-variant/60 pl-space-sm ml-space-xs">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-widest">{t("header.marketLabel")}</span>
              <span className="font-label-sm text-label-sm text-secondary">{t("header.community")}</span>
            </span>
          </Link>

          <form
            onSubmit={search}
            className="hidden md:flex flex-1 max-w-xl mx-space-md items-center gap-space-xs bg-surface-container-lowest px-space-md py-1.5 rounded-lg shadow-[0_1px_3px_rgba(27,56,43,0.04)]"
            role="search"
          >
            <span className="material-symbols-outlined text-outline text-lg">search</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none"
              placeholder={t("header.search")}
              type="search"
              aria-label={t("header.search")}
            />
            <div className="hidden lg:flex items-center gap-1 bg-surface-container-low px-2 py-1 rounded text-outline hover:text-on-surface cursor-pointer">
              <span className="material-symbols-outlined text-sm text-secondary">location_on</span>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="bg-transparent font-label-sm text-label-sm text-on-surface cursor-pointer focus:outline-none"
                aria-label={t("nav.map")}
              >
                <option value="all">{t("header.allChiapas")}</option>
                <option value="sancristobal">San Cristóbal de Las Casas</option>
                <option value="tuxtla">Tuxtla Gutiérrez</option>
                <option value="palenque">Palenque</option>
                <option value="comitan">Comitán de Domínguez</option>
                <option value="tapachula">Tapachula</option>
                <option value="chiapa">Chiapa de Corzo</option>
              </select>
            </div>
          </form>

          <div className="flex items-center gap-2 sm:gap-space-md">
            <Link
              href="/acceso?rol=productor"
              className="hidden sm:inline-flex items-center px-space-md py-2 rounded-lg bg-tertiary-container text-on-tertiary font-label-md text-label-md hover:bg-tertiary transition-colors shadow-sm whitespace-nowrap"
            >
              <span className="hidden 2xl:inline">{t("header.sell")}</span>
              <span className="2xl:hidden">Vender</span>
            </Link>

            <div className="relative">
              <button
                onClick={() => setLangOpen((v) => !v)}
                className="flex items-center gap-1 px-2 py-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
                aria-label={t("header.language")}
                title={t("header.language")}
              >
                <span className="material-symbols-outlined">translate</span>
                <span className="hidden sm:inline font-label-sm text-label-sm font-bold">{meta.short}</span>
                {meta.beta && <span className="w-1.5 h-1.5 rounded-full bg-tertiary-container" />}
              </button>
              {langOpen && (
                <div className="absolute right-0 top-11 w-60 bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant/40 p-2 animate-pop-in z-50">
                  <p className="px-3 py-1.5 font-label-sm text-[10px] uppercase tracking-wider text-outline">{t("header.language")}</p>
                  {LANGS.map((option) => (
                    <button
                      key={option.code}
                      onClick={() => {
                        setLang(option.code);
                        setLangOpen(false);
                      }}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg hover:bg-surface-container-low font-label-md text-label-md ${
                        lang === option.code ? "text-primary font-bold" : "text-on-surface-variant"
                      }`}
                    >
                      <span className="flex flex-col text-left">
                        <span>{option.label}</span>
                        <span className="font-label-sm text-[10px] text-outline">{option.native}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        {option.beta && (
                          <span className="px-1.5 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-[9px] font-bold">BETA</span>
                        )}
                        {lang === option.code && <span className="material-symbols-outlined text-sm text-secondary">check</span>}
                      </span>
                    </button>
                  ))}
                  <Link href="/lenguas" className="block px-3 py-2 mt-1 border-t border-line font-label-sm text-label-sm text-secondary hover:underline">
                    {t("menu.languages")} →
                  </Link>
                </div>
              )}
            </div>

            <Link
              href="/mensajes"
              className="relative p-2 text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center"
              aria-label={t("header.messages")}
              title={t("header.messages")}
            >
              <span className="material-symbols-outlined">forum</span>
              {unread > 0 && (
                <span className="absolute top-1 right-0.5 bg-tertiary-container text-on-tertiary font-label-sm text-label-sm rounded-full min-w-4 h-4 px-1 flex items-center justify-center text-[10px]">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
            <Link
              href="/carrito"
              className="relative p-2 text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center"
              aria-label={`${t("header.cart")}, ${cart.count}`}
              title={t("header.cart")}
            >
              <span className="material-symbols-outlined">shopping_basket</span>
              <span className="absolute top-1 right-1 bg-secondary text-on-secondary font-label-sm text-label-sm rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                {cart.count}
              </span>
            </Link>

            <div className="flex items-center gap-space-sm pl-space-xs relative">
              <Link
                href={me ? "/cuenta" : "/acceso"}
                aria-label={me ? t("header.account") : t("header.login")}
                className="shrink-0"
              >
                <Image
                  src="/img/img-01.jpg"
                  alt={me ? t("header.account") : t("header.login")}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full object-cover"
                />
              </Link>

              {me ? (
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="hidden lg:inline-flex items-center gap-1 font-label-md text-label-md text-primary font-semibold hover:text-secondary transition-colors"
                >
                  {me.name.split(" ")[0]}
                  <span className="material-symbols-outlined text-base">expand_more</span>
                </button>
              ) : (
                <Link
                  href="/acceso"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-surface-tint transition-colors"
                >
                  <span className="material-symbols-outlined text-base">login</span>
                  {t("header.login")}
                </Link>
              )}

              {menuOpen && me && (
                <div className="absolute right-0 top-10 w-64 bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant/40 p-2 animate-pop-in z-50">
                  <div className="px-3 py-2 border-b border-line mb-1">
                    <p className="font-label-md text-label-md text-primary font-bold truncate">{me.name}</p>
                    <p className="font-label-sm text-label-sm text-secondary">
                      {isProducer ? t("menu.producer") : isEco ? t("menu.eco") : t("menu.buyer")}
                    </p>
                  </div>

                  {isProducer ? (
                    <>
                      <Link href="/panel" className="menu-item">{t("menu.panel")}</Link>
                      <Link href="/panel#catalogo" className="menu-item">{t("menu.catalog")}</Link>
                      <Link href="/panel#pedidos" className="menu-item">{t("menu.sellerOrders")}</Link>
                    </>
                  ) : (
                    <>
                      <Link href="/cuenta" className="menu-item">{t("menu.profile")}</Link>
                      <Link href="/pedidos" className="menu-item">{t("menu.orders")}</Link>
                      <Link href="/cuenta#favoritos" className="menu-item">{t("menu.favorites")}</Link>
                    </>
                  )}
                  <Link href="/mensajes" className="menu-item">{t("menu.messages")}</Link>
                  <Link href="/lenguas" className="menu-item">{t("menu.languages")}</Link>
                  {isProducer && <Link href="/cuenta" className="menu-item">{t("header.account")}</Link>}
                  <button
                    onClick={logout}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-container-low font-label-md text-label-md text-error flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base">logout</span>
                    {t("header.logout")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <nav className="flex items-center gap-space-md overflow-x-auto no-scrollbar py-1" aria-label="Navegación principal">
          {NAV.map((item) => {
            const active = activeKey === item.key;
            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`font-label-md text-label-md px-3 py-1 rounded-lg transition-colors whitespace-nowrap ${
                  active
                    ? "bg-secondary-container text-on-secondary-container font-bold"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {t(item.key)}
              </Link>
            );
          })}
          <span className="ml-auto hidden lg:flex items-center gap-1.5 font-label-sm text-label-sm text-secondary whitespace-nowrap pr-1">
            <span className="material-symbols-outlined text-base">local_florist</span>
            {t("header.regions")}
          </span>
        </nav>
      </div>
    </header>
  );
}
