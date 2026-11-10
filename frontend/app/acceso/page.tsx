import type { Metadata } from "next";
import { AuthClient } from "@/components/AuthClient";

export const metadata: Metadata = {
  title: "Acceso y Registro Multiusuario",
  description: "Crea tu cuenta como comprador, productor o ecoturismo y únete a la red de comercio justo de Chiapas.",
};

export default async function AccesoPage({
  searchParams,
}: {
  searchParams: Promise<{ rol?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="w-full">
      <AuthClient initialRole={params.rol} />
    </main>
  );
}
