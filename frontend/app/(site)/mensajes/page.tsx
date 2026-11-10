import type { Metadata } from "next";
import { MessagesClient } from "@/components/MessagesClient";
import { serverGet } from "@/lib/server-api";
import type { Producer, Thread } from "@/lib/types";

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
  const [threadsData, producersData, meData] = await Promise.all([
    serverGet<{ threads: Thread[] }>("/api/messages"),
    serverGet<{ producers: Producer[] }>("/api/producers"),
    serverGet<{ user: { id: number; name: string; role: string } | null }>("/api/auth/me"),
  ]);
  const me = meData?.user
    ? {
        role: meData.user.role === "productor" ? ("producer" as const) : ("buyer" as const),
        name: meData.user.name,
        isProducer: meData.user.role === "productor",
      }
    : null;

  return (
    <main className="w-full pt-36 bg-surface">
      <MessagesClient
        initialThreads={threadsData?.threads ?? []}
        producers={producersData?.producers ?? []}
        initialProducerSlug={params.producer}
        initialProductId={params.product ? Number(params.product) : undefined}
        initialMe={me}
      />
    </main>
  );
}
