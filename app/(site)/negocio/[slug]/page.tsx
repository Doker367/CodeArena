import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProducerView } from "@/components/ProducerView";
import {
  getProcessSteps,
  getProducerBySlug,
  getProducerProducts,
  getProducers,
  getReviews,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const producer = getProducerBySlug(slug);
  if (!producer) return { title: "Productor no encontrado" };
  return {
    title: `${producer.name} · Origen Chiapas`,
    description: `${producer.name} en ${producer.municipality}, Chiapas. ${producer.tagline}. Compra directa sin intermediarios.`,
  };
}

export default async function ProducerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const producer = getProducerBySlug(slug);
  if (!producer) notFound();

  const products = getProducerProducts(producer.id).filter((p) => p.status === "activo");
  const reviews = getReviews(producer.id);
  const steps = getProcessSteps(producer.id);
  const related = getProducers()
    .filter((p) => p.id !== producer.id && (p.region === producer.region || p.category === producer.category))
    .slice(0, 3);

  const regionLabel =
    producer.region === "Los Altos"
      ? "Región V Altos Tsotsil-Tseltal"
      : producer.region === "De Los Bosques"
        ? "Región VI De Los Bosques"
        : producer.region === "Soconusco"
          ? "Región X Soconusco"
          : producer.region;

  return (
    <main className="w-full pt-36 bg-surface">
      <ProducerView
        producer={producer}
        products={products}
        reviews={reviews}
        steps={steps}
        related={related}
        regionLabel={regionLabel}
      />
    </main>
  );
}
