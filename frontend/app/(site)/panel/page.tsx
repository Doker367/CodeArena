import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SellerPanel, type SellerPanelData } from "@/components/SellerPanel";
import { serverGet } from "@/lib/server-api";

export const metadata: Metadata = {
  title: "Panel del Emprendedor",
  description: "Gestiona tu catálogo, pedidos, preguntas y ubicación en el marketplace comunitario de Chiapas.",
};

export const dynamic = "force-dynamic";

type Me = { id: number; name: string; role: string; producer_id: number | null };

export default async function PanelPage() {
  const [initial, me] = await Promise.all([
    serverGet<SellerPanelData>("/api/seller"),
    serverGet<{ user: Me | null }>("/api/auth/me"),
  ]);
  if (!initial) notFound();

  const user = me?.user ?? null;

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
