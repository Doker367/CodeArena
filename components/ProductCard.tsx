"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "./CartProvider";
import { money } from "@/lib/format";
import type { Product } from "@/lib/types";

export type ProductCardProducer = {
  name: string;
  slug: string;
  municipality: string;
  kind?: string;
};

export function ProductCard({
  product,
  producer,
  variant = "grid",
}: {
  product: Product;
  producer: ProductCardProducer;
  variant?: "grid" | "compact";
}) {
  const { add } = useCart();
  const router = useRouter();
  const tags = product.tags.split(",").filter(Boolean);
  const topBadge = tags[1] || product.badge || "100% Hecho en Chiapas";
  const tagTone =
    product.category === "ambar"
      ? "bg-tertiary-container text-on-tertiary"
      : product.category === "textil"
        ? "bg-primary-container text-primary-fixed"
        : "bg-secondary-container text-on-secondary-container";

  const openProduct = () => router.push(`/negocio/${producer.slug}`);

  return (
    <article className="bg-surface-container-lowest rounded-xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden group">
      <button
        onClick={openProduct}
        className="relative w-full aspect-square overflow-hidden bg-surface-container text-left"
        aria-label={`Ver ${product.name}`}
      >
        <Image
          src={product.image}
          alt={product.name}
          width={640}
          height={640}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-surface-container-lowest/90 backdrop-blur-md text-primary font-label-sm text-label-sm flex items-center gap-1 shadow-sm">
          <span className="material-symbols-outlined text-xs text-secondary">location_on</span>
          {producer.municipality.split(" / ")[0].split(" · ")[0]}
        </span>
        <span className={`absolute top-2 right-2 px-2 py-0.5 rounded ${tagTone} font-label-sm text-label-sm font-bold`}>
          {topBadge.slice(0, 28)}
        </span>
        {product.stock_label && (
          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-primary/80 backdrop-blur-md text-on-primary font-label-sm text-label-sm">
            {product.stock_label}
          </span>
        )}
      </button>
      <div className="p-space-md flex flex-col justify-between flex-1">
        <div>
          <Link
            href={`/negocio/${producer.slug}`}
            className="font-label-sm text-label-sm text-secondary uppercase font-semibold hover:underline"
          >
            {producer.name}
          </Link>
          <button onClick={openProduct} className="block text-left w-full">
            <h3 className="font-title-md text-title-md text-primary group-hover:text-secondary transition-colors mt-0.5 leading-snug">
              {product.name}
            </h3>
          </button>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 line-clamp-2">{product.short}</p>
        </div>
        <div className="mt-space-md pt-space-sm flex flex-col gap-space-sm">
          <div className="flex items-baseline justify-between gap-2">
            <div className="whitespace-nowrap">
              <span className="font-headline-sm text-headline-sm text-primary font-bold">{money(product.price)}</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant"> MXN / {product.unit}</span>
            </div>
            <span className="font-label-sm text-label-sm text-secondary font-bold text-right">
              {tags[0] || "Cosecha 2024"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                void add(product.id).then(() => router.push("/carrito"));
              }}
              className="py-2 px-space-sm rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-surface-tint transition-colors flex items-center justify-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">shopping_bag</span> Comprar
            </button>
            <button
              onClick={() => add(product.id)}
              className="py-2 px-space-sm rounded-lg bg-secondary-container text-on-secondary-container font-label-md text-label-md hover:bg-secondary-fixed transition-colors flex items-center justify-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">add_shopping_cart</span> Carrito
            </button>
          </div>
          <Link
            href={`/mensajes?producer=${producer.slug}&product=${product.id}`}
            className="w-full py-1.5 rounded-lg bg-surface-container text-on-surface-variant hover:text-primary font-label-sm text-label-sm flex items-center justify-center gap-1 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">forum</span>
            {variant === "compact" ? "Preguntar" : "Preguntar al productor"}
          </Link>
        </div>
      </div>
    </article>
  );
}
