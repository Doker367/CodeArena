import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountClient } from "@/components/AccountClient";
import { serverGet } from "@/lib/server-api";

export const metadata: Metadata = {
  title: "Mi cuenta",
  description: "Administra tu perfil, idioma, pedidos y accesos comunitarios de Origen Chiapas.",
};

export const dynamic = "force-dynamic";

type Me = { id: number; name: string; email: string; phone: string; role: string; producer_id: number | null };

export default async function CuentaPage() {
  const me = await serverGet<{ user: Me | null }>("/api/auth/me");
  if (!me?.user) redirect("/acceso?next=/cuenta");
  return (
    <main className="w-full pt-36 bg-surface">
      <AccountClient user={me.user} />
    </main>
  );
}
