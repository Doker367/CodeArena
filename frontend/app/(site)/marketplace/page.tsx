import type { Metadata } from "next";
import { MarketplaceView } from "@/components/MarketplaceView";
import { serverGet } from "@/lib/server-api";
import type { Producer, Product } from "@/lib/types";

export const metadata: Metadata = {
  title: "Mercado Directo de Chiapas",
  description:
    "148 productos de café de altura, ámbar certificado, textiles, miel melipona y gastronomía. Precios directos de taller, parcela y telar, sin comisiones.",
};

export const dynamic = "force-dynamic";

type Catalog = {
  products: Product[];
  total: number;
  producers: Producer[];
  featured: { product: Product; producer: Producer } | null;
};

const REGIONS: Record<string, string> = {
  sancristobal: "San Cristóbal",
  tuxtla: "Tuxtla",
  palenque: "Palenque",
  comitan: "Comitán",
  tapachula: "Tapachula",
  chiapa: "Chiapa de Corzo",
};

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; region?: string; categoria?: string }>;
}) {
  const params = await searchParams;
  const data = (await serverGet<Catalog>("/api/catalog")) ?? {
    products: [],
    total: 0,
    producers: [],
    featured: null,
  };

  const producerById = new Map(data.producers.map((p) => [p.id, p]));
  const cards = data.products
    .map((product) => {
      const producer = producerById.get(product.producer_id);
      return producer ? { product, producer } : null;
    })
    .filter((card): card is { product: Product; producer: Producer } => card !== null);

  return (
    <main className="w-full pt-36 bg-surface">
      <MarketplaceView
        initialQuery={params.q ?? ""}
        initialCategory={params.categoria ?? "todos"}
        initialMunicipality={params.region ? REGIONS[params.region] : undefined}
        cards={cards}
        producers={data.producers}
        featured={data.featured}
      />
    </main>
  );
}
