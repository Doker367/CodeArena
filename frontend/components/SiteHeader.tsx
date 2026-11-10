"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useCart } from "./CartProvider";
import { LogoWordmark } from "./Logo";

const NAV = [
  { href: "/", label: "Inicio", paths: ["/"] },
  { href: "/mapa", label: "Explorar Negocios", paths: ["/mapa", "/negocio"] },
  { href: "/mapa", label: "Mapa de Chiapas", paths: ["/mapa"] },
  { href: "/marketplace", label: "Marketplace", paths: ["/marketplace"] },
  { href: "/como-funciona", label: "Cómo Funciona", paths: ["/como-funciona"] },
  { href: "/productores", label: "Productores Verificados", paths: ["/productores"] },
];

type Me = { id: number; name: string; role: string; producer_id: number | null } | null;

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { cart } = useCart();
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("all");
  const [me, setMe] = useState<Me>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setMe(d.user ?? null))
      .catch(() => setMe(null));
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

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(27,56,43,0.06)]">
      <div className="bg-primary text-on-primary py-1 px-4 text-center">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-space-xs font-label-sm text-label-sm text-primary-fixed">
          <span className="material-symbols-outlined text-sm text-secondary-fixed">verified</span>
          <span>100% Sin intermediarios: Tu compra apoya directamente a familias artesanas y productoras de Chiapas</span>
        </div>
      </div>

      <div className="h-28 max-w-7xl mx-auto px-4 lg:px-8 flex flex-col justify-between py-2">
        <div className="flex items-center justify-between gap-space-md">
          <Link href="/" className="flex items-center gap-space-sm shrink-0" aria-label="Origen Chiapas, inicio">
            <LogoWordmark />
            <span className="hidden xl:flex flex-col border-l border-outline-variant/60 pl-space-sm ml-space-xs">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-widest">Mercado digital</span>
              <span className="font-label-sm text-label-sm text-secondary">Comercio justo</span>
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
              placeholder="Buscar café de altura, ámbar de Simojovel, textiles de Zinacantán, negocios..."
              type="search"
              aria-label="Buscar productos y negocios"
            />
            <div className="hidden lg:flex items-center gap-1 bg-surface-container-low px-2 py-1 rounded text-outline hover:text-on-surface cursor-pointer">
              <span className="material-symbols-outlined text-sm text-secondary">location_on</span>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="bg-transparent font-label-sm text-label-sm text-on-surface cursor-pointer focus:outline-none"
                aria-label="Filtrar por municipio"
              >
                <option value="all">Todo Chiapas</option>
                <option value="sancristobal">San Cristóbal de Las Casas</option>
                <option value="tuxtla">Tuxtla Gutiérrez</option>
                <option value="palenque">Palenque</option>
                <option value="comitan">Comitán de Domínguez</option>
                <option value="tapachula">Tapachula</option>
                <option value="chiapa">Chiapa de Corzo</option>
              </select>
            </div>
          </form>

          <div className="flex items-center gap-space-md">
            <Link
              href="/acceso?rol=productor"
              className="hidden sm:inline-flex items-center px-space-md py-2 rounded-lg bg-tertiary-container text-on-tertiary font-label-md text-label-md hover:bg-tertiary transition-colors shadow-sm"
            >
              Vender / Registrar negocio gratis
            </Link>
            <Link
              href="/carrito"
              className="relative p-2 text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center"
              aria-label={`Carrito, ${cart.count} artículos`}
            >
              <span className="material-symbols-outlined">shopping_basket</span>
              <span className="absolute top-1 right-1 bg-secondary text-on-secondary font-label-sm text-label-sm rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                {cart.count}
              </span>
            </Link>
            <div className="flex items-center gap-space-sm pl-space-xs relative">
              <Link
                href={me ? (me.producer_id ? "/panel" : "/mensajes") : "/acceso"}
                aria-label={me ? "Mi cuenta" : "Iniciar sesión"}
                className="shrink-0"
              >
                <Image
                  src="/img/img-01.jpg"
                  alt="Perfil de tu cuenta"
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full object-cover"
                />
              </Link>
              {me ? (
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="hidden lg:inline font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors"
                >
                  {me.name.split(" ")[0]}
                </button>
              ) : (
                <Link
                  href="/acceso"
                  className="hidden lg:inline font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors"
                >
                  Mi Cuenta
                </Link>
              )}
              {menuOpen && me && (
                <div className="absolute right-0 top-10 w-52 bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant/40 p-2 animate-pop-in">
                  <p className="px-3 py-2 font-label-sm text-label-sm text-outline truncate">{me.name}</p>
                  {me.producer_id && (
                    <Link href="/panel" className="block px-3 py-2 rounded-lg hover:bg-surface-container-low font-label-md text-label-md">
                      Panel del emprendedor
                    </Link>
                  )}
                  <Link href="/mensajes" className="block px-3 py-2 rounded-lg hover:bg-surface-container-low font-label-md text-label-md">
                    Mensajes directos
                  </Link>
                  <Link href="/carrito" className="block px-3 py-2 rounded-lg hover:bg-surface-container-low font-label-md text-label-md">
                    Mi carrito
                  </Link>
                  <button
                    onClick={logout}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-container-low font-label-md text-label-md text-error"
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <nav className="flex items-center gap-space-md overflow-x-auto no-scrollbar py-1" aria-label="Navegación principal">
          {NAV.map((item) => {
            const active =
              item.label === "Explorar Negocios"
                ? pathname.startsWith("/negocio") || pathname.startsWith("/negocios")
                : item.label === "Mapa de Chiapas"
                  ? pathname === "/mapa"
                  : item.label === "Inicio"
                    ? pathname === "/"
                    : item.label === "Marketplace"
                      ? pathname.startsWith("/marketplace")
                      : pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`font-label-md text-label-md px-3 py-1 rounded-lg transition-colors whitespace-nowrap ${
                  active
                    ? "bg-secondary-container text-on-secondary-container font-bold"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <span className="ml-auto hidden lg:flex items-center gap-1.5 font-label-sm text-label-sm text-secondary whitespace-nowrap pr-1">
            <span className="material-symbols-outlined text-base">local_florist</span>
            15 regiones socioeconómicas
          </span>
        </nav>
      </div>
    </header>
  );
}
