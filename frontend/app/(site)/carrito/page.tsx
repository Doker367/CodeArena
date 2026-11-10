import type { Metadata } from "next";
import { CartClient } from "@/components/CartClient";

export const metadata: Metadata = {
  title: "Carrito y Pedido Directo",
  description: "Formaliza tu compra directa con productores de Chiapas: 0% comisiones, pago y entrega acordados en WhatsApp.",
};

export default function CarritoPage() {
  return (
    <main className="w-full pt-36 bg-surface">
      <CartClient />
    </main>
  );
}
