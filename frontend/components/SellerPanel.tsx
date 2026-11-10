"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "./CartProvider";
import { money } from "@/lib/format";
import type { Producer, Product } from "@/lib/types";

export type SellerOrder = {
  id: number;
  code: string;
  name: string;
  phone: string;
  total: number;
  status: string;
  note: string;
  created_at: string;
};

export type Question = {
  id: number;
  author: string;
  location: string;
  body: string;
  answer: string | null;
  created_at: string;
};

export type SellerPanelData = {
  producer: Producer;
  stats: { products: number; active: number; stock: number; questions: number };
  products: Product[];
  orders: SellerOrder[];
  questions: Question[];
};

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  "Por preparar": { label: "🟡 Por preparar", className: "bg-surface-container-highest text-on-surface" },
  "Listo para entrega": { label: "🟢 Listo para entrega", className: "bg-secondary-container text-on-secondary-container" },
  Entregado: { label: "⚪ Entregado", className: "bg-surface-container-high text-on-surface-variant" },
  "En camino": { label: "🔵 En camino", className: "bg-secondary-fixed text-on-secondary-fixed" },
};

export function SellerPanel({ initial }: { initial: SellerPanelData }) {
  const { toast } = useCart();
  const [data, setData] = useState<SellerPanelData>(initial);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({ price: 0, stock: 0 });
  const [addOpen, setAddOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    stock: "",
    unit: "1 kg",
    description: "",
    category: "cafe",
  });
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [saving, setSaving] = useState(false);
  const [showAllProducts, setShowAllProducts] = useState(false);

  const refresh = async () => {
    const response = await fetch("/api/seller", { cache: "no-store" });
    if (response.ok) setData((await response.json()) as SellerPanelData);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const producer = data.producer;
  const visibleProducts = showAllProducts ? data.products : data.products.slice(0, 4);
  const orders = data.orders;
  const pending = orders.filter((o) => o.status === "Por preparar").length;
  const sales = orders.reduce((sum, o) => sum + o.total, 0);

  const setOrderStatus = async (id: number, status: string) => {
    setData((current) => ({
      ...current,
      orders: current.orders.map((o) => (o.id === id ? { ...o, status } : o)),
    }));
    await fetch("/api/seller/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    toast(`Pedido actualizado: ${status}`);
  };

  const toggleProduct = async (product: Product) => {
    const status = product.status === "activo" ? "pausado" : "activo";
    setData((current) => ({
      ...current,
      products: current.products.map((p) => (p.id === product.id ? { ...p, status } : p)),
    }));
    await fetch("/api/seller", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: product.id, status }),
    });
    toast(status === "activo" ? "Producto visible en tu tienda" : "Producto pausado temporalmente");
  };

  const saveProduct = async () => {
    if (!editProduct) return;
    setSaving(true);
    try {
      await fetch("/api/seller", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editProduct.id, price: Number(form.price), stock: Number(form.stock) }),
      });
      await refresh();
      toast("Producto actualizado");
      setEditProduct(null);
    } finally {
      setSaving(false);
    }
  };

  const createProduct = async () => {
    if (!newProduct.name.trim() || Number(newProduct.price) <= 0) {
      toast("Nombre y precio válidos son requeridos", "error");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/seller", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProduct.name,
          price: Number(newProduct.price),
          stock: Number(newProduct.stock || 1),
          unit: newProduct.unit,
          description: newProduct.description,
          category: newProduct.category,
        }),
      });
      if (response.ok) {
        await refresh();
        toast("Nuevo producto publicado en tu tienda");
        setAddOpen(false);
        setNewProduct({ name: "", price: "", stock: "", unit: "1 kg", description: "", category: "cafe" });
      } else {
        toast("No se pudo publicar el producto", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const saveReply = async (id: number) => {
    if (!replyText.trim()) return;
    await fetch("/api/seller/questions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, answer: replyText }),
    });
    setData((current) => ({
      ...current,
      questions: current.questions.map((q) => (q.id === id ? { ...q, answer: replyText } : q)),
    }));
    toast("Respuesta enviada al comprador");
    setReplyTo(null);
    setReplyText("");
  };

  return (
    <div className="flex flex-col w-full">
      <section className="relative w-full bg-surface-container-low px-4 lg:px-8 py-8 md:py-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start md:items-center gap-4">
            <div className="relative shrink-0">
              <Image
                src={producer.avatar}
                alt={producer.name}
                width={80}
                height={80}
                className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover shadow-md"
              />
              <span className="absolute bottom-0 right-0 w-5 h-5 bg-secondary rounded-full flex items-center justify-center text-on-secondary shadow-sm">
                <span className="material-symbols-outlined text-[13px] fill-1">check</span>
              </span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm inline-flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">verified</span> Productor Verificado
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm inline-flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs text-secondary">location_on</span>{" "}
                  {producer.municipality.split(" / ")[0]}
                </span>
              </div>
              <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">
                ¡Buenos días, {producer.slug === "cafetales-don-margarito" ? "Don Margarito" : producer.name.split(" ")[0]}!
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Su negocio <strong className="text-primary font-title-md">{producer.name}</strong> está en línea y visible en el
                Directorio Comunitario.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <Link
              href={`/negocio/${producer.slug}`}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-lg bg-surface-container-lowest text-on-surface shadow-sm hover:bg-surface-variant transition-colors font-label-md text-label-md"
            >
              <span className="material-symbols-outlined text-secondary">storefront</span>
              <span>Ver mi tienda pública</span>
            </Link>
            <button
              onClick={() => setAddOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-primary text-on-primary shadow-md hover:bg-primary-container transition-all font-label-md text-label-md"
            >
              <span className="material-symbols-outlined text-secondary-fixed">add_circle</span>
              <span>Agregar nuevo producto</span>
            </button>
          </div>
        </div>
      </section>

      <section className="w-full px-4 lg:px-8 -mt-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Visitas este mes</span>
              <span className="p-2 bg-surface-container-low rounded-lg text-primary">
                <span className="material-symbols-outlined text-lg">visibility</span>
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display-lg text-display-lg text-primary">1,420</span>
              <span className="inline-flex items-center text-xs font-semibold text-secondary">
                <span className="material-symbols-outlined text-sm">trending_up</span> +24%
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">Personas viendo sus granos y miel</p>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Pedidos Recibidos</span>
              <span className="p-2 bg-secondary-container/60 rounded-lg text-on-secondary-container">
                <span className="material-symbols-outlined text-lg">inventory_2</span>
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display-lg text-display-lg text-primary">{orders.length}</span>
              <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-[11px]">
                {pending} pendientes
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">Para recoger en taller o envío</p>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Consultas WhatsApp</span>
              <span className="p-2 bg-secondary-container rounded-lg text-secondary">
                <span className="material-symbols-outlined text-lg">chat</span>
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display-lg text-display-lg text-primary">56</span>
              <span className="inline-flex items-center text-xs font-semibold text-secondary">
                <span className="material-symbols-outlined text-sm">question_answer</span> +12 hoy
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">Contacto directo cliente a artesano</p>
          </div>

          <div className="bg-primary text-on-primary rounded-xl p-5 shadow-md flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="font-label-sm text-label-sm text-secondary-fixed uppercase tracking-wider">Ventas Directas</span>
              <span className="p-1.5 bg-primary-container rounded-lg text-secondary-fixed">
                <span className="material-symbols-outlined text-lg">payments</span>
              </span>
            </div>
            <div className="flex items-baseline gap-1 my-1">
              <span className="font-headline-lg text-headline-lg text-white font-bold">{money(sales)}</span>
              <span className="font-label-sm text-label-sm text-primary-fixed-dim">MXN</span>
            </div>
            <div className="inline-flex items-center gap-1 text-xs text-secondary-fixed bg-primary-container/80 px-2 py-1 rounded w-fit">
              <span className="material-symbols-outlined text-xs">savings</span>
              <span>0% comisiones bancarias o abusivas</span>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full px-4 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4">
                <div>
                  <h2 className="font-headline-sm text-headline-sm text-primary">Pedidos Recientes</h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Entregas de café tostado, miel de azahar y lotes locales
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-surface-container text-on-surface font-label-sm text-label-sm">
                  <span className="w-2 h-2 rounded-full bg-secondary" /> {pending} listos para preparar
                </span>
              </div>

              <div className="space-y-3">
                {orders.map((order, index) => {
                  const initials = order.name
                    .split(" ")
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();
                  return (
                    <div key={order.id} className="p-4 bg-surface-container-low rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold ${
                            index % 3 === 0
                              ? "bg-secondary-container text-on-secondary-container"
                              : index % 3 === 1
                                ? "bg-primary-container text-primary-fixed"
                                : "bg-surface-variant text-on-surface-variant"
                          }`}
                        >
                          {initials}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-title-md text-title-md text-primary">{order.name}</span>
                            <span className="text-xs text-outline font-label-sm">#{order.code}</span>
                          </div>
                          <p className="font-body-sm text-body-sm text-on-surface">{order.note || "Pedido comunitario directo"}</p>
                          <span className="font-label-sm text-label-sm text-outline">
                            {new Date(order.created_at).toLocaleDateString("es-MX", { day: "numeric", month: "long" })} • Entrega directa acordada
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                        {order.status === "Entregado" ? (
                          <span className="px-3 py-2 rounded-lg bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm inline-flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm text-secondary">done_all</span> Entregado
                          </span>
                        ) : (
                          <select
                            value={order.status}
                            onChange={(e) => setOrderStatus(order.id, e.target.value)}
                            className={`font-label-sm text-label-sm px-3 py-2 rounded-lg cursor-pointer focus:outline-none ${
                              STATUS_MAP[order.status]?.className ?? "bg-surface-container-highest text-on-surface"
                            }`}
                          >
                            <option value="Por preparar">🟡 Por preparar</option>
                            <option value="Listo para entrega">🟢 Listo para entrega</option>
                            <option value="En camino">🔵 En camino</option>
                            <option value="Entregado">⚪ Entregado</option>
                          </select>
                        )}
                        <a
                          href={`https://wa.me/${order.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                            `Hola ${order.name}, le escribo de ${producer.name} por su pedido ${order.code}.`,
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-secondary text-on-secondary hover:bg-secondary/90 transition-colors font-label-sm text-label-sm"
                        >
                          <span className="material-symbols-outlined text-sm">chat</span>
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4">
                <div>
                  <h2 className="font-headline-sm text-headline-sm text-primary">Mi Catálogo de Productos</h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Modifique precios o pause disponibilidad fácilmente con un clic
                  </p>
                </div>
                <span className="font-label-sm text-label-sm text-outline">
                  Mostrando {visibleProducts.length} de {data.stats.products} productos
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-body-sm text-body-sm">
                  <thead>
                    <tr className="text-outline font-label-sm text-label-sm uppercase bg-surface-container-low/70">
                      <th className="py-3 px-3 rounded-l-lg">Producto</th>
                      <th className="py-3 px-3">Precio</th>
                      <th className="py-3 px-3">Stock Disponible</th>
                      <th className="py-3 px-3">Estado</th>
                      <th className="py-3 px-3 text-right rounded-r-lg">Acción Rápida</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container">
                    {visibleProducts.map((product) => (
                      <tr key={product.id} className={`hover:bg-surface-container-low/40 transition-colors ${product.status !== "activo" ? "opacity-75" : ""}`}>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <Image
                              src={product.image}
                              alt={product.name}
                              width={48}
                              height={48}
                              className="w-12 h-12 rounded-lg object-cover shadow-sm shrink-0"
                            />
                            <div>
                              <p className="font-title-md text-title-md text-primary leading-tight">{product.name}</p>
                              <span className={`font-label-sm text-label-sm ${product.status === "activo" ? "text-secondary" : "text-outline"}`}>
                                {product.short}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-semibold text-primary whitespace-nowrap">{money(product.price)} MXN</td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 font-medium ${
                              product.stock === 0 ? "text-outline" : product.stock <= 2 ? "text-tertiary-container" : "text-on-surface"
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                product.stock === 0 ? "bg-outline" : product.stock <= 2 ? "bg-tertiary-container" : "bg-secondary"
                              }`}
                            />
                            {product.stock} {product.unit === "1 kg" ? "kg" : product.unit}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <button
                            onClick={() => toggleProduct(product)}
                            className={`px-2.5 py-1 rounded-full font-label-sm text-label-sm inline-flex items-center gap-1 cursor-pointer ${
                              product.status === "activo"
                                ? "bg-secondary-container text-on-secondary-container"
                                : "bg-surface-container-highest text-on-surface-variant"
                            }`}
                          >
                            <span className="material-symbols-outlined text-xs">
                              {product.status === "activo" ? "toggle_on" : "toggle_off"}
                            </span>
                            {product.status === "activo" ? "Activo" : "Pausado"}
                          </button>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => {
                              setEditProduct(product);
                              setForm({ price: product.price, stock: product.stock });
                            }}
                            className="p-2 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors"
                            title="Editar precio o cantidad"
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 pt-3 flex flex-col sm:flex-row items-center justify-between text-xs text-on-surface-variant gap-2">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-secondary">info</span>
                  Al pausar un producto no se eliminará de su tienda, solo se ocultará a los compradores temporales.
                </span>
                <button
                  onClick={() => setShowAllProducts((v) => !v)}
                  className="text-secondary font-label-sm text-label-sm hover:underline font-semibold"
                >
                  {showAllProducts ? "Ver menos ←" : "Ver inventario completo →"}
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-headline-sm text-headline-sm text-primary">Preguntas Nuevas</h2>
                <span className="w-6 h-6 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm flex items-center justify-center font-bold">
                  {data.questions.filter((q) => !q.answer).length}
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">
                Responda rápido para que los compradores confirmen su compra con confianza.
              </p>
              <div className="space-y-4">
                {data.questions.map((q) => (
                  <div key={q.id} className="p-3.5 bg-surface-container-low rounded-xl">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-primary">
                        {q.author} ({q.location})
                      </span>
                      <span className="text-outline font-label-sm">
                        {new Date(q.created_at).toDateString() === new Date().toDateString()
                          ? new Date(q.created_at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false })
                          : new Date(q.created_at).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface mb-2">“{q.body}”</p>
                    {q.answer ? (
                      <div className="p-2 rounded-lg bg-surface-container-lowest">
                        <p className="font-label-sm text-label-sm text-secondary font-bold">Tu respuesta</p>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">{q.answer}</p>
                      </div>
                    ) : replyTo === q.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          rows={2}
                          placeholder="Escribe tu respuesta directa..."
                          className="w-full px-2.5 py-2 rounded-lg bg-surface-container-lowest font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveReply(q.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm"
                          >
                            Enviar respuesta
                          </button>
                          <button onClick={() => setReplyTo(null)} className="px-2 py-1.5 font-label-sm text-label-sm text-outline">
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setReplyTo(q.id);
                            setReplyText("");
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm hover:bg-primary-container transition-colors"
                        >
                          <span className="material-symbols-outlined text-xs">reply</span> Responder ahora
                        </button>
                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(`Hola ${q.author}, le respondo desde ${producer.name}: `)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg bg-surface-container-high text-on-surface hover:text-secondary"
                        >
                          <span className="material-symbols-outlined text-sm">chat</span>
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-headline-sm text-headline-sm text-primary">Tu Ubicación en Chiapas</h2>
                  <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm">
                    En el Mapa
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mb-3">
                  Visible para turistas y compradores en la sección <strong>Mapa de Chiapas</strong>.
                </p>
                <div className="relative w-full h-40 rounded-xl overflow-hidden shadow-inner mb-4 flex items-end p-3">
                  <Image src="/img/img-28.jpg" alt="Ubicación de San Cristóbal de Las Casas" fill sizes="400px" className="object-cover" />
                  <div className="relative bg-surface/90 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-sm">location_on</span>
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-primary font-bold">Barrio El Cerrillo</span>
                      <span className="font-body-sm text-[11px] text-on-surface-variant leading-none">San Cristóbal de Las Casas</span>
                    </div>
                  </div>
                </div>
                <div className="bg-surface-container-low rounded-lg p-3 space-y-2 mb-4 font-body-sm text-body-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-on-surface-variant font-medium">Horario de Taller:</span>
                    <span className="text-primary font-semibold">Lunes a Sábado: 8:00 - 18:00</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-secondary font-medium">
                    <span>Abierto hoy para visitas</span>
                    <span className="w-2 h-2 rounded-full bg-secondary" />
                  </div>
                </div>
              </div>
              <div className="p-4 bg-primary-container text-on-primary rounded-xl flex items-center justify-between gap-3">
                <div className="flex flex-col">
                  <span className="font-title-md text-title-md text-white">Cartel QR para su puesto</span>
                  <p className="font-body-sm text-[12px] text-primary-fixed-dim">
                    Imprima el cartel oficial con QR para que clientes en su puesto o mercado le compren en línea con
                    celular.
                  </p>
                </div>
                <button
                  onClick={() => window.print()}
                  className="shrink-0 p-3 bg-secondary-fixed text-on-secondary-fixed rounded-lg hover:bg-secondary-fixed-dim transition-colors shadow-sm flex items-center justify-center"
                  title="Imprimir Cartel QR"
                >
                  <span className="material-symbols-outlined text-xl">qr_code_2</span>
                </button>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-container-low flex items-center gap-3">
              <span className="material-symbols-outlined text-2xl text-secondary">support_agent</span>
              <div className="flex flex-col">
                <span className="font-title-md text-title-md text-primary">¿Dudas con la plataforma?</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Llama gratis a la mesa comunitaria de apoyo: <strong className="text-primary">800-CHIAPAS-DIR</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {editProduct && (
        <div className="fixed inset-0 z-50 bg-primary/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setEditProduct(null)}>
          <div className="bg-surface-container-lowest rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-headline-sm text-headline-sm text-primary">Actualizar Producto</h3>
              <button onClick={() => setEditProduct(null)} className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">Editando: {editProduct.name}</p>
            <div className="space-y-4">
              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-1">Precio Directo (MXN)</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low text-on-surface border-0 focus:ring-2 focus:ring-secondary focus:outline-none font-title-md"
                />
              </div>
              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-1">Unidades Disponibles (Stock)</label>
                <input
                  type="number"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low text-on-surface border-0 focus:ring-2 focus:ring-secondary focus:outline-none font-title-md"
                />
              </div>
              <button
                onClick={saveProduct}
                disabled={saving}
                className="w-full py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-secondary transition-colors disabled:opacity-60"
              >
                {saving ? "Guardando…" : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}

      {addOpen && (
        <div className="fixed inset-0 z-50 bg-primary/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setAddOpen(false)}>
          <div className="bg-surface-container-lowest rounded-2xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-headline-sm text-headline-sm text-primary">Agregar nuevo producto</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Se publicará directo en tu tienda comunitaria.</p>
              </div>
              <button onClick={() => setAddOpen(false)} className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block font-label-sm text-label-sm text-on-surface mb-1">Nombre del producto *</label>
                <input
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="Ej. Café de Altura Natural 1kg"
                  className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface mb-1">Precio (MXN) *</label>
                  <input
                    type="number"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    placeholder="240"
                    className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                  />
                </div>
                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface mb-1">Stock</label>
                  <input
                    type="number"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                    placeholder="20"
                    className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface mb-1">Unidad</label>
                  <input
                    value={newProduct.unit}
                    onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                  />
                </div>
                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface mb-1">Categoría</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                  >
                    <option value="cafe">Café de Altura</option>
                    <option value="textil">Textiles</option>
                    <option value="ambar">Ámbar</option>
                    <option value="miel">Miel</option>
                    <option value="gastronomia">Gastronomía</option>
                    <option value="artesania">Artesanía</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-label-sm text-label-sm text-on-surface mb-1">Descripción corta</label>
                <textarea
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  rows={2}
                  placeholder="Notas de cata, proceso, origen..."
                  className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>
              <button
                onClick={createProduct}
                disabled={saving}
                className="w-full py-3 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-secondary transition-colors disabled:opacity-60"
              >
                {saving ? "Publicando…" : "Publicar producto"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
