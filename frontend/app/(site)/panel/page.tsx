import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { SellerPanel, type SellerPanelData } from "@/components/SellerPanel";
import { serverGet } from "@/lib/server-api";

export const metadata: Metadata = {
  title: "Panel del Emprendedor",
  description: "Gestiona tu catálogo, pedidos, preguntas y ubicación en el marketplace comunitario de Chiapas.",
};

export const dynamic = "force-dynamic";

type Me = { id: number; name: string; role: string; producer_id: number | null };

export default async function PanelPage() {
  const me = await serverGet<{ user: Me | null }>("/api/auth/me");
  if (!me?.user) redirect("/acceso?next=/panel");
  if (!me.user.producer_id) redirect("/cuenta");

  const initial = await serverGet<SellerPanelData>("/api/seller");
  if (!initial) notFound();

  return (
    <main className="w-full pt-36 bg-surface">
      <SellerPanel initial={initial} />
    </main>
  );
}
