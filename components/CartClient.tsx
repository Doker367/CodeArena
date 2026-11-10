"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useCart } from "./CartProvider";
import { money } from "@/lib/format";

type Delivery = "recoger" | "local" | "nacional";
type Payment = "efectivo" | "spei" | "tarjeta";

const DELIVERY: { key: Delivery; title: string; sub: string; cost: number; badge?: string }[] = [
  {
    key: "recoger",
    title: "Recoger directamente en el taller/local",
    sub: "Acuerdas horario por WhatsApp con Don Margarito (San Cristóbal) y con Telares X'Pakinte (Zinacantán) o punto de entrega en San Cristóbal.",
    cost: 0,
    badge: "Gratis",
  },
  {
    key: "local",
    title: "Entrega local directa en el municipio",
    sub: "Un mandadero o el propio productor te lo lleva directamente a tu domicilio u hotel acordado.",
    cost: 45,
    badge: "+$45 MXN",
  },
  {
    key: "nacional",
    title: "Envío nacional por paquetería consolidada",
    sub: "Guía rastreable (Estafeta / Redpack / Correos de México) directo a cualquier estado de la República Mexicana.",
    cost: 120,
    badge: "+$120 MXN",
  },
];

const PAYMENT: { key: Payment; title: string; sub: string; badge?: string }[] = [
  {
    key: "efectivo",
    title: "Efectivo contra entrega personal",
    sub: "Pagas al momento de recibir tus piezas o al visitarlos en su taller comunitario.",
  },
  {
    key: "spei",
    title: "Transferencia directa SPEI (Recomendado)",
    sub: "Recibirás el CLABE bancaria personal del artesano/cooperativa vía WhatsApp para comprobante inmediato.",
    badge: "100% al productor",
  },
  {
    key: "tarjeta",
    title: "Tarjeta de Débito / Crédito",
    sub: "Terminal punto de venta portátil o link de cobro digital CLIP/MercadoPago directo del productor.",
  },
];

