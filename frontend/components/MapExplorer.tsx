"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MAP_SVG } from "./map-svg";
import type { Producer } from "@/lib/types";
import { money } from "@/lib/format";
import { distanceKm, formatDistance, producerCoords, projectToMap, type Coords } from "@/lib/geo";

type Pin = {
  id: string;
  slug: string;
  top: string;
  left: string;
  tone: string;
  icon: string;
  label: string;
  star: string;
  starCount: string;
  product: string;
  price: number;
};

const PINS: Pin[] = [
  {
    id: "pin-maya",
    slug: "cooperativa-cafetalera-maya",
    top: "43%",
    left: "45%",
    tone: "bg-primary text-on-primary",
    icon: "coffee",
    label: "Café Maya-Chiapas",
    star: "4.9",
    starCount: "84",
    product: "Café pergamino arábica de estricta altura (1,650 msnm) lavado con fermentación controlada de 36 hrs.",
    price: 240,
  },
  {
    id: "pin-ambar",
    slug: "taller-ambar-simojovel",
    top: "31%",
    left: "43%",
    tone: "bg-[#8E5A00] text-white",
    icon: "diamond",
    label: "Ámbar Simojovel",
    star: "5.0",
    starCount: "52",
    product: "Cabujones de ámbar amarillo certificado y joyería en plata .925.",
    price: 780,
  },
  {
    id: "pin-textil",
    slug: "mujeres-tejedoras-zinacantan",
    top: "47%",
    left: "40%",
    tone: "bg-[#5D2879] text-white",
    icon: "styler",
    label: "Tejedoras Tzotziles",
    star: "4.8",
    starCount: "119",
    product: "Huipiles bordados en telar de cintura y rebozos de lana.",
    price: 1450,
  },
  {
    id: "pin-tuxtla",
    slug: "cacaotales-soconusco",
    top: "46%",
    left: "32%",
    tone: "bg-primary text-on-primary",
    icon: "restaurant",
    label: "Tuxtla Centro",
    star: "4.9",
    starCount: "93",
    product: "Nibs de cacao fermentado, pasta 100% pura y chocolate de metate.",
    price: 140,
  },
  {
    id: "pin-gastro",
    slug: "rancho-santa-clara",
    top: "39%",
    left: "58%",
    tone: "bg-[#1C5177] text-white",
    icon: "bakery_dining",
    label: "Queso Bola Ocosingo",
    star: "4.9",
    starCount: "67",
    product: "Queso bola doble crema relleno con mantequilla de rancho.",
    price: 320,
  },
  {
    id: "pin-palenque",
    slug: "guardianes-bosque-chol",
    top: "19%",
    left: "68%",
    tone: "bg-[#3B6939] text-white",
    icon: "hive",
    label: "Palenque Meliponarios",
    star: "4.8",
    starCount: "56",
    product: "Miel medicinal de abeja melipona cosechada sin aguijón.",
    price: 380,
  },
  {
    id: "pin-cacao",
    slug: "cacaotales-soconusco",
    top: "74%",
    left: "62%",
    tone: "bg-[#78350F] text-white",
    icon: "nutrition",
    label: "Cacao Soconusco",
    star: "4.9",
    starCount: "93",
    product: "Cacao criollo ancestral fermentado en cajones de madera.",
    price: 140,
  },
  {
    id: "pin-chiapa",
    slug: "taller-maestro-nandayapa",
    top: "48%",
    left: "36%",
    tone: "bg-[#A33419] text-white",
    icon: "brush",
    label: "Laca de Chiapa",
    star: "4.9",
    starCount: "73",
    product: "Jícara chiapaneca con laca y dorado en hoja de oro.",
    price: 620,
  },
];

const MUNICIPALITIES = ["Todos", "San Cristóbal", "Tuxtla Gtz", "Simojovel", "Zinacantán"];
const CATEGORY_CHIPS = [
  { key: "todos", label: "Todos", icon: "apps" },
  { key: "cafe", label: "Café", icon: "coffee" },
  { key: "textil", label: "Textiles", icon: "styler" },
  { key: "ambar", label: "Ámbar", icon: "diamond" },
  { key: "gastronomia", label: "Gastronomía", icon: "restaurant" },
  { key: "miel", label: "Miel Melipona", icon: "hive" },
];

