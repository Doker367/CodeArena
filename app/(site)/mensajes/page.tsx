import type { Metadata } from "next";
import { MessagesClient } from "@/components/MessagesClient";
import { getProducers, getThreads } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Mensajería Directa",
  description: "Conversa directamente con productores verificados de Chiapas. Sin comisiones ni intermediarios.",
};

export const dynamic = "force-dynamic";

export default async function MensajesPage({
  searchParams,
}: {
  searchParams: Promise<{ producer?: string; product?: string }>;
}) {
  const params = await searchParams;
  const threads = getThreads();
  const producers = getProducers();
  return (
    <main className="w-full pt-36 bg-surface">
      <MessagesClient
        initialThreads={threads}
        producers={producers}
        initialProducerSlug={params.producer}
        initialProductId={params.product ? Number(params.product) : undefined}
      />
    </main>
  );
}
