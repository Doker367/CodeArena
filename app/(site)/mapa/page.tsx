import type { Metadata } from "next";
import { MapExplorer } from "@/components/MapExplorer";
import { getProducers } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Mapa Interactivo de Chiapas",
  description:
    "Explora los micronegocios comunitarios de Chiapas por municipio: café de altura, ámbar de Simojovel, textiles de Zinacantán, queso de Ocosingo y cacao del Soconusco.",
};

export const dynamic = "force-dynamic";

export default function MapaPage() {
  const producers = getProducers();
  return (
    <main className="w-full pt-36 bg-surface">
      <MapExplorer producers={producers} />
    </main>
  );
}
