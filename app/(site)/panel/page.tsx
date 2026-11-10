import type { Metadata } from "next";
import Link from "next/link";
import { SellerPanel } from "@/components/SellerPanel";
import { getSessionUser } from "@/lib/session";
import {
  getOrdersForProducer,
  getProducerById,
  getProducerProducts,
  getQuestions,
  getRecentOrdersFallback,
  getSellerStats,
} from "@/lib/queries";

export const metadata: Metadata = {
  title: "Panel del Emprendedor",
  description: "Gestiona tu catálogo, pedidos, preguntas y ubicación en el marketplace comunitario de Chiapas.",
};

export const dynamic = "force-dynamic";

export default async function PanelPage() {
  const user = await getSessionUser();
  const producerId = user?.producer_id ?? 1;
  const producer = getProducerById(producerId) ?? getProducerById(1)!;
  const stats = getSellerStats(producer.id);
  const products = getProducerProducts(producer.id);
  const orders = getOrdersForProducer(producer.id);
  const initial = {
    producer,
    stats,
    products,
    orders: orders.length ? orders : getRecentOrdersFallback(),
    questions: getQuestions(producer.id),
  };

  return (
    <main className="w-full pt-36 bg-surface">
      {!user?.producer_id && (
        <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-4">
          <div className="rounded-xl bg-secondary-container/50 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
            <p className="font-label-sm text-label-sm text-on-secondary-container">
              Estás viendo el panel demo de <strong>Don Margarito</strong>. Inicia sesión como productor para administrar tu
              propio negocio.
            </p>
            <div className="flex items-center gap-2">
              <Link href="/acceso" className="px-3 py-1.5 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm">
                Iniciar sesión
              </Link>
              <span className="font-label-sm text-[10px] text-outline">margarito@origenchiapas.mx · demo1234</span>
            </div>
          </div>
        </div>
      )}
      <SellerPanel initial={initial} />
    </main>
  );
}
