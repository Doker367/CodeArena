import Image from "next/image";
import Link from "next/link";
import { getTranslator } from "@/lib/i18n-server";
import { langMeta } from "@/lib/i18n";
import { serverGet } from "@/lib/server-api";
import type { Producer, Product } from "@/lib/types";

export const dynamic = "force-dynamic";

const CATEGORIES = [
  { key: "cafe", label: "Café de Altura", icon: "coffee", image: "/img/img-10.jpg" },
  { key: "textil", label: "Textiles & Huipiles", icon: "styler", image: "/img/img-33.jpg" },
  { key: "ambar", label: "Ámbar Certificado", icon: "diamond", image: "/img/img-39.jpg" },
  { key: "miel", label: "Miel Melipona", icon: "hive", image: "/img/img-42.jpg" },
  { key: "gastronomia", label: "Quesos y Sabores", icon: "restaurant", image: "/img/img-40.jpg" },
];

export default async function HomePage() {
  const { lang, t } = await getTranslator();
  const meta = langMeta(lang);
  const [producersData, catalogData] = await Promise.all([
    serverGet<{ producers: Producer[] }>("/api/producers"),
    serverGet<{ products: Product[]; producers: Producer[] }>("/api/catalog"),
  ]);
  const producers = (producersData?.producers ?? []).slice(0, 6);
  const producerById = new Map((catalogData?.producers ?? []).map((p) => [p.id, p]));
  const products = (catalogData?.products ?? [])
    .filter((p) => p.featured === 1 || ["cafe", "textil", "ambar"].includes(p.category))
    .slice(0, 3)
    .map((product) => ({ product, producer: producerById.get(product.producer_id) }));

  return (
    <main className="w-full pt-36 bg-surface">
      {meta.beta && (
        <div className="bg-tertiary-fixed/50 border-b border-tertiary-container/20 px-4 py-2">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <p className="font-label-sm text-label-sm text-on-tertiary-fixed">
              {t("lang.partial", { lang: meta.label })}
            </p>
            <Link href="/lenguas" className="font-label-sm text-label-sm text-secondary font-bold hover:underline">
              {t("lang.help")} →
            </Link>
          </div>
        </div>
      )}

      {/* HERO */}
      <section className="relative w-full overflow-hidden bg-surface-container-low">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 lg:py-14 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 flex flex-col">
            <span className="inline-flex w-fit items-center gap-2 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm uppercase tracking-wider">
              <span className="material-symbols-outlined text-sm">local_florist</span>
              {t("home.badge")}
            </span>
            <h1 className="font-display-lg text-display-lg text-primary tracking-tight mt-3 text-balance">
              {t("home.title")}
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant mt-3 max-w-xl">{t("home.subtitle")}</p>
            <div className="flex flex-wrap items-center gap-3 mt-6">
              <Link
                href="/marketplace"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-bold shadow-md hover:bg-surface-tint transition-colors"
              >
                <span className="material-symbols-outlined text-lg">storefront</span>
                {t("home.ctaMarket")}
              </Link>
              <Link
                href="/mapa"
                className="inline-flex items-center gap-2 px-4 py-3 rounded-lg bg-surface-container-lowest text-primary font-label-md text-label-md shadow-sm hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-lg text-secondary">map</span>
                {t("home.ctaMap")}
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-8 max-w-xl">
              {[
                ["124", t("home.trust1")],
                ["0%", t("home.trust2")],
                ["100%", t("home.trust3")],
              ].map(([value, label]) => (
                <div key={label} className="rounded-xl bg-surface-container-lowest px-3 py-2.5 shadow-sm">
                  <p className="font-headline-sm text-headline-sm text-primary font-bold leading-none">{value}</p>
                  <p className="font-label-sm text-[10px] text-outline mt-1 leading-tight">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6 relative">
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
              <Image
                src="/img/img-08-hero.jpg"
                alt="Cafetales de altura en la niebla de Chiapas"
                fill
                sizes="(max-width: 1024px) 100vw, 600px"
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/70 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-on-primary hidden sm:block">
                <p className="font-label-sm text-[10px] uppercase tracking-widest text-primary-fixed-dim">Los Altos · Pantelhó</p>
                <p className="font-headline-sm text-headline-sm font-bold">Café de sombra, cosecha a mano</p>
              </div>
            </div>
            <div className="absolute -bottom-4 right-4 bg-surface-container-lowest rounded-xl shadow-lg px-4 py-3 flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center">
                <span className="material-symbols-outlined">verified</span>
              </span>
              <div>
                <p className="font-label-md text-label-md text-primary font-bold">100% trazabilidad</p>
                <p className="font-label-sm text-[10px] text-outline">Comunidad, oficio y origen</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-5">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight">{t("home.categories")}</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">{t("home.categoriesSub")}</p>
          </div>
          <Link href="/marketplace" className="font-label-md text-label-md text-secondary hover:underline">
            {t("home.viewAll")} →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
          {CATEGORIES.map((category) => (
            <Link
              key={category.key}
              href={`/marketplace?categoria=${category.key}`}
              className="group relative h-40 rounded-xl overflow-hidden shadow-sm"
            >
              <Image src={category.image} alt={category.label} fill sizes="(max-width: 768px) 50vw, 240px" className="object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/85 via-primary/20 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 text-on-primary">
                <span className="material-symbols-outlined text-secondary-fixed">{category.icon}</span>
                <p className="font-title-md text-title-md font-bold leading-tight">{category.label}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED PRODUCERS */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8 pb-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-5">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight">{t("home.featured")}</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">{t("home.featuredSub")}</p>
          </div>
          <Link href="/productores" className="font-label-md text-label-md text-secondary hover:underline">
            {t("home.viewAll")} →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {producers.map((producer) => (
            <Link
              key={producer.id}
              href={`/negocio/${producer.slug}`}
              className="group bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="relative h-36">
                <Image src={producer.cover} alt={producer.name} fill sizes="(max-width:1024px) 100vw, 380px" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/70 to-transparent" />
                <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface/90 text-primary font-label-sm text-label-sm">
                  <span className="material-symbols-outlined text-xs text-secondary">location_on</span>
                  {producer.municipality.split(" / ")[0]}
                </span>
              </div>
              <div className="p-4 flex gap-3">
                <Image src={producer.avatar} alt={producer.name} width={56} height={56} className="w-14 h-14 rounded-full object-cover -mt-9 ring-4 ring-surface-container-lowest shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <h3 className="font-title-md text-title-md text-primary font-bold truncate">{producer.name}</h3>
                    <span className="material-symbols-outlined text-secondary text-sm">verified</span>
                  </div>
                  <p className="font-label-sm text-label-sm text-secondary truncate">{producer.tagline}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-amber-700">
                      <span className="material-symbols-outlined text-sm fill-1 text-amber-600">star</span>
                      {producer.rating.toFixed(1)}
                    </span>
                    <span className="font-label-sm text-label-sm text-outline">({producer.review_count})</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* PRODUCT SPOTLIGHT */}
      {products.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 lg:px-8 pb-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {products.map(({ product, producer }) => (
              <Link
                key={product.id}
                href={producer ? `/negocio/${producer.slug}` : "/marketplace"}
                className="group bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex"
              >
                <div className="relative w-28 shrink-0">
                  <Image src={product.image} alt={product.name} fill sizes="120px" className="object-cover" />
                </div>
                <div className="p-3 min-w-0">
                  <p className="font-label-sm text-[10px] text-secondary uppercase font-bold">{producer?.name}</p>
                  <p className="font-title-md text-sm text-primary font-bold line-clamp-2 group-hover:text-secondary transition-colors">{product.name}</p>
                  <p className="font-headline-sm text-headline-sm text-primary font-bold mt-1">${product.price} <span className="text-xs font-normal">MXN</span></p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* LANGUAGES */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8 pb-10">
        <div className="relative overflow-hidden rounded-2xl bg-primary text-on-primary p-7 lg:p-9 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-container text-secondary-fixed font-label-sm text-label-sm uppercase tracking-wider">
              <span className="material-symbols-outlined text-sm">translate</span>
              Bats'i k'op · Bats'il k'op · Lakty'an
            </span>
            <h2 className="font-headline-lg text-headline-lg mt-3">{t("home.languages")}</h2>
            <p className="font-body-md text-body-md text-primary-fixed mt-2 max-w-2xl">{t("home.languagesSub")}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              {["Tseltal", "Tsotsil", "Ch'ol", "Zoque", "Tojolabal", "Mam", "Lacandón", "Mochó"].map((language) => (
                <span key={language} className="px-2.5 py-1 rounded-full bg-primary-container text-primary-fixed font-label-sm text-label-sm">
                  {language}
                </span>
              ))}
            </div>
            <Link
              href="/lenguas"
              className="inline-flex items-center gap-2 mt-5 px-4 py-2.5 rounded-lg bg-surface-container-lowest text-primary font-label-md text-label-md font-bold"
            >
              {t("home.languagesCta")} <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
          </div>
          <div className="lg:col-span-4 flex justify-center">
            <div className="w-40 h-40 rounded-full border border-secondary/40 flex flex-col items-center justify-center text-center">
              <span className="font-display-lg text-display-lg text-secondary-fixed font-bold leading-none">12</span>
              <span className="font-label-sm text-label-sm text-primary-fixed-dim mt-1">lenguas<br />originarias</span>
            </div>
          </div>
        </div>
      </section>

      {/* HOW + SELLER */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8 pb-14 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
          <h2 className="font-headline-sm text-headline-sm text-primary">{t("home.how")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {[
              ["search", t("home.step1"), t("home.step1Sub")],
              ["forum", t("home.step2"), t("home.step2Sub")],
              ["payments", t("home.step3"), t("home.step3Sub")],
              ["local_shipping", t("home.step4"), t("home.step4Sub")],
            ].map(([icon, title, sub], index) => (
              <div key={title} className="flex gap-3">
                <span className="w-9 h-9 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-lg">{icon}</span>
                </span>
                <div>
                  <p className="font-label-md text-label-md text-primary font-bold">
                    0{index + 1}. {title}
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-5 bg-secondary-container/40 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <span className="material-symbols-outlined text-3xl text-secondary">storefront</span>
            <h2 className="font-headline-sm text-headline-sm text-on-secondary-container mt-2">{t("home.seller")}</h2>
            <p className="font-body-sm text-body-sm text-on-secondary-fixed-variant mt-1">{t("home.sellerSub")}</p>
          </div>
          <Link
            href="/acceso?rol=productor"
            className="inline-flex items-center justify-center gap-2 mt-4 px-4 py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-bold"
          >
            {t("home.sellerCta")} <span className="material-symbols-outlined text-base">arrow_forward</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