export function CartClient() {
  const { cart, update, remove, refresh, toast } = useCart();
  const [delivery, setDelivery] = useState<Delivery>("recoger");
  const [payment, setPayment] = useState<Payment>("efectivo");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    note: "",
  });
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [editingNote, setEditingNote] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{
    code: string;
    total: number;
    producers: { name: string; whatsapp: string }[];
  } | null>(null);

  const groups = useMemo(() => {
    const map = new Map<number, { producer: (typeof cart.lines)[number]["producer"]; lines: typeof cart.lines }>();
    for (const line of cart.lines) {
      const current = map.get(line.producer.id);
      if (current) current.lines.push(line);
      else map.set(line.producer.id, { producer: line.producer, lines: [line] });
    }
    return Array.from(map.values());
  }, [cart.lines]);

  const deliveryCost = DELIVERY.find((d) => d.key === delivery)?.cost ?? 0;
  const total = cart.subtotal + deliveryCost;

  const submit = async () => {
    if (!form.name.trim() || !form.phone.trim() || !form.email.trim() || !form.address.trim()) {
      setError("Completa nombre, WhatsApp, correo y dirección de entrega para formalizar el pedido.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          delivery,
          payment: PAYMENT.find((p) => p.key === payment)?.title ?? payment,
          note: form.note,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "No pudimos crear el pedido.");
        return;
      }
      setSuccess(data);
      await refresh();
      toast("Pedido confirmado. Coordina la entrega por mensaje directo.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-8">
        <div className="max-w-2xl mx-auto bg-surface-container-lowest rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-3xl">check_circle</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-primary mt-4">Pedido confirmado</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Tu pedido <strong className="text-primary">{success.code}</strong> fue enviado directamente a los productores.
            Total a pagar: <strong className="text-primary">{money(success.total)} MXN</strong>.
          </p>
          <div className="mt-6 p-4 rounded-xl bg-secondary-container/40 text-left">
            <p className="font-label-md text-label-md text-on-secondary-container font-bold">Siguiente paso: coordinar entrega</p>
            <p className="font-body-sm text-body-sm text-on-secondary-fixed-variant mt-1">
              Se abrió una conversación de mensajería directa con cada productor. También puedes escribirles por WhatsApp
              para acordar el punto de entrega y la forma de pago.
            </p>
            <div className="flex flex-col gap-2 mt-3">
              {success.producers.map((p) => (
                <a
                  key={p.name + p.whatsapp}
                  href={`https://wa.me/${p.whatsapp}?text=${encodeURIComponent(`Hola, acabo de confirmar el pedido ${success.code} en Origen Chiapas. ¿Coordinamos la entrega?`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-surface-container-lowest text-primary font-label-md text-label-md hover:bg-surface-container transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary">chat</span>
                    {p.name}
                  </span>
                  <span className="material-symbols-outlined text-base">open_in_new</span>
                </a>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <Link href="/mensajes" className="px-4 py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md">
              Ir a mensajes directos
            </Link>
            <Link href="/marketplace" className="px-4 py-2.5 rounded-lg bg-surface-container text-primary font-label-md text-label-md">
              Seguir explorando
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (cart.lines.length === 0) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-16">
        <div className="max-w-lg mx-auto bg-surface-container-lowest rounded-2xl shadow-sm p-10 text-center">
          <span className="material-symbols-outlined text-5xl text-outline">shopping_basket</span>
          <h1 className="font-headline-md text-headline-md text-primary mt-3">Tu carrito está vacío</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Explora café de altura, ámbar, textiles y miel directamente de las familias productoras.
          </p>
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md"
          >
            <span className="material-symbols-outlined text-base">storefront</span> Ir al mercado directo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="bg-surface-container-low border-b border-surface-variant/40">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/marketplace" className="p-2 rounded-lg hover:bg-surface-container transition-colors" aria-label="Volver al mercado">
              <span className="material-symbols-outlined text-primary">arrow_back</span>
            </Link>
            <div>
              <div className="flex items-center gap-2 font-label-sm text-label-sm text-secondary uppercase tracking-wider">
                Acuerdo Comunitario Directo
                <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container">0% Comisiones</span>
              </div>
              <h1 className="font-headline-md text-headline-md text-primary">Tu Carrito y Formalización de Compra</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 font-label-sm text-label-sm">
            {["Carrito", "Datos y Entrega", "WhatsApp Directo"].map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    i === 0 ? "bg-primary text-on-primary" : "bg-surface-container-highest text-on-surface-variant"
                  }`}
                >
                  {i + 1}
                </span>
                <span className={i === 0 ? "text-primary font-bold" : "text-outline"}>{step}</span>
                {i < 2 && <span className="w-8 h-px bg-outline-variant" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="font-title-md text-title-md text-primary">
                Productos en Carrito{" "}
                <span className="font-label-sm text-label-sm text-outline font-normal">
                  {groups.length} micronegocios • {cart.count} artículos
                </span>
              </h2>
              <span className="hidden sm:flex items-center gap-1 font-label-sm text-label-sm text-secondary">
                <span className="material-symbols-outlined text-sm">verified</span> Comercio 100% justo sin retenciones
              </span>
            </div>

            {groups.map(({ producer, lines }) => (
              <div key={producer.id} className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-surface-container-low/60 flex flex-wrap items-center justify-between gap-2 border-b border-surface-container">
                  <div className="flex items-center gap-3">
                    <Image src={producer.avatar} alt={producer.name} width={40} height={40} className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <div className="flex items-center gap-1">
                        <h3 className="font-title-md text-sm text-primary font-bold">{producer.name}</h3>
                        <span className="material-symbols-outlined text-secondary text-sm">verified</span>
                      </div>
                      <p className="font-label-sm text-[11px] text-outline flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">location_on</span>
                        {producer.municipality}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-surface-container-high font-label-sm text-[11px] text-on-surface-variant">
                    <span className="material-symbols-outlined text-xs">local_shipping</span>
                    Entrega directa acordada
                  </span>
                </div>

                {lines.map((line) => (
                  <div key={line.id} className="p-4 flex gap-4 border-b border-surface-container last:border-b-0">
                    <Link href={`/negocio/${producer.slug}`} className="relative w-24 h-24 rounded-lg overflow-hidden shrink-0">
                      <Image src={line.product.image} alt={line.product.name} fill sizes="96px" className="object-cover" />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-title-md text-title-md text-primary font-bold leading-tight">{line.product.name}</h3>
                          <p className="font-label-sm text-label-sm text-outline mt-0.5">
                            {line.product.unit} • Precio directo de taller
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-headline-sm text-headline-sm text-primary font-bold">{money(line.product.price * line.qty)}</p>
                          <p className="font-label-sm text-[11px] text-outline">{money(line.product.price)} c/u</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
                        <div className="flex items-center rounded-lg border border-outline-variant/60 overflow-hidden">
                          <button
                            onClick={() => update(line.id, { qty: line.qty - 1 })}
                            className="w-8 h-8 flex items-center justify-center text-primary hover:bg-surface-container"
                            aria-label="Quitar una unidad"
                          >
                            <span className="material-symbols-outlined text-sm">remove</span>
                          </button>
                          <span className="w-8 text-center font-label-md text-label-md">{line.qty}</span>
                          <button
                            onClick={() => update(line.id, { qty: line.qty + 1 })}
                            className="w-8 h-8 flex items-center justify-center text-primary hover:bg-surface-container"
                            aria-label="Agregar una unidad"
                          >
                            <span className="material-symbols-outlined text-sm">add</span>
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingNote(editingNote === line.id ? null : line.id)}
                            className="inline-flex items-center gap-1 font-label-sm text-label-sm text-secondary hover:underline"
                          >
                            <span className="material-symbols-outlined text-sm">edit_note</span>
                            Instrucción para el productor
                          </button>
                          <button
                            onClick={() => remove(line.id)}
                            className="p-1 text-outline hover:text-error transition-colors"
                            aria-label="Retirar producto"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        </div>
                      </div>

                      {editingNote === line.id ? (
                        <input
                          autoFocus
                          value={notes[line.id] ?? line.note}
                          onChange={(e) => setNotes((n) => ({ ...n, [line.id]: e.target.value }))}
                          onBlur={() => {
                            void update(line.id, { note: notes[line.id] ?? line.note });
                            setEditingNote(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              void update(line.id, { note: notes[line.id] ?? line.note });
                              setEditingNote(null);
                            }
                          }}
                          placeholder="Ej. Molido fino para cafetera moka italiana"
                          className="mt-3 w-full px-3 py-2 rounded-lg bg-surface-container-low font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                        />
                      ) : (
                        line.note && (
                          <p className="mt-3 px-3 py-2 rounded-lg bg-surface-container-low font-body-sm text-body-sm text-on-surface-variant flex items-start gap-2">
                            <span className="material-symbols-outlined text-sm text-secondary">chat</span>
                            {line.note}
                          </p>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}

            <div className="bg-surface-container-low rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="w-12 h-12 rounded-full border-2 border-secondary text-secondary font-bold text-sm flex items-center justify-center">
                  100%
                </span>
                <div>
                  <h4 className="font-title-md text-sm text-primary font-bold">Impacto Económico Directo</h4>
                  <p className="font-body-sm text-xs text-on-surface-variant">
                    El 100% de este importe va a las familias de {groups.map((g) => g.producer.name.split(" ").slice(-1)[0]).join(" y ")}.
                    Sin cobro por publicación ni comisión por transacción.
                  </p>
                </div>
              </div>
              <Link href="/como-funciona#impacto" className="font-label-sm text-label-sm text-secondary hover:underline flex items-center gap-1">
                Conocer modelo de impacto <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
          </div>

          <aside className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4 lg:sticky lg:top-32">
            <div className="bg-surface-container-lowest rounded-xl shadow-sm p-5 flex flex-col gap-5">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm flex items-center justify-center">1</span>
                  <h2 className="font-title-md text-title-md text-primary">Tus Datos de Contacto y Entrega</h2>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="font-label-sm text-label-sm text-on-surface-variant">
                      Nombre Completo <span className="text-error">*</span>
                    </label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Alejandra Ruiz Moreno"
                      className="mt-1 w-full px-3 py-2.5 rounded-lg bg-surface-container-low font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-label-sm text-label-sm text-on-surface-variant">
                        WhatsApp de contacto <span className="text-error">*</span>
                      </label>
                      <div className="relative mt-1">
                        <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-base">call</span>
                        <input
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          placeholder="+52 967 123 4567"
                          className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-surface-container-low font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="font-label-sm text-label-sm text-on-surface-variant">
                        Correo Electrónico <span className="text-error">*</span>
                      </label>
                      <div className="relative mt-1">
                        <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-base">mail</span>
                        <input
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          placeholder="alejandra.ruiz@ejemplo.com"
                          type="email"
                          className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-surface-container-low font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="font-label-sm text-label-sm text-on-surface-variant">
                      Dirección de Entrega o Referencia <span className="text-error">*</span>
                    </label>
                    <div className="relative mt-1">
                      <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-base">location_on</span>
                      <input
                        value={form.address}
                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                        placeholder="Calle Real de Guadalupe #45, Barrio de Guadalupe, San Cristóbal"
                        className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-surface-container-low font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm flex items-center justify-center">2</span>
                    <h2 className="font-title-md text-title-md text-primary">Método de Entrega</h2>
                  </div>
                  <span className="font-label-sm text-label-sm text-outline">Tú decides</span>
                </div>
                <div className="space-y-2">
                  {DELIVERY.map((option) => {
                    const active = delivery === option.key;
                    return (
                      <label
                        key={option.key}
                        className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors border ${
                          active
                            ? "bg-secondary-container/30 border-secondary"
                            : "bg-surface-container-low border-transparent hover:bg-surface-container"
                        }`}
                      >
                        <input
                          type="radio"
                          name="delivery"
                          checked={active}
                          onChange={() => setDelivery(option.key)}
                          className="mt-1 w-4 h-4 accent-secondary"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-label-md text-label-md text-primary">{option.title}</span>
                            <span className={`font-label-sm text-label-sm whitespace-nowrap ${option.cost === 0 ? "text-secondary font-bold" : "text-on-surface"}`}>
                              {option.badge}
                            </span>
                          </div>
                          <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">{option.sub}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm flex items-center justify-center">3</span>
                    <h2 className="font-title-md text-title-md text-primary">Forma de Pago Acordada</h2>
                  </div>
                  <span className="font-label-sm text-label-sm text-outline">Sin comisiones ocultas</span>
                </div>
                <div className="space-y-2">
                  {PAYMENT.map((option) => {
                    const active = payment === option.key;
                    return (
                      <label
                        key={option.key}
                        className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors border ${
                          active ? "bg-secondary-container/30 border-secondary" : "bg-surface-container-low border-transparent hover:bg-surface-container"
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          checked={active}
                          onChange={() => setPayment(option.key)}
                          className="mt-1 w-4 h-4 accent-secondary"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-label-md text-label-md text-primary">{option.title}</span>
                            {option.badge && (
                              <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-[10px] font-bold whitespace-nowrap">
                                {option.badge}
                              </span>
                            )}
                          </div>
                          <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">{option.sub}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-xl bg-surface-container-low p-4">
                <p className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-bold mb-2">Desglose financiero transparente</p>
                <div className="space-y-1.5 font-label-md text-label-md">
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Subtotal productos ({groups.length} vendedores)</span>
                    <span className="text-primary">{money(cart.subtotal)} MXN</span>
                  </div>
                  <div className="flex justify-between text-secondary items-center">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">verified</span> Comisión de plataforma ORIGEN
                    </span>
                    <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-[10px]">$0.00 MXN (100% Libre)</span>
                  </div>
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Costo de envío acordado</span>
                    <span className="text-primary">{money(deliveryCost)} MXN</span>
                  </div>
                </div>
                <div className="border-t border-outline-variant/50 mt-3 pt-3 flex items-end justify-between">
                  <div>
                    <p className="font-title-md text-title-md text-primary font-bold">Total a pagar al artesano</p>
                    <p className="font-label-sm text-[10px] text-outline">Sin cargos adicionales ni intermediación</p>
                  </div>
                  <div className="text-right">
                    <p className="font-headline-lg text-headline-lg text-primary leading-none">{money(total)}</p>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">MXN</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-secondary-container/40 p-3 flex items-start gap-2">
                <span className="material-symbols-outlined text-secondary text-lg shrink-0">volunteer_activism</span>
                <p className="font-body-sm text-xs text-on-secondary-fixed-variant">
                  <strong className="text-on-secondary-container">Soberanía y Trato Directo.</strong> ORIGEN CHIAPAS no retiene
                  tu dinero ni cobra porcentajes a los artesanos. Al confirmar, se abrirá la conversación con los productores
                  por WhatsApp y mensaje para coordinar la entrega y el pago de inmediato.
                </p>
              </div>

              {error && (
                <p className="px-3 py-2 rounded-lg bg-error-container text-on-error-container font-label-sm text-label-sm">{error}</p>
              )}

              <button
                onClick={submit}
                disabled={submitting}
                className="w-full py-3.5 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-bold hover:bg-surface-tint transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <span className="material-symbols-outlined">chat</span>
                {submitting ? "Confirmando pedido…" : "Confirmar Pedido y Contactar al Vendedor"}
              </button>
              <p className="flex items-start gap-1.5 font-label-sm text-[10px] text-outline text-center justify-center">
                <span className="material-symbols-outlined text-xs text-secondary">verified_user</span>
                Comunicación directa y protegida. Apoyo al comercio local y justo de Chiapas.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 bg-surface-container-lowest rounded-xl p-4 shadow-sm">
              {[
                ["handshake", "Trato Humano", "Directo con la comunidad"],
                ["local_florist", "Trazabilidad", "Origen certificado"],
                ["volunteer_activism", "Acompañamiento", "Soporte cívico voluntario"],
              ].map(([icon, title, sub]) => (
                <div key={title} className="flex flex-col items-center text-center gap-1">
                  <span className="material-symbols-outlined text-secondary">{icon}</span>
                  <p className="font-label-sm text-[10px] text-primary font-bold">{title}</p>
                  <p className="font-label-sm text-[9px] text-outline leading-tight">{sub}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