type GeoStatus = "idle" | "loading" | "ready" | "denied" | "unsupported" | "error";

type GeoState = {
  status: GeoStatus;
  coords: Coords | null;
  accuracy: number | null;
  message: string;
};

const INITIAL_GEO: GeoState = { status: "idle", coords: null, accuracy: null, message: "" };

export function MapExplorer({ producers }: { producers: Producer[] }) {
  const [query, setQuery] = useState("");
  const [muni, setMuni] = useState("Todos");
  const [category, setCategory] = useState("todos");
  const [openNow, setOpenNow] = useState(true);
  const [shipping, setShipping] = useState(false);
  const [verified, setVerified] = useState(true);
  const [view, setView] = useState<"mapa" | "lista">("mapa");
  const [activePin, setActivePin] = useState<string | null>("pin-maya");
  const [hoverPin, setHoverPin] = useState<string | null>(null);
  const [layer, setLayer] = useState("Topográfico");
  const [zoom, setZoom] = useState(1);
  const [geo, setGeo] = useState<GeoState>(INITIAL_GEO);
  const [sort, setSort] = useState<"relevancia" | "rating" | "cercania">("relevancia");

  const locate = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeo({ status: "unsupported", coords: null, accuracy: null, message: "Tu navegador no permite geolocalización." });
      return;
    }
    setGeo((prev) => ({ ...prev, status: "loading", message: "" }));
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeo({
          status: "ready",
          coords: { lat: position.coords.latitude, lng: position.coords.longitude },
          accuracy: position.coords.accuracy,
          message: "",
        });
        setSort("cercania");
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setGeo({
            status: "denied",
            coords: null,
            accuracy: null,
            message: "Bloqueaste la ubicación. Actívala en el candado del navegador y vuelve a intentar.",
          });
        } else if (error.code === error.TIMEOUT) {
          setGeo({
            status: "error",
            coords: null,
            accuracy: null,
            message: "No pudimos obtener tu ubicación a tiempo. Intenta de nuevo.",
          });
        } else {
          setGeo({
            status: "error",
            coords: null,
            accuracy: null,
            message: "No pudimos leer tu ubicación. Revisa que el GPS o la red estén activos.",
          });
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 120000 },
    );
  }, []);

  // Al entrar al mapa pedimos la ubicación real para mostrar lo más cercano.
  useEffect(() => {
    locate();
  }, [locate]);

  const userCoords = geo.coords;

  // Al detectar tu ubicación, abrimos el micronegocio más cercano del mapa.
  useEffect(() => {
    if (!userCoords) return;
    let closest: { id: string; km: number } | null = null;
    for (const pin of PINS) {
      const producer = producers.find((p) => p.slug === pin.slug);
      if (!producer) continue;
      const km = distanceKm(userCoords, producerCoords(producer.slug, producer.municipality));
      if (!closest || km < closest.km) closest = { id: pin.id, km };
    }
    if (closest) setActivePin(closest.id);
  }, [userCoords, producers]);

  const distanceFor = useCallback(
    (producer: Producer) => {
      if (!userCoords) return null;
      return distanceKm(userCoords, producerCoords(producer.slug, producer.municipality));
    },
    [userCoords],
  );

  const cards = useMemo(() => {
    const list = producers
      .filter((p) => {
        if (p.category === "cacao") return false;
        if (!["cafe", "ambar", "textil", "gastronomia", "miel"].includes(p.category)) return false;
        if (category !== "todos" && p.category !== category) return false;
        if (muni !== "Todos" && !p.municipality.toLowerCase().includes(muni.split(" ")[0].toLowerCase())) return false;
        if (query && !`${p.name} ${p.municipality} ${p.about}`.toLowerCase().includes(query.toLowerCase())) return false;
        return true;
      })
      .map((p) => ({ producer: p, distance: distanceFor(p) }));

    if (sort === "cercania" && userCoords) {
      list.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    } else if (sort === "rating") {
      list.sort((a, b) => b.producer.rating - a.producer.rating);
    }

    return list.slice(0, 8);
  }, [producers, category, muni, query, sort, userCoords, distanceFor]);

  const nearbyCount = useMemo(() => {
    if (!userCoords) return 0;
    return producers.filter((p) => {
      if (p.category === "cacao") return false;
      if (!["cafe", "ambar", "textil", "gastronomia", "miel"].includes(p.category)) return false;
      const km = distanceFor(p);
      return km !== null && km <= 50;
    }).length;
  }, [producers, userCoords, distanceFor]);

  const active = PINS.find((p) => p.id === activePin) ?? null;
  const activeProducer = active ? producers.find((p) => p.slug === active.slug) : null;
  const activeDistance = activeProducer ? distanceFor(activeProducer) : null;
  const highlighted = hoverPin ?? activePin;
  const userMarker = userCoords ? projectToMap(userCoords) : null;
  const routeHref = (() => {
    if (!activeProducer) return "https://www.google.com/maps/search/?api=1&query=Chiapas";
    const target = producerCoords(activeProducer.slug, activeProducer.municipality);
    const params = new URLSearchParams({ api: "1", destination: `${target.lat},${target.lng}`, travelmode: "driving" });
    if (userCoords) params.set("origin", `${userCoords.lat},${userCoords.lng}`);
    return `https://www.google.com/maps/dir/?${params.toString()}`;
  })();

  return (
    <div className="flex flex-col w-full">
      <section className="w-full px-4 lg:px-8 pt-6 pb-4">
        <div className="max-w-[1500px] mx-auto flex flex-col gap-4">
          <div className="flex items-center gap-2 font-label-sm text-label-sm text-secondary uppercase tracking-widest">
            <span className="material-symbols-outlined text-sm">map</span>
            Cartografía viva comunitaria
            <span className="text-outline normal-case tracking-normal">• 15 Regiones Económicas</span>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <h1 className="font-headline-lg text-headline-lg text-primary">Directorio Geográfico de Micronegocios de Chiapas</h1>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center bg-surface-container-lowest rounded-lg p-1 shadow-sm">
                <button
                  onClick={() => setView("mapa")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-label-sm text-label-sm transition-colors ${
                    view === "mapa" ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant"
                  }`}
                >
                  <span className="material-symbols-outlined text-base">visibility</span> Ver en Mapa
                </button>
                <button
                  onClick={() => setView("lista")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-label-sm text-label-sm transition-colors ${
                    view === "lista" ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant"
                  }`}
                >
                  <span className="material-symbols-outlined text-base">list</span> Verso Lista
                </button>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-secondary-container text-on-secondary-container font-label-sm text-label-sm">
                <span className="material-symbols-outlined text-base">verified</span> Trazabilidad 100% Georreferenciada
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:h-[720px]">
            <aside className={`${view === "mapa" ? "lg:col-span-5" : "lg:col-span-12"} flex flex-col bg-surface-container-lowest rounded-2xl overflow-hidden shadow-md min-h-0`}>
              <div className="p-3.5 border-b border-surface-container flex flex-col gap-3">
                <div className="flex items-center gap-2 bg-surface-container-low rounded-lg px-3 py-2">
                  <span className="material-symbols-outlined text-outline">search</span>
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar micronegocio, producto o municipio..."
                    className="flex-1 bg-transparent font-body-sm text-body-sm focus:outline-none placeholder:text-outline"
                  />
                  <span className="material-symbols-outlined text-outline text-lg">tune</span>
                </div>

                <div
                  className={`flex items-start gap-2 rounded-lg px-3 py-2 border ${
                    geo.status === "ready"
                      ? "bg-secondary-container/50 border-secondary/30"
                      : geo.status === "denied" || geo.status === "error" || geo.status === "unsupported"
                        ? "bg-amber-50 border-amber-300/60"
                        : "bg-surface-container-low border-line"
                  }`}
                >
                  {geo.status === "ready" ? (
                    <span className="material-symbols-outlined text-lg text-secondary">my_location</span>
                  ) : geo.status === "loading" || geo.status === "idle" ? (
                    <span className="material-symbols-outlined text-lg text-secondary animate-spin">progress_activity</span>
                  ) : (
                    <span className="material-symbols-outlined text-lg text-amber-700">location_off</span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-label-sm text-label-sm text-on-surface leading-tight">
                      {geo.status === "ready"
                        ? `Usando tu ubicación real${sort === "cercania" ? " · ordenado por cercanía" : ""}`
                        : geo.status === "loading" || geo.status === "idle"
                          ? "Obteniendo tu ubicación para mostrarte lo más cercano…"
                          : geo.status === "denied"
                            ? "Ubicación bloqueada"
                            : geo.status === "unsupported"
                              ? "Geolocalización no disponible"
                              : "No pudimos obtener tu ubicación"}
                    </p>
                    <p className="font-body-sm text-[11px] text-on-surface-variant leading-tight mt-0.5">
                      {geo.status === "ready"
                        ? (nearbyCount > 0
                            ? `${nearbyCount} micronegocios a menos de 50 km`
                            : "No hay micronegocios a menos de 50 km · te mostramos los más cercanos") +
                          (geo.accuracy ? ` · precisión ±${Math.round(geo.accuracy)} m` : "")
                        : geo.message ||
                          (geo.status === "loading"
                            ? "Acepta el permiso del navegador; no guardamos tu posición."
                            : "Activa el permiso de ubicación para ver distancias y negocios cercanos.")}
                    </p>
                  </div>
                  {geo.status === "ready" ? (
                    <button
                      onClick={locate}
                      className="shrink-0 p-1 rounded text-secondary hover:bg-secondary/10"
                      title="Actualizar mi ubicación"
                      aria-label="Actualizar mi ubicación"
                    >
                      <span className="material-symbols-outlined text-base">refresh</span>
                    </button>
                  ) : geo.status === "unsupported" ? null : (
                    <button
                      onClick={locate}
                      disabled={geo.status === "loading"}
                      className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded bg-primary text-on-primary font-label-sm text-[11px] hover:bg-surface-tint disabled:opacity-60"
                    >
                      <span className="material-symbols-outlined text-xs">my_location</span>
                      Reintentar
                    </button>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-label-sm text-label-sm text-outline uppercase tracking-wide">Municipios con productores</span>
                    <span className="font-label-sm text-label-sm text-secondary">Ver todos (124)</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {MUNICIPALITIES.map((m) => (
                      <button
                        key={m}
                        onClick={() => setMuni(m)}
                        className={`px-2.5 py-1 rounded-full font-label-sm text-label-sm transition-colors ${
                          muni === m
                            ? "bg-primary text-on-primary"
                            : "bg-surface-container-highest text-on-surface hover:bg-surface-variant"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                    <span className="px-2 py-1 font-label-sm text-label-sm text-outline">Zinacantán ↗</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORY_CHIPS.map((c) => (
                    <button
                      key={c.key}
                      onClick={() => setCategory(c.key)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-label-sm text-label-sm border transition-colors ${
                        category === c.key
                          ? "bg-primary border-primary text-on-primary"
                          : "bg-surface-container-lowest border-line text-on-surface hover:border-secondary"
                      }`}
                    >
                      <span className="material-symbols-outlined text-xs">{c.icon}</span> {c.label}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3 pt-0.5">
                  {[
                    ["Abierto ahora", openNow, () => setOpenNow((v) => !v)],
                    ["Envíos nac.", shipping, () => setShipping((v) => !v)],
                    ["Verificados", verified, () => setVerified((v) => !v)],
                  ].map(([label, value, toggle]) => (
                    <button
                      key={label as string}
                      onClick={toggle as () => void}
                      className="inline-flex items-center gap-1.5 font-label-sm text-label-sm text-on-surface-variant"
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center ${
                          value ? "bg-secondary border-secondary text-on-secondary" : "border-outline"
                        }`}
                      >
                        {value && <span className="material-symbols-outlined text-[10px]">check</span>}
                      </span>
                      {label as string}
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-3.5 py-2 bg-surface-container-low flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-on-surface">
                  <strong className="text-primary">
                    {userCoords ? `${nearbyCount} negocios` : `${cards.length} negocios`}
                  </strong>
                  <span className="text-outline">
                    {userCoords ? " a menos de 50 km de ti" : " en la región seleccionada"}
                  </span>
                </span>
                <select
                  value={sort}
                  onChange={(event) => {
                    const value = event.target.value as typeof sort;
                    setSort(value);
                    if (value === "cercania" && !userCoords) locate();
                  }}
                  className="bg-transparent font-label-sm text-label-sm text-primary focus:outline-none cursor-pointer"
                >
                  <option value="relevancia">Relevancia cultural</option>
                  <option value="rating">Mejor valorados</option>
                  <option value="cercania">Cercanía</option>
                </select>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                {cards.map(({ producer: p, distance }) => {
                  const pin = PINS.find((x) => x.slug === p.slug);
                  return (
                    <article
                      key={p.id}
                      onMouseEnter={() => pin && setHoverPin(pin.id)}
                      onMouseLeave={() => setHoverPin(null)}
                      onClick={() => pin && setActivePin(pin.id)}
                      className={`group relative p-3.5 rounded-xl bg-surface-container-lowest hover:bg-surface-container-low transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md ${
                        pin && highlighted === pin.id ? "ring-2 ring-secondary/60" : ""
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="relative w-28 h-28 rounded-lg overflow-hidden shrink-0">
                          <Image
                            src={p.avatar}
                            alt={p.name}
                            fill
                            sizes="112px"
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-primary/90 text-on-primary font-label-sm text-[10px]">
                            {p.category === "cafe"
                              ? "Café de Altura"
                              : p.category === "ambar"
                                ? "Ámbar Auténtico"
                                : p.category === "textil"
                                  ? "Bordado Tzotzil"
                                  : p.category === "gastronomia"
                                    ? "Denominación Ocosingo"
                                    : "Miel Melipona"}
                          </span>
                        </div>
                        <div className="flex-1 flex flex-col justify-between min-w-0">
                          <div>
                            <div className="flex items-start justify-between gap-1 mb-1">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-container/70 text-on-secondary-container font-label-sm text-label-sm">
                                <span className="material-symbols-outlined text-xs">verified</span>
                                <span>{p.kind.split(" · ")[0]}</span>
                              </span>
                              <div className="flex items-center gap-1 font-label-sm text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                                <span className="material-symbols-outlined text-xs fill-1 text-amber-600">star</span>
                                <span className="font-bold">{p.rating.toFixed(1)}</span>
                                <span className="text-outline text-[11px]">({p.review_count})</span>
                              </div>
                            </div>
                            <h3 className="font-title-md text-title-md text-primary font-bold leading-tight truncate">{p.name}</h3>
                            <p className="font-body-sm text-body-sm text-outline truncate flex items-center gap-1 mt-0.5">
                              <span className="material-symbols-outlined text-xs text-secondary">location_on</span>
                              <span className="truncate">{p.municipality} • {p.region}</span>
                            </p>
                            {distance !== null && (
                              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-secondary-container/60 text-on-secondary-container font-label-sm text-[10px]">
                                <span className="material-symbols-outlined text-[11px]">near_me</span>
                                {formatDistance(distance)}
                              </span>
                            )}
                          </div>
                          <div className="pt-1.5">
                            <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-1">
                              <span className="text-primary font-semibold">Productos:</span> {p.tagline}
                            </p>
                            <div className="flex items-center justify-between mt-2 pt-1">
                              <span className="font-label-sm text-label-sm text-secondary flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                                <span>{p.hours.split(" · ")[0]}</span>
                              </span>
                              <div className="flex items-center gap-1.5">
                                <Link
                                  href={`/mensajes?producer=${p.slug}`}
                                  className="px-2.5 py-1 rounded bg-secondary-container text-on-secondary-container hover:bg-secondary hover:text-on-secondary font-label-sm text-label-sm transition-colors"
                                >
                                  Contactar
                                </Link>
                                <Link
                                  href={`/negocio/${p.slug}`}
                                  className="px-2.5 py-1 rounded bg-primary text-on-primary hover:bg-surface-tint font-label-sm text-label-sm transition-colors"
                                >
                                  Ver Ficha
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="p-3 bg-surface-container flex items-center justify-between shrink-0">
                <span className="font-label-sm text-label-sm text-outline">
                  Mostrando {cards.length ? `1 - ${cards.length}` : "0"} de {producers.length} productores
                  {userCoords ? " · por cercanía" : ""}
                </span>
                <div className="flex items-center gap-1">
                  <button className="p-1 rounded bg-surface-container-lowest text-on-surface-variant hover:text-primary">
                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                  </button>
                  <span className="px-2 font-label-sm text-label-sm font-bold text-primary">1 / 18</span>
                  <button className="p-1 rounded bg-surface-container-lowest text-on-surface-variant hover:text-primary">
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                </div>
              </div>
            </aside>

            {view === "mapa" && (
              <div className="lg:col-span-7 relative h-[560px] lg:h-full rounded-2xl overflow-hidden shadow-md bg-surface-container-high select-none">
                <div
                  className={`absolute inset-0 w-full h-full overflow-hidden bg-[#E5E9E1] saturate-[1.15] transition-transform duration-300 ${
                    layer === "Satélite" ? "contrast-125 saturate-150" : layer === "Municipal" ? "hue-rotate-[8deg]" : ""
                  }`}
                  style={{ transform: `scale(${zoom})` }}
                >
                  <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: MAP_SVG }} />
                </div>

                {layer === "Municipal" && (
                  <div
                    className="absolute inset-0 opacity-30 pointer-events-none"
                    style={{
                      backgroundImage:
                        "linear-gradient(rgba(27,56,43,.25) 1px, transparent 1px), linear-gradient(90deg, rgba(27,56,43,.25) 1px, transparent 1px)",
                      backgroundSize: "48px 48px",
                    }}
                  />
                )}

                <div className="absolute inset-0 pointer-events-none">
                  {PINS.map((pin) => {
                    const isActive = activePin === pin.id;
                    const isHover = highlighted === pin.id;
                    return (
                      <div
                        key={pin.id}
                        className="pointer-events-auto absolute -translate-x-1/2 -translate-y-full cursor-pointer"
                        style={{ top: pin.top, left: pin.left, zIndex: isActive ? 30 : isHover ? 25 : 20 }}
                        onClick={() => setActivePin(pin.id)}
                      >
                        {isActive && <span className="absolute -inset-2 rounded-full bg-secondary/30 animate-ping" />}
                        <div
                          className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-full ${pin.tone} shadow-lg transition-transform ${
                            isHover ? "scale-110" : "scale-100"
                          }`}
                        >
                          <span className="material-symbols-outlined text-sm text-secondary-fixed">{pin.icon}</span>
                          <span className="font-label-sm text-[11px] whitespace-nowrap">{pin.label}</span>
                        </div>
                        <div className={`w-2.5 h-2.5 ${pin.tone.split(" ")[0]} rotate-45 mx-auto -mt-1 shadow-sm`} />
                      </div>
                    );
                  })}

                  {userMarker && (
                    <div
                      className="absolute -translate-x-1/2 -translate-y-1/2"
                      style={{ top: `${userMarker.top}%`, left: `${userMarker.left}%`, zIndex: 35 }}
                    >
                      <span className="absolute -inset-4 rounded-full bg-[#1C5177]/20 animate-ping" />
                      <span className="relative flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full bg-[#1C5177] text-white shadow-lg">
                        <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center">
                          <span className="material-symbols-outlined text-[13px] text-[#1C5177]">my_location</span>
                        </span>
                        <span className="font-label-sm text-[11px] whitespace-nowrap">Tu ubicación</span>
                      </span>
                    </div>
                  )}
                </div>

                {active && (
                  <div
                    className="absolute z-40 w-[330px] max-w-[85%]"
                    style={{
                      top: `clamp(8px, calc(${active.top} - 19rem), calc(100% - 20rem))`,
                      left: active.left,
                      transform: "translateX(-50%)",
                    }}
                  >
                    <div className="bg-surface-container-lowest rounded-2xl shadow-2xl overflow-hidden animate-pop-in">
                      <div className="relative h-28">
                        <Image
                          src={activeProducer?.cover ?? "/img/img-07.jpg"}
                          alt={activeProducer?.name ?? active.label}
                          fill
                          sizes="330px"
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent" />
                        <div className="absolute top-2 left-2 flex gap-1">
                          <span className="px-2 py-0.5 rounded-full bg-secondary text-on-secondary font-label-sm text-[10px] flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[10px]">verified</span> Verificado
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-primary/80 text-on-primary font-label-sm text-[10px]">Comercio Justo</span>
                        </div>
                        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-on-primary">
                          <span className="font-headline-sm text-sm font-bold truncate">{activeProducer?.name ?? active.label}</span>
                          <div className="flex items-center gap-0.5 bg-surface-container-lowest/90 text-primary px-1.5 py-0.5 rounded text-xs font-bold">
                            <span className="material-symbols-outlined text-xs fill-1 text-amber-500">star</span>
                            <span>{active.star}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => setActivePin(null)}
                          aria-label="Cerrar ficha"
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-surface-container-lowest/80 hover:bg-surface-container-lowest text-primary flex items-center justify-center"
                        >
                          <span className="material-symbols-outlined text-xs">close</span>
                        </button>
                      </div>
                      <div className="p-3">
                        <div className="space-y-1.5 mb-2">
                          <div className="flex items-center gap-1 font-body-sm text-xs text-outline">
                            <span className="material-symbols-outlined text-sm text-secondary">location_on</span>
                            <span className="truncate">{activeProducer?.municipality ?? "Chiapas"}</span>
                            {activeDistance !== null && (
                              <span className="ml-auto shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-secondary-container/70 text-on-secondary-container font-label-sm text-[10px]">
                                <span className="material-symbols-outlined text-[11px]">near_me</span>
                                {formatDistance(activeDistance)}
                              </span>
                            )}
                          </div>
                          <p className="font-body-sm text-xs text-on-surface-variant line-clamp-2">
                            <strong className="text-primary font-semibold">Producto estrella:</strong> {active.product}
                          </p>
                          <div className="flex items-center justify-between pt-1">
                            <span className="font-headline-sm text-headline-sm text-primary font-bold">
                              {money(active.price)} <span className="text-xs font-normal text-outline">MXN</span>
                            </span>
                            <span className="inline-flex items-center gap-1 font-label-sm text-[10px] text-secondary">
                              <span className="inline-block w-2 h-2 rounded-full bg-secondary" /> Envío nacional
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-surface-container">
                          <Link
                            href={`/negocio/${active.slug}`}
                            className="flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-primary font-label-sm text-xs transition-colors"
                          >
                            <span className="material-symbols-outlined text-xs">store</span>
                            <span>Ver perfil</span>
                          </Link>
                          <a
                            href={routeHref}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-primary font-label-sm text-xs transition-colors"
                          >
                            <span className="material-symbols-outlined text-xs">directions</span>
                            <span>Ruta</span>
                          </a>
                          <a
                            href={`https://wa.me/${(activeProducer?.whatsapp ?? "").replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg bg-secondary text-on-secondary hover:bg-primary font-label-sm text-xs transition-colors shadow-xs"
                          >
                            <span className="material-symbols-outlined text-xs">chat</span>
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="absolute top-4 right-4 z-30 flex items-center bg-surface-container-lowest/95 backdrop-blur-md p-1 rounded-xl shadow-lg">
                  {["Topográfico", "Municipal", "Satélite"].map((item) => (
                    <button
                      key={item}
                      onClick={() => setLayer(item)}
                      className={`px-3 py-1.5 rounded-lg font-label-sm text-xs transition-colors ${
                        layer === item
                          ? "bg-primary text-on-primary font-semibold"
                          : "text-on-surface-variant hover:text-primary font-medium"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>

                <div className="absolute bottom-5 right-5 z-30 flex flex-col gap-2">
                  <button
                    onClick={() => {
                      locate();
                      setZoom((z) => Math.min(1.6, Math.max(1.1, z)));
                    }}
                    className={`w-10 h-10 rounded-xl shadow-lg transition-colors flex items-center justify-center ${
                      userCoords
                        ? "bg-[#1C5177] text-white hover:bg-[#143d5b]"
                        : "bg-surface-container-lowest text-primary hover:text-secondary hover:bg-surface-container-low"
                    }`}
                    title={userCoords ? "Centrar en mi ubicación" : "Usar mi ubicación real"}
                  >
                    <span className="material-symbols-outlined text-xl">my_location</span>
                  </button>
                  <div className="flex flex-col bg-surface-container-lowest rounded-xl shadow-lg overflow-hidden divide-y divide-surface-container">
                    <button
                      onClick={() => setZoom((z) => Math.min(1.6, z + 0.12))}
                      className="w-10 h-10 text-primary hover:bg-surface-container-low transition-colors flex items-center justify-center font-bold text-lg"
                      title="Acercar"
                    >
                      <span className="material-symbols-outlined">add</span>
                    </button>
                    <button
                      onClick={() => setZoom((z) => Math.max(0.85, z - 0.12))}
                      className="w-10 h-10 text-primary hover:bg-surface-container-low transition-colors flex items-center justify-center font-bold text-lg"
                      title="Alejar"
                    >
                      <span className="material-symbols-outlined">remove</span>
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      setZoom(1);
                      setLayer("Topográfico");
                      setActivePin("pin-maya");
                    }}
                    className="w-10 h-10 rounded-xl bg-surface-container-lowest shadow-lg text-primary hover:text-secondary hover:bg-surface-container-low transition-colors flex items-center justify-center"
                    title="Restablecer vista Chiapas"
                  >
                    <span className="material-symbols-outlined text-xl">restart_alt</span>
                  </button>
                </div>

                <div className="absolute bottom-5 left-5 z-30 bg-surface-container-lowest/90 backdrop-blur-md px-3.5 py-2.5 rounded-xl shadow-lg max-w-xs">
                  <span className="font-label-sm text-[10px] uppercase font-bold text-outline tracking-wider block mb-1.5">
                    Código de Colores de Origen
                  </span>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] font-label-sm">
                    {[
                      ["bg-primary", "Café de Altura"],
                      ["bg-[#8E5A00]", "Ámbar Minero"],
                      ["bg-[#5D2879]", "Textil Maya"],
                      ["bg-[#1C5177]", "Queso y Gastro"],
                      ["bg-[#3B6939]", "Miel Melipona"],
                      ["bg-[#78350F]", "Cacao Ancestral"],
                    ].map(([tone, label]) => (
                      <div key={label} className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${tone} shrink-0`} />
                        <span className="text-on-surface">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="w-full px-4 lg:px-8 py-3 mb-6">
        <div className="max-w-[1500px] mx-auto bg-surface-container-low rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-lg">local_shipping</span>
            </span>
            <div>
              <h4 className="font-title-md text-sm text-primary font-bold">Rutas de recolección y logística directa</h4>
              <p className="font-body-sm text-xs text-on-surface-variant">
                Conectamos cooperativas de la Selva y Los Altos sin bodegas intermediarias abusivas.
              </p>
            </div>
          </div>
          <Link href="/como-funciona" className="font-label-md text-label-md text-secondary hover:text-primary transition-colors flex items-center gap-1">
            <span>Conoce el protocolo de verificación comunitaria</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
