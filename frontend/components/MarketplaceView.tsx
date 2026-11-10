"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "./CartProvider";
import { ProductCard } from "./ProductCard";
import { money } from "@/lib/format";
import type { Producer, Product } from "@/lib/types";

type Card = { product: Product; producer: Producer };

const CATEGORIES = [
  { key: "todos", label: "Todos los Productos", icon: "dashboard" },
  { key: "cafe", label: "Café de Altura", icon: "coffee" },
  { key: "ambar", label: "Ámbar Certificado", icon: "save_as" },
  { key: "textil", label: "Textiles & Huipiles", icon: "styler" },
  { key: "miel", label: "Miel Silvestre y Melipona", icon: "eco" },
  { key: "gastronomia", label: "Quesos y Alimentos Tradicionales", icon: "restaurant" },
  { key: "artesania", label: "Alfarería & Barro Negro", icon: "palette" },
];

const MUNICIPALITIES = [
  ["San Cristóbal", 38],
  ["Simojovel", 24],
  ["Zinacantán", 19],
  ["Tapachula", 31],
  ["Ocosingo", 15],
  ["Chiapa de Corzo", 12],
  ["Comitán", 9],
] as const;

export function MarketplaceView({
  cards,
  producers,
  featured,
  initialQuery,
  initialCategory,
  initialMunicipality,
}: {
  cards: Card[];
  producers: Producer[];
  featured: { product: Product; producer: Producer } | null;
  initialQuery: string;
  initialCategory: string;
  initialMunicipality?: string;
}) {
  const router = useRouter();
  const { add } = useCart();
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState("populares");
  const [maxPrice, setMaxPrice] = useState(2800);
  const [municipalities, setMunicipalities] = useState<string[]>(
    initialMunicipality ? [initialMunicipality] : [],
  );
  const [availability, setAvailability] = useState<"todas" | "stock" | "pedido">("todas");
  const [kindFilters, setKindFilters] = useState<string[]>([]);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 6;
  const [size, setSize] = useState("Unitalla (S-M)");
  const [color, setColor] = useState("Orquídeas y Violetas Zinacantán");

  const gallery = featured
    ? [featured.product.image, "/img/img-34.jpg", "/img/img-35.jpg", "/img/img-36.jpg"]
    : [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = cards.filter(({ product, producer }) => {
      if (category !== "todos" && product.category !== category) return false;
      if (product.price > maxPrice) return false;
      if (
        q &&
        !`${product.name} ${product.short} ${product.tags} ${producer.name} ${producer.municipality} ${producer.kind}`
          .toLowerCase()
          .includes(q)
      )
        return false;
      if (municipalities.length) {
        const m = producer.municipality.toLowerCase();
        if (!municipalities.some((sel) => m.includes(sel.toLowerCase()))) return false;
      }
      if (availability === "stock" && product.stock < 1) return false;
      if (availability === "pedido" && !product.tags.toLowerCase().includes("pedido")) return false;
      if (kindFilters.length) {
        const kind = producer.kind.toLowerCase();
        const matches = kindFilters.some((k) =>
          k === "cooperativa"
            ? kind.includes("cooperativa") || kind.includes("colectivo")
            : k === "familia"
              ? kind.includes("familia") || kind.includes("artesanal") || kind.includes("minero")
              : kind.includes("micronegocio") || kind.includes("emprendimiento"),
        );
        if (!matches) return false;
      }
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sort === "precio-asc") return a.product.price - b.product.price;
      if (sort === "precio-desc") return b.product.price - a.product.price;
      if (sort === "rating") return b.product.rating - a.product.rating;
      if (sort === "nuevos") return b.product.id - a.product.id;
      return b.product.review_count - a.product.review_count;
    });
    return list;
  }, [cards, category, query, maxPrice, municipalities, availability, kindFilters, sort]);

  useEffect(() => {
    setPage(1);
  }, [query, category, sort, maxPrice, municipalities, availability, kindFilters]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, filtered.length);

  const reset = () => {
    setCategory("todos");
    setQuery("");
    setMaxPrice(2800);
    setMunicipalities([]);
    setAvailability("todas");
    setKindFilters([]);
    setSort("populares");
  };

  const toggleMunicipality = (name: string) =>
    setMunicipalities((current) =>
      current.includes(name) ? current.filter((m) => m !== name) : [...current, name],
    );

  const toggleKind = (key: string) =>
    setKindFilters((current) =>
      current.includes(key) ? current.filter((k) => k !== key) : [...current, key],
    );

  const buyFeatured = async (goToCart: boolean) => {
    if (!featured) return;
    await add(featured.product.id, 1, `Talla: ${size} · Gama floral: ${color}`);
    if (goToCart) router.push("/carrito");
  };

  return (
    <div className="flex flex-col w-full">
      {/* HEADER + CATEGORY STRIP */}
      <section className="w-full bg-surface-container-low py-space-xl px-4 lg:px-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col gap-space-lg relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm uppercase tracking-wider mb-space-sm">
                <span className="material-symbols-outlined text-sm">handshake</span>
                Comercio Comunitario y Directo
              </div>
              <h1 className="font-display-lg text-display-lg text-primary tracking-tight">Mercado Directo de Chiapas</h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant mt-space-xs">
                Comercio justo sin comisiones de intermediarios. Precios directos de taller, parcela y telar a tu
                hogar.
              </p>
            </div>
            <div className="flex items-center gap-space-md bg-surface-container-lowest p-space-md rounded-xl shadow-sm self-start md:self-auto">
              <div className="flex flex-col text-left">
                <span className="font-headline-sm text-headline-sm text-primary">124</span>
                <span className="font-label-sm text-label-sm text-outline">Municipios Conectados</span>
              </div>
              <div className="w-px h-8 bg-surface-variant" />
              <div className="flex flex-col text-left">
                <span className="font-headline-sm text-headline-sm text-secondary">0%</span>
                <span className="font-label-sm text-label-sm text-outline">Comisión por Venta</span>
              </div>
              <div className="w-px h-8 bg-surface-variant" />
              <div className="flex flex-col text-left">
                <span className="font-headline-sm text-headline-sm text-tertiary-container">100%</span>
                <span className="font-label-sm text-label-sm text-outline">Ingreso al Productor</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md items-center bg-surface-container-lowest p-space-sm rounded-xl shadow-sm">
            <div className="lg:col-span-8 flex items-center gap-space-sm px-space-sm">
              <span className="material-symbols-outlined text-secondary text-2xl">search</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-transparent font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none"
                placeholder="Buscar por técnica, variedad (ej. Typica, Ámbar rojo, telar de pedal) o cooperativa..."
                type="text"
                aria-label="Buscar en el mercado"
              />
            </div>
            <div className="lg:col-span-4 flex items-center justify-end gap-space-sm px-space-sm bg-surface-container-low lg:bg-transparent rounded-lg py-1 lg:py-0">
              <label className="font-label-sm text-label-sm text-on-surface-variant whitespace-nowrap">Ordenar por:</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full lg:w-auto bg-surface-container-lowest font-label-md text-label-md text-primary px-3 py-2 rounded-lg cursor-pointer focus:outline-none shadow-sm"
              >
                <option value="populares">Más populares</option>
                <option value="nuevos">Recién cosechados / agregados</option>
                <option value="precio-asc">Menor precio primero</option>
                <option value="precio-desc">Mayor precio primero</option>
                <option value="rating">Mejor valorados</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-space-sm overflow-x-auto pb-1 no-scrollbar">
            {CATEGORIES.map((c) => {
              const active = category === c.key;
              return (
                <button
                  key={c.key}
                  onClick={() => setCategory(c.key)}
                  className={`px-space-md py-2 rounded-lg font-label-md text-label-md whitespace-nowrap shadow-sm flex items-center gap-1.5 transition-transform active:scale-95 ${
                    active
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container-lowest text-on-surface hover:bg-surface-variant transition-colors"
                  }`}
                >
                  <span className={`material-symbols-outlined text-sm ${active ? "" : "text-secondary"}`}>{c.icon}</span>
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* FEATURED PRODUCT */}
      {featured && (
        <section className="w-full max-w-7xl mx-auto px-4 lg:px-8 -mt-6 mb-space-xl relative z-20">
          <div className="bg-surface-container-lowest rounded-xl shadow-xl overflow-hidden">
            <div className="bg-primary-container text-on-primary-container px-space-lg py-2 flex items-center justify-between">
              <div className="flex items-center gap-2 font-label-sm text-label-sm uppercase tracking-widest text-primary-fixed">
                <span className="material-symbols-outlined text-base text-secondary-fixed">auto_awesome</span>
                Pieza Maestra del Mes • Trato Directo Garantizado
              </div>
              <span className="hidden sm:inline font-label-sm text-label-sm text-primary-fixed-dim">
                Simojovel &amp; Los Altos de Chiapas
              </span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
              <div className="lg:col-span-7 p-space-lg flex flex-col justify-between bg-surface-container-low/40">
                <div>
                  <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-surface-container-highest shadow-sm group">
                    <Image
                      src={gallery[galleryIndex]}
                      alt={featured.product.name}
                      fill
                      sizes="(max-width: 1024px) 100vw, 640px"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      priority
                    />
                    <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                      <span className="px-3 py-1 rounded-full bg-surface-container-lowest/95 backdrop-blur-md text-primary font-label-sm text-label-sm shadow-sm flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-secondary">location_on</span>
                        Zinacantán, Chiapas
                      </span>
                      <span className="px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">verified</span> 100% Telar de Cintura
                      </span>
                    </div>
                    <div className="absolute bottom-3 right-3 px-3 py-1 rounded-lg bg-primary/80 backdrop-blur-md text-on-primary font-label-sm text-label-sm">
                      4 semanas de tejido a mano
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-space-sm mt-space-sm">
                    {[
                      { img: "/img/img-34.jpg", label: "Detalle Hilo" },
                      { img: "/img/img-35.jpg", label: "En el Telar" },
                      { img: "/img/img-36.jpg", label: "Prenda Completa" },
                    ].map((thumb) => (
                      <button
                        key={thumb.label}
                        onClick={() => setGalleryIndex(gallery.indexOf(thumb.img))}
                        className={`aspect-[4/3] rounded-lg overflow-hidden bg-surface-container-highest relative focus:outline-none hover:opacity-90 transition-opacity ${
                          gallery[galleryIndex] === thumb.img ? "ring-2 ring-secondary ring-offset-2" : ""
                        }`}
                      >
                        <Image src={thumb.img} alt={thumb.label} width={320} height={240} className="w-full h-full object-cover" />
                        <span className="absolute inset-x-0 bottom-0 bg-primary/70 text-on-primary font-label-sm text-label-sm py-0.5 text-center">
                          {thumb.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-space-md p-space-md rounded-xl bg-surface-container-lowest flex items-center justify-between gap-space-md shadow-sm">
                  <div className="flex items-center gap-space-sm">
                    <Image
                      src={featured.producer.avatar}
                      alt={featured.producer.name}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover bg-surface-variant"
                    />
                    <div>
                      <div className="flex items-center gap-1">
                        <h4 className="font-title-md text-title-md text-primary leading-tight">{featured.producer.name}</h4>
                        <span className="material-symbols-outlined text-secondary text-base">verified</span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">{featured.producer.kind}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end text-tertiary-container font-label-md text-label-md">
                      <span className="material-symbols-outlined text-sm">star</span> {featured.product.rating.toFixed(1)} (
                      {featured.product.review_count} reseñas)
                    </div>
                    <span className="font-label-sm text-label-sm text-secondary font-bold">Responde en menos de 2h</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 p-space-lg flex flex-col justify-between gap-space-md bg-surface-container-lowest">
                <div className="flex flex-col gap-space-md">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm">
                        Código de Origen: ZIN-TXT-2024
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">
                        Trazabilidad Total
                      </span>
                    </div>
                    <h2 className="font-headline-lg text-headline-lg text-primary leading-tight">{featured.product.name}</h2>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-2">{featured.product.description}</p>
                  </div>

                  <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col gap-2">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="font-display-lg text-display-lg text-primary tracking-tight">
                          {money(featured.product.price)}
                        </span>
                        <span className="font-label-md text-label-md text-on-surface-variant"> MXN</span>
                      </div>
                      <span className="px-2 py-1 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold">
                        Precio de Taller
                      </span>
                    </div>
                    <div className="flex items-center gap-2 font-label-sm text-label-sm text-secondary">
                      <span className="material-symbols-outlined text-sm">savings</span>
                      <span>
                        En tiendas departamentales de lujo esta pieza se vende en $4,200+. Al comprar aquí, el 100% va
                        directo al taller.
                      </span>
                    </div>
                  </div>

                  <div className="space-y-space-sm">
                    <div className="flex items-center justify-between">
                      <label className="font-label-md text-label-md text-primary">Talla / Dimensiones:</label>
                      <span className="font-label-sm text-label-sm text-outline">Corte holgado tradicional</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {["Unitalla (S-M)", "Unitalla Amplia (L-XL)", "A la Medida (+3 días)"].map((option) => (
                        <button
                          key={option}
                          onClick={() => setSize(option)}
                          className={`py-2 rounded-lg font-label-md text-label-md text-center transition-colors ${
                            size === option
                              ? "bg-primary text-on-primary shadow-sm"
                              : "bg-surface-container text-on-surface hover:bg-surface-variant"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-space-xs">
                    <div className="flex items-center justify-between">
                      <label className="font-label-md text-label-md text-primary">Gama Floral:</label>
                      <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">{color}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {[
                        ["bg-primary-container", "Orquídeas y Violetas Zinacantán"],
                        ["bg-tertiary-container", "Terracota y Cempasúchil"],
                        ["bg-secondary", "Verde Bosque y Jade"],
                        ["bg-surface-container-highest", "Marfil Natural"],
                      ].map(([tone, label]) => (
                        <button
                          key={label}
                          onClick={() => setColor(label)}
                          aria-label={label}
                          className={`w-8 h-8 rounded-full ${tone} flex items-center justify-center text-on-primary transition-transform hover:scale-105 ${
                            color === label ? "ring-2 ring-primary ring-offset-2" : ""
                          }`}
                        >
                          {color === label && <span className="material-symbols-outlined text-xs">done</span>}
                        </button>
                      ))}
                      <span className="font-label-sm text-label-sm text-outline">4 tonos disponibles</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-space-sm pt-space-xs">
                    <div className="flex items-start gap-2 p-2 rounded-lg bg-surface-container/60">
                      <span className="material-symbols-outlined text-secondary text-lg">local_shipping</span>
                      <div className="flex flex-col">
                        <span className="font-label-sm text-label-sm text-primary font-bold">Envío Directo</span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">Desde Zinacantán vía Correos o Estafeta</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 p-2 rounded-lg bg-surface-container/60">
                      <span className="material-symbols-outlined text-secondary text-lg">security</span>
                      <div className="flex flex-col">
                        <span className="font-label-sm text-label-sm text-primary font-bold">Pago Seguro Comunitario</span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">Transferencia directa, Oxxo o Tarjeta</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-space-sm">
                  <div className="flex items-center gap-space-sm">
                    <button
                      onClick={() => buyFeatured(true)}
                      className="flex-1 py-3 px-space-md rounded-lg bg-tertiary-container text-on-tertiary font-label-md text-label-md font-bold hover:bg-tertiary transition-colors shadow-md flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-lg">shopping_bag</span>
                      Comprar Ahora
                    </button>
                    <button
                      onClick={() => buyFeatured(false)}
                      className="py-3 px-4 rounded-lg bg-secondary-container text-on-secondary-container font-label-md text-label-md hover:bg-secondary-fixed transition-colors flex items-center justify-center"
                      title="Añadir a la canasta"
                    >
                      <span className="material-symbols-outlined">add_shopping_cart</span>
                    </button>
                  </div>
                  <Link
                    href={`/mensajes?producer=${featured.producer.slug}&product=${featured.product.id}`}
                    className="w-full py-2.5 px-space-md rounded-lg bg-surface-container text-primary font-label-md text-label-md hover:bg-surface-variant transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">forum</span>
                    Preguntar dudas directamente a María por Chat
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* FILTERS + CATALOG */}
      <section className="w-full max-w-7xl mx-auto px-4 lg:px-8 pb-space-xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
          <aside className="lg:col-span-3 flex flex-col gap-space-lg">
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-lg sticky top-32">
              <div className="flex items-center justify-between pb-space-sm">
                <span className="font-title-md text-title-md text-primary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-lg text-secondary">tune</span> Filtros Facetados
                </span>
                <button onClick={reset} className="font-label-sm text-label-sm text-secondary hover:underline">
                  Limpiar todo
                </button>
              </div>

              <div className="space-y-space-xs">
                <div className="flex items-center justify-between">
                  <label htmlFor="price" className="font-label-md text-label-md text-primary">
                    Rango de Precio
                  </label>
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-bold">
                    $120 — {money(maxPrice)} MXN
                  </span>
                </div>
                <input
                  id="price"
                  className="w-full accent-secondary cursor-pointer h-2 bg-surface-variant rounded-lg"
                  max={3000}
                  min={50}
                  type="range"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                />
                <div className="flex justify-between font-label-sm text-label-sm text-outline">
                  <span>$50 MXN</span>
                  <span>$3,000 MXN</span>
                </div>
              </div>

              <div className="space-y-space-xs">
                <label className="font-label-md text-label-md text-primary">Municipio de Origen</label>
                <div className="space-y-2 mt-2 max-h-48 overflow-y-auto pr-1">
                  {MUNICIPALITIES.map(([name, count]) => (
                    <label key={name} className="flex items-center justify-between cursor-pointer group">
                      <div className="flex items-center gap-2">
                        <input
                          checked={municipalities.includes(name)}
                          onChange={() => toggleMunicipality(name)}
                          className="w-4 h-4 rounded text-secondary accent-secondary cursor-pointer"
                          type="checkbox"
                        />
                        <span className="font-body-sm text-body-sm text-on-surface group-hover:text-primary">{name}</span>
                      </div>
                      <span className="font-label-sm text-label-sm text-outline">{count}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-space-xs">
                <label className="font-label-md text-label-md text-primary">Disponibilidad</label>
                <div className="space-y-2 mt-2">
                  {[
                    ["todas", "Cualquier disponibilidad"],
                    ["stock", "En stock inmediato (Listo para envío)"],
                    ["pedido", "Sobre pedido artesanal personalizado"],
                  ].map(([value, label]) => (
                    <label key={value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        checked={availability === value}
                        onChange={() => setAvailability(value as "todas" | "stock" | "pedido")}
                        className="w-4 h-4 text-secondary accent-secondary cursor-pointer"
                        name="availability"
                        type="radio"
                      />
                      <span className="font-body-sm text-body-sm text-on-surface">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-space-xs">
                <label className="font-label-md text-label-md text-primary">Tipo de Productor</label>
                <div className="space-y-2 mt-2">
                  {[
                    ["cooperativa", "Cooperativa Indígena"],
                    ["familia", "Familia Artesana Independiente"],
                    ["micro", "Micronegocio Local Registrado"],
                  ].map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        checked={kindFilters.includes(key)}
                        onChange={() => toggleKind(key)}
                        className="w-4 h-4 rounded text-secondary accent-secondary cursor-pointer"
                        type="checkbox"
                      />
                      <span className="font-body-sm text-body-sm text-on-surface">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-space-md rounded-xl bg-secondary-container/40 text-on-secondary-container">
                <div className="flex items-center gap-2 font-label-md text-label-md font-bold mb-1">
                  <span className="material-symbols-outlined text-lg">verified_user</span> Sin intermediarios
                </div>
                <p className="font-body-sm text-body-sm text-on-secondary-fixed-variant">
                  Tus pagos se liberan directamente a las cuentas bancarias o cooperativas comunitarias de los
                  productores.
                </p>
              </div>
            </div>
          </aside>

          <div className="lg:col-span-9 flex flex-col gap-space-lg">
            <div className="flex flex-wrap items-center justify-between gap-space-sm bg-surface-container-lowest p-space-md rounded-xl shadow-sm">
              <div className="flex items-center gap-2">
                <span className="font-title-md text-title-md text-primary">{filtered.length} Productos Encontrados</span>
                <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm">
                  Mostrando {rangeStart} - {rangeEnd}
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {(municipalities.length ? municipalities : ["Zinacantán", "Simojovel", "San Cristóbal"]).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm"
                  >
                    {tag}
                    {municipalities.length > 0 && (
                      <button onClick={() => toggleMunicipality(tag)} className="material-symbols-outlined text-xs hover:text-error">
                        close
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="bg-surface-container-lowest rounded-xl p-space-xl text-center shadow-sm">
                <span className="material-symbols-outlined text-4xl text-outline">search_off</span>
                <h3 className="font-headline-sm text-headline-sm text-primary mt-2">No encontramos coincidencias</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Ajusta la búsqueda, el rango de precio o los municipios seleccionados.
                </p>
                <button
                  onClick={reset}
                  className="mt-space-md px-space-md py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md"
                >
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-space-md">
                {paginated.map(({ product, producer }) => (
                  <ProductCard key={product.id} product={product} producer={producer} />
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 bg-surface-container-lowest rounded-xl px-space-md py-3 shadow-sm">
              <span className="font-label-sm text-label-sm text-outline">
                Página {currentPage} de {pages} <span className="hidden sm:inline">• Actualizado hace 15 minutos</span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-surface-container text-primary font-label-sm text-label-sm disabled:text-outline disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`w-7 h-7 rounded-lg font-label-sm text-label-sm ${
                      n === currentPage ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-surface-container"
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  disabled={currentPage === pages}
                  className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-surface-container text-primary font-label-sm text-label-sm disabled:text-outline disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <span className="sr-only">{producers.length} productores verificados</span>
    </div>
  );
}
