"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "./CartProvider";
import { money } from "@/lib/format";
import type { Producer, Product } from "@/lib/types";

type Review = {
  id: number;
  author: string;
  location: string;
  avatar: string;
  rating: number;
  body: string;
  verified: string;
};

type Step = { id: number; step: string; title: string; body: string; image: string };

export function ProducerView({
  producer,
  products,
  reviews,
  steps,
  related,
  regionLabel,
}: {
  producer: Producer;
  products: Product[];
  reviews: Review[];
  steps: Step[];
  related: Producer[];
  regionLabel: string;
}) {
  const { add } = useCart();
  const [favorite, setFavorite] = useState(false);
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) await navigator.share({ title: producer.name, url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      }
    } catch {
      /* cancelled */
    }
  };

  const wa = producer.whatsapp.replace(/\D/g, "");

  return (
    <div className="flex flex-col w-full">
      <section className="w-full bg-surface-container-low py-3 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-label-md text-label-md text-on-surface-variant">
            <Link href="/mapa" className="hover:text-primary transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Directorio Regional
            </Link>
            <span>/</span>
            <span className="text-secondary font-semibold">{regionLabel}</span>
            <span>/</span>
            <span className="text-on-surface font-semibold truncate">{producer.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              Cosecha de Altura Activa (2024)
            </span>
            <span className="font-label-sm text-label-sm text-outline">ID Verificado: #CHP-ALT-0842</span>
          </div>
        </div>
      </section>

      <section className="relative w-full overflow-hidden bg-primary-container">
        <div className="relative w-full h-80 md:h-96">
          <Image src={producer.cover} alt={producer.name} fill sizes="100vw" className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/60 to-transparent" />
          <div className="relative max-w-7xl mx-auto h-full px-4 lg:px-8 flex flex-col justify-between py-6">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface/90 backdrop-blur-md font-label-sm text-label-sm text-primary shadow-sm">
                <span className="material-symbols-outlined text-sm text-secondary">eco</span>
                {producer.badge}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={share}
                  className="p-2 rounded-full bg-surface/85 backdrop-blur-md text-primary hover:bg-surface transition-colors shadow-sm"
                  title="Compartir"
                >
                  <span className="material-symbols-outlined text-base">share</span>
                </button>
                <button
                  onClick={() => setFavorite((v) => !v)}
                  className="p-2 rounded-full bg-surface/85 backdrop-blur-md text-primary hover:bg-surface transition-colors shadow-sm"
                  title="Guardar"
                >
                  <span className={`material-symbols-outlined text-base ${favorite ? "text-tertiary-container" : ""}`}>
                    {favorite ? "bookmark" : "bookmark_border"}
                  </span>
                </button>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-4 text-on-primary/90 font-label-md text-label-md">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-base text-secondary-fixed">landscape</span>
                1,480 msnm • Pantelhó &amp; San Cristóbal
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-base text-secondary-fixed">workspace_premium</span>
                Puntaje Catación SCAA 85.5 pts
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="relative max-w-7xl mx-auto w-full px-4 lg:px-8 -mt-20 z-10">
        <div className="bg-surface-container-lowest rounded-xl p-6 lg:p-8 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="relative shrink-0">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden shadow-lg p-1 bg-surface-container-lowest">
                <Image src={producer.avatar} alt={producer.name} width={256} height={256} className="w-full h-full rounded-full object-cover" />
              </div>
              <div
                className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-secondary text-on-secondary flex items-center justify-center shadow-md ring-2 ring-surface-container-lowest"
                title="Identidad Comunitaria Verificada"
              >
                <span className="material-symbols-outlined text-base">verified</span>
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold">
                  <span className="material-symbols-outlined text-xs">shield</span>
                  Productor Verificado Chiapas
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm">
                  <span className="material-symbols-outlined text-xs text-secondary">history_edu</span>
                  {producer.tagline}
                </span>
              </div>
              <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">{producer.name}</h1>
              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mt-1 font-body-sm text-body-sm text-on-surface-variant">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-secondary">location_on</span>
                  {producer.municipality}, Chiapas
                </span>
                <span className="hidden sm:inline text-outline">•</span>
                <div className="flex items-center gap-1.5 font-label-md text-label-md text-primary font-bold">
                  <span className="material-symbols-outlined text-base text-on-tertiary-container fill-1">star</span>
                  <span>{producer.rating.toFixed(1)}</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant font-normal">
                    ({producer.review_count} compras directas verificadas)
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 pt-4 lg:pt-0">
            <a
              href={`https://wa.me/${wa}?text=${encodeURIComponent(`Hola ${producer.name}, vi su catálogo en Origen Chiapas y me gustaría pedir...`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-secondary text-on-secondary font-label-md text-label-md hover:bg-on-secondary-fixed-variant transition-colors shadow-md"
            >
              <span className="material-symbols-outlined text-lg">chat</span>
              WhatsApp Directo
            </a>
            <Link
              href={`/mensajes?producer=${producer.slug}`}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-surface-container-high text-on-surface font-label-md text-label-md hover:bg-surface-variant transition-colors"
            >
              <span className="material-symbols-outlined text-lg text-secondary">mail</span>
              Mensaje Interno
            </Link>
            <div className="flex items-center gap-2">
              <button
                onClick={share}
                className="p-3 rounded-lg bg-surface-container-low text-on-surface hover:bg-surface-container-high transition-colors"
                title="Compartir enlace de este productor"
              >
                <span className="material-symbols-outlined text-lg">share</span>
              </button>
              <button
                onClick={() => setFavorite((v) => !v)}
                className="p-3 rounded-lg bg-surface-container-low text-on-surface hover:bg-surface-container-high transition-colors"
                title="Guardar en favoritos"
              >
                <span className={`material-symbols-outlined text-lg ${favorite ? "text-tertiary-container" : ""}`}>
                  {favorite ? "favorite" : "favorite_border"}
                </span>
              </button>
            </div>
          </div>
        </div>
        {copied && (
          <p className="mt-2 text-right font-label-sm text-label-sm text-secondary">Enlace copiado al portapapeles</p>
        )}
      </section>

      <section className="max-w-7xl mx-auto w-full px-4 lg:px-8 mt-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-surface-container-low">
          {[
            ["payments", "100%", "Sin comisión abusiva"],
            ["psychiatry", "Sombra", "Cultivo bajo árboles nativos"],
            ["local_shipping", "24 - 48h", "Despacho desde San Cristóbal"],
            ["handshake", "12 Familias", "Beneficiadas en la cooperativa"],
          ].map(([icon, value, label], index) => (
            <div key={label} className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  index % 2 === 0 ? "bg-secondary-container text-on-secondary-container" : "bg-surface-container-highest text-secondary"
                }`}
              >
                <span className="material-symbols-outlined text-xl">{icon}</span>
              </div>
              <div>
                <p className="font-headline-sm text-headline-sm text-primary leading-none">{value}</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="max-w-7xl mx-auto w-full px-4 lg:px-8 mt-8 mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 flex flex-col gap-10">
            <article className="bg-surface-container-lowest rounded-xl p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-secondary text-2xl">menu_book</span>
                <h2 className="font-headline-md text-headline-md text-primary tracking-tight">Herencia &amp; Proceso de Origen</h2>
              </div>
              <div className="space-y-4 font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
                <p>{producer.about}</p>
                <p>
                  A diferencia de las producciones intensivas, cada cereza se recolecta exclusivamente en su punto
                  óptimo de maduración por manos de campesinas y campesinos tsotsiles. El despulpado se efectúa el mismo
                  día de la pizca utilizando agua de manantial de montaña que posteriormente es tratada para no impactar
                  las cuencas locales.
                </p>
                <p>
                  El secado lento en patios de terracota al sol de Los Altos garantiza que los azúcares naturales del
                  grano se concentren, otorgando a la taza notas distintivas de{" "}
                  <strong className="text-secondary font-semibold">chocolate chiapaneco, caramelo de caña y una acidez málica brillante</strong>{" "}
                  típica de nuestros suelos volcánicos.
                </p>
              </div>
              <div className="mt-6 pt-6 bg-surface-container-low rounded-lg p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">nest_eco_leaf</span>
                  <span className="font-label-md text-label-md text-primary">Certificación Libre de Agroquímicos Comunitario</span>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Variedades: Typica 60%, Bourbón 30%, Mundo Novo 10%
                </span>
              </div>
            </article>

            <section className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-2xl">storefront</span>
                    <h2 className="font-headline-md text-headline-md text-primary tracking-tight">Cosecha &amp; Derivados Disponibles</h2>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                    Empacado al vacío y tostado en pequeños lotes semanales para conservar frescura.
                  </p>
                </div>
                <span className="font-label-sm text-label-sm text-secondary bg-secondary-container px-3 py-1 rounded-full w-fit">
                  {products.filter((p) => p.status === "activo").length} Productos en Stock
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm flex flex-col justify-between group hover:shadow-md transition-all"
                  >
                    <div className="relative">
                      <Link href={`/negocio/${producer.slug}`} className="block relative h-52 overflow-hidden">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          sizes="(max-width: 640px) 100vw, 360px"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </Link>
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-surface-container-lowest/90 backdrop-blur font-label-sm text-label-sm text-primary font-bold">
                        {product.badge}
                      </span>
                      <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-secondary text-on-secondary font-label-sm text-label-sm">
                        {product.unit}
                      </span>
                      {product.status !== "activo" && (
                        <span className="absolute inset-0 bg-surface/60 flex items-center justify-center font-label-md text-label-md text-primary">
                          Pausado temporalmente
                        </span>
                      )}
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-title-md text-title-md text-primary font-bold leading-snug">{product.name}</h3>
                        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1.5 line-clamp-2">{product.short}</p>
                      </div>
                      <div className="mt-4 pt-4 flex items-center justify-between">
                        <div>
                          <span className="font-label-sm text-label-sm text-outline">Precio directo</span>
                          <p className="font-headline-sm text-headline-sm text-primary leading-tight font-bold">
                            {money(product.price)} <span className="text-sm font-normal">MXN</span>
                          </p>
                        </div>
                        <button
                          onClick={() => add(product.id)}
                          disabled={product.status !== "activo" || product.stock < 1}
                          className="px-4 py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-surface-tint transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="material-symbols-outlined text-base">add_shopping_cart</span>
                          Agregar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {steps.length > 0 && (
            <section className="bg-surface-container-lowest rounded-xl p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-2xl">photo_camera</span>
                    <h2 className="font-headline-md text-headline-md text-primary tracking-tight">Del Árbol a Tu Taza</h2>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                    La trazabilidad viva de cada etapa en Pantelhó y San Cristóbal.
                  </p>
                </div>
                <span className="font-label-sm text-label-sm text-outline hidden sm:inline">4 Etapas Documentadas</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {steps.slice(0, 3).map((step) => (
                  <div key={step.id} className="group relative rounded-xl overflow-hidden bg-surface-container">
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={step.image}
                        alt={step.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 260px"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-3 bg-surface-container-lowest">
                      <span className="font-label-sm text-label-sm text-secondary font-bold">{step.step}</span>
                      <h4 className="font-title-md text-title-md text-primary leading-tight">{step.title}</h4>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{step.body}</p>
                    </div>
                  </div>
                ))}
              </div>
              {steps[3] && (
                <div className="mt-4 flex flex-col sm:flex-row items-center gap-4 rounded-xl overflow-hidden bg-surface-container">
                  <div className="relative w-full sm:w-48 h-36 shrink-0">
                    <Image src={steps[3].image} alt={steps[3].title} fill sizes="200px" className="object-cover" />
                  </div>
                  <div className="p-4 sm:pr-6">
                    <span className="font-label-sm text-label-sm text-secondary font-bold">{steps[3].step}</span>
                    <h4 className="font-title-md text-title-md text-primary leading-tight">{steps[3].title}</h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{steps[3].body}</p>
                  </div>
                </div>
              )}
            </section>
            )}

            <section className="bg-surface-container-lowest rounded-xl p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-2xl">reviews</span>
                    <h2 className="font-headline-md text-headline-md text-primary tracking-tight">Valoraciones de Compradores Reales</h2>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                    Todas las opiniones provienen de pedidos completados sin comisiones intermediarias.
                  </p>
                </div>
                <Link
                  href={`/mensajes?producer=${producer.slug}`}
                  className="px-4 py-2 rounded-lg bg-surface-container-high text-primary font-label-md text-label-md hover:bg-surface-variant transition-colors self-start sm:self-auto"
                >
                  Escribir Reseña
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 rounded-xl bg-surface-container-low mb-8 items-center">
                <div className="md:col-span-4 text-center md:border-r md:border-surface-variant flex flex-col items-center justify-center">
                  <span className="font-display-lg text-display-lg text-primary font-bold leading-none">
                    {producer.rating.toFixed(1)}
                  </span>
                  <div className="flex items-center gap-1 my-2 text-on-tertiary-container">
                    {[0, 1, 2, 3, 4].map((n) => (
                      <span key={n} className="material-symbols-outlined text-xl fill-1">
                        star
                      </span>
                    ))}
                  </div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    Basado en {producer.review_count} valoraciones
                  </span>
                </div>
                <div className="md:col-span-8 flex flex-col gap-2">
                  {[
                    ["5 estrellas", 92],
                    ["4 estrellas", 6],
                    ["3 estrellas", 2],
                  ].map(([label, width]) => (
                    <div key={label as string} className="flex items-center gap-3 font-label-sm text-label-sm">
                      <span className="w-16 text-on-surface-variant">{label}</span>
                      <div className="flex-1 h-2 rounded-full bg-surface-variant overflow-hidden">
                        <div className="h-full bg-secondary rounded-full" style={{ width: `${width}%` }} />
                      </div>
                      <span className="w-8 text-right font-bold text-primary">{width}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-6">
                {reviews.map((review) => (
                  <div key={review.id} className="p-5 rounded-xl bg-surface-bright shadow-sm flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Image
                          src={review.avatar}
                          alt={review.author}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <h5 className="font-title-md text-title-md text-primary font-bold leading-tight">{review.author}</h5>
                          <p className="font-body-sm text-body-sm text-on-surface-variant">{review.location}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 text-on-tertiary-container">
                        {Array.from({ length: review.rating }).map((_, i) => (
                          <span key={i} className="material-symbols-outlined text-sm fill-1">
                            star
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="font-body-md text-body-md text-on-surface-variant">{review.body}</p>
                    <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-secondary">
                      <span className="material-symbols-outlined text-sm">verified</span>
                      {review.verified}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-32">
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col gap-6">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">schedule</span>
                <h3 className="font-headline-sm text-headline-sm text-primary">Información de Atención</h3>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between font-label-md text-label-md">
                  <span className="text-on-surface-variant">Lunes a Sábado:</span>
                  <span className="font-bold text-primary">08:00 - 18:00 hrs</span>
                </div>
                <div className="flex items-center justify-between font-label-md text-label-md">
                  <span className="text-on-surface-variant">Domingos:</span>
                  <span className="text-outline">Cerrado (Cuidado de huerto)</span>
                </div>
                <div className="mt-1 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary-container/60 text-on-secondary-container font-label-sm text-label-sm">
                  <span className="w-2 h-2 rounded-full bg-secondary" />
                  <span>Abierto hoy para entregas y visitas</span>
                </div>
              </div>

              <div className="pt-4 flex flex-col gap-3">
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-secondary shrink-0 mt-0.5">pin_drop</span>
                  <div>
                    <p className="font-title-md text-title-md text-primary font-bold">Punto de Entrega &amp; Taller:</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                      Calle Real de Guadalupe #45, Barrio de Guadalupe, C.P. 29230, San Cristóbal de Las Casas, Chiapas.
                    </p>
                    <span className="font-label-sm text-label-sm text-outline">A dos cuadras del Andador Guadalupano</span>
                  </div>
                </div>
                <div className="relative w-full h-44 rounded-lg overflow-hidden shadow-inner mt-2">
                  <Image src="/img/img-19.jpg" alt="Mapa de ubicación en San Cristóbal Centro" fill sizes="360px" className="object-cover" />
                  <div className="absolute inset-0 bg-primary/10 flex items-center justify-center pointer-events-none">
                    <div className="p-2 rounded-full bg-secondary text-on-secondary shadow-lg flex items-center justify-center animate-bounce">
                      <span className="material-symbols-outlined text-lg">coffee</span>
                    </div>
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 p-2 rounded bg-surface/90 backdrop-blur-md flex items-center justify-between text-[11px] font-label-sm text-on-surface shadow-sm">
                    <span>San Cristóbal Centro</span>
                    <a
                      className="text-secondary font-bold hover:underline flex items-center gap-0.5"
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(producer.municipality)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Abrir GPS <span className="material-symbols-outlined text-xs">open_in_new</span>
                    </a>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex flex-col gap-3">
                <p className="font-title-md text-title-md text-primary font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-lg">local_shipping</span>
                  Métodos de Entrega Acordados
                </p>
                <ul className="space-y-2.5 font-body-sm text-body-sm text-on-surface-variant">
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-secondary text-base shrink-0 mt-0.5">check_circle</span>
                    <span>
                      <strong className="text-on-surface font-semibold">Recoger en local:</strong> Sin costo adicional en el
                      taller de San Cristóbal.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-secondary text-base shrink-0 mt-0.5">check_circle</span>
                    <span>
                      <strong className="text-on-surface font-semibold">Entrega a domicilio local:</strong> $45 MXN dentro
                      de San Cristóbal (gratis en compras mayores a $400 MXN).
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-secondary text-base shrink-0 mt-0.5">check_circle</span>
                    <span>
                      <strong className="text-on-surface font-semibold">Envíos a todo México:</strong> Paquetería directa con
                      guía rastreable ($140 MXN flat nacional).
                    </span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 flex flex-col gap-3">
                <p className="font-title-md text-title-md text-primary font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-lg">account_balance_wallet</span>
                  Métodos de Pago Directos
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ["payments", "Efectivo contra entrega"],
                    ["sync_alt", "SPEI / CoDi directo"],
                    ["credit_card", "Terminal Bancaria"],
                    ["qr_code_2", "Cobro QR"],
                  ].map(([icon, label]) => (
                    <div key={label} className="p-2.5 rounded-lg bg-surface-container-low flex items-center gap-2 font-label-sm text-label-sm text-primary">
                      <span className="material-symbols-outlined text-base text-secondary">{icon}</span>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
                <p className="font-label-sm text-label-sm text-outline italic">
                  El dinero va 100% íntegro a la cuenta del productor sin intermediarios financieros.
                </p>
              </div>
            </div>

            <div className="bg-primary text-on-primary rounded-xl p-6 shadow-sm flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-secondary-fixed">
                  <span className="material-symbols-outlined">support_agent</span>
                </div>
                <div>
                  <h4 className="font-title-md text-title-md font-bold leading-tight">¿Tienes dudas o pedidos especiales?</h4>
                  <p className="font-label-sm text-label-sm text-primary-fixed-dim">
                    {producer.name} y su familia responden en español y tsotsil.
                  </p>
                </div>
              </div>
              <p className="font-body-sm text-body-sm text-primary-fixed">
                Venta al mayoreo para cafeterías de especialidad y eventos con precios justos de origen.
              </p>
              <a
                href={`tel:${producer.phone}`}
                className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-surface-container-lowest text-primary font-label-md text-label-md hover:bg-surface transition-colors font-bold"
              >
                <span className="material-symbols-outlined text-base">call</span>
                Llamar al taller ({producer.phone})
              </a>
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h4 className="font-title-md text-title-md text-primary font-bold">Productores en Los Altos</h4>
                <Link href="/productores" className="font-label-sm text-label-sm text-secondary hover:underline">
                  Ver todos →
                </Link>
              </div>
              <div className="flex flex-col gap-3">
                {related.map((p) => (
                  <Link
                    key={p.id}
                    href={`/negocio/${p.slug}`}
                    className="p-3 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors flex items-center gap-3 group"
                  >
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0">
                      <Image src={p.avatar} alt={p.name} fill sizes="56px" className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-label-sm text-label-sm text-secondary font-semibold">📍 {p.municipality.split(" / ")[0]}</span>
                      <p className="font-title-md text-title-md text-primary truncate group-hover:text-secondary transition-colors">{p.name}</p>
                      <p className="font-body-sm text-body-sm text-on-surface-variant truncate">{p.tagline}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
