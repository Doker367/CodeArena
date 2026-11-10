import type { Metadata } from "next";
import { MapExplorer } from "@/components/MapExplorer";
import { serverGet } from "@/lib/server-api";
import type { Producer } from "@/lib/types";

export const metadata: Metadata = {
  title: "Mapa Interactivo de Chiapas",
  description:
    "Explora los micronegocios comunitarios de Chiapas por municipio: café de altura, ámbar de Simojovel, textiles de Zinacantán, queso de Ocosingo y cacao del Soconusco.",
};

export const dynamic = "force-dynamic";

export default async function MapaPage() {
  const data = await serverGet<{ producers: Producer[] }>("/api/producers");
  return (
    <main className="w-full pt-36 bg-surface">
      <MapExplorer producers={data?.producers ?? []} />
    </main>
  );
}
