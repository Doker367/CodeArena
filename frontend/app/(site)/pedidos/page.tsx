import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { serverGet } from "@/lib/server-api";
import { getTranslator } from "@/lib/i18n-server";
import { money, dateLabel } from "@/lib/format";

export const metadata: Metadata = {
  title: "Mis pedidos",
  description: "Pedidos comunitarios realizados con tu cuenta en Origen Chiapas.",
};

export const dynamic = "force-dynamic";

type OrderItem = { name: string; price: number; qty: number; image: string; producer_name: string };
type Order = {
  id: number;
  code: string;
  total: number;
  status: string;
  delivery_method: string;
  payment_method: string;
  created_at: string;
  items: OrderItem[];
};

export default async function PedidosPage() {
  const { t } = await getTranslator();
  const me = await serverGet<{ user: { id: number } | null }>("/api/auth/me");
  if (!me?.user) redirect("/acceso?next=/pedidos");
  const data = await serverGet<{ orders: Order[] }>("/api/orders");
  const orders = data?.orders ?? [];

  return (
    <main className="w-full pt-36 bg-surface">
      <div className="max-w-5xl mx-auto px-4 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">{t("orders.title")}</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">{t("orders.subtitle")}</p>
          </div>
          <Link href="/marketplace" className="px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md">
            {t("common.shopping")}
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-2xl p-10 text-center shadow-sm">
            <span className="material-symbols-outlined text-5xl text-outline">inventory_2</span>
            <p className="font-body-md text-body-md text-on-surface-variant mt-2">{t("orders.empty")}</p>
            <Link href="/marketplace" className="inline-flex mt-4 px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md">
              {t("common.shopping")}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <article key={order.id} className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-3 bg-surface-container-low flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-title-md text-title-md text-primary font-bold">{order.code}</p>
                    <p className="font-label-sm text-label-sm text-outline">{dateLabel(order.created_at)}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold">
                    {order.status}
                  </span>
                </div>
                <div className="p-5 space-y-3">
                  {order.items.map((item, index) => (
                    <div key={`${order.id}-${index}`} className="flex items-center gap-3">
                      <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0">
                        <Image src={item.image || "/img/img-24.jpg"} alt={item.name} fill sizes="56px" className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-label-md text-label-md text-primary font-bold truncate">{item.name}</p>
                        <p className="font-label-sm text-label-sm text-secondary">{item.producer_name}</p>
                        <p className="font-label-sm text-[10px] text-outline">
                          {item.qty} × {money(item.price)}
                        </p>
                      </div>
                      <span className="font-label-md text-label-md text-primary font-bold">{money(item.qty * item.price)}</span>
                    </div>
                  ))}
                  <div className="pt-3 border-t border-line flex flex-wrap items-center justify-between gap-2">
                    <span className="font-label-sm text-label-sm text-outline">
                      {order.delivery_method} · {order.payment_method}
                    </span>
                    <span className="font-headline-sm text-headline-sm text-primary font-bold">
                      {money(order.total)} <span className="text-xs font-normal">MXN</span>
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
