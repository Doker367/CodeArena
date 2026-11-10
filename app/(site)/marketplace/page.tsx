import type { Metadata } from "next";
import { MarketplaceView } from "@/components/MarketplaceView";
import { getFeaturedProduct, getProducers, getProducts } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Mercado Directo de Chiapas",
  description:
    "148 productos de café de altura, ámbar certificado, textiles, miel melipona y gastronomía. Precios directos de taller, parcela y telar, sin comisiones.",
};

export const dynamic = "force-dynamic";

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; region?: string; categoria?: string }>;
}) {
  const params = await searchParams;
  const REGIONS: Record<string, string> = {
    sancristobal: "San Cristóbal",
    tuxtla: "Tuxtla",
    palenque: "Palenque",
    comitan: "Comitán",
    tapachula: "Tapachula",
    chiapa: "Chiapa de Corzo",
  };
  const { items: products } = getProducts({ limit: 48 });
  const producers = getProducers();
  const featured = getFeaturedProduct();
  const producerById = new Map(producers.map((p) => [p.id, p]));

  const cards = products.map((p) => ({
    product: p,
    producer: producerById.get(p.producer_id) ?? producers[0],
  }));

  return (
    <main className="w-full pt-36 bg-surface">
      <MarketplaceView
        initialQuery={params.q ?? ""}
        initialCategory={params.categoria ?? "todos"}
        initialMunicipality={params.region ? REGIONS[params.region] : undefined}
        cards={cards}
        producers={producers}
        featured={
          featured
            ? {
                product: featured.product,
                producer: featured.producer,
              }
            : null
        }
      />
    </main>
  );
}
