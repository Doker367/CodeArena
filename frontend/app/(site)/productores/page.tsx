import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { serverGet } from "@/lib/server-api";
import type { Producer } from "@/lib/types";

export const metadata: Metadata = {
  title: "Productores Verificados",
  description:
    "Directorio de cooperativas, talleres y familias verificadas de Chiapas: café, ámbar, textiles, miel, cacao y gastronomía.",
};

export const dynamic = "force-dynamic";

export default async function ProductoresPage() {
  const data = await serverGet<{ producers: Producer[] }>("/api/producers");
  const producers = data?.producers ?? [];

  return (
    <main className="w-full pt-36 bg-surface">
      <section className="bg-surface-container-low py-space-xl px-4 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm uppercase tracking-wider">
            <span className="material-symbols-outlined text-sm">verified</span> Red de confianza comunitaria
          </span>
          <h1 className="font-display-lg text-display-lg text-primary tracking-tight mt-2">Productores Verificados</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl mt-2">
            Cada negocio fue visitado y avalado por su asamblea comunitaria. Conoce a las familias, cooperativas y
            talleres que sostienen el marketplace.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {producers.map((p) => (
            <article key={p.id} className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden group">
              <div className="relative h-40 overflow-hidden">
                <Image src={p.cover} alt={p.name} fill sizes="(max-width:1024px) 100vw, 380px" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/70 to-transparent" />
                <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface/90 text-primary font-label-sm text-label-sm">
                  <span className="material-symbols-outlined text-xs text-secondary">location_on</span>
                  {p.municipality.split(" / ")[0]}
                </span>
              </div>
              <div className="p-4 flex gap-3">
                <Image src={p.avatar} alt={p.name} width={56} height={56} className="w-14 h-14 rounded-full object-cover -mt-9 ring-4 ring-surface-container-lowest shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <h2 className="font-title-md text-title-md text-primary font-bold truncate">{p.name}</h2>
                    <span className="material-symbols-outlined text-secondary text-sm">verified</span>
                  </div>
                  <p className="font-label-sm text-label-sm text-secondary truncate">{p.kind}</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 mt-1">{p.tagline}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-amber-700">
                      <span className="material-symbols-outlined text-sm fill-1 text-amber-600">star</span>
                      {p.rating.toFixed(1)} <span className="text-outline">({p.review_count})</span>
                    </span>
                    <Link href={`/negocio/${p.slug}`} className="px-2.5 py-1 rounded bg-primary text-on-primary font-label-sm text-label-sm">
                      Ver ficha
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
