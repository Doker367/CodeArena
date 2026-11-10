import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProducerView } from "@/components/ProducerView";
import { serverGet } from "@/lib/server-api";
import type { Producer, Product } from "@/lib/types";

export const dynamic = "force-dynamic";

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

type ProducerPayload = {
  producer: Producer;
  products: Product[];
  reviews: Review[];
  steps: Step[];
  related: Producer[];
  regionLabel: string;
};

const path = (slug: string) => `/api/producers/${encodeURIComponent(slug)}`;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await serverGet<ProducerPayload>(path(slug));
  if (!data) return { title: "Productor no encontrado" };
  return {
    title: `${data.producer.name} · Origen Chiapas`,
    description: `${data.producer.name} en ${data.producer.municipality}, Chiapas. ${data.producer.tagline}. Compra directa sin intermediarios.`,
  };
}

export default async function ProducerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await serverGet<ProducerPayload>(path(slug));
  if (!data) notFound();

  return (
    <main className="w-full pt-36 bg-surface">
      <ProducerView
        producer={data.producer}
        products={data.products}
        reviews={data.reviews}
        steps={data.steps}
        related={data.related}
        regionLabel={data.regionLabel}
      />
    </main>
  );
}
