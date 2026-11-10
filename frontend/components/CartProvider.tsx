"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type CartLine = {
  id: number;
  qty: number;
  note: string;
  product: {
    id: number;
    slug: string;
    name: string;
    price: number;
    unit: string;
    image: string;
    stock: number;
  };
  producer: {
    id: number;
    name: string;
    slug: string;
    municipality: string;
    avatar: string;
  };
};

export type CartState = { lines: CartLine[]; subtotal: number; count: number };

type CartContextValue = {
  cart: CartState;
  loading: boolean;
  add: (productId: number, qty?: number, note?: string) => Promise<void>;
  update: (lineId: number, patch: { qty?: number; note?: string }) => Promise<void>;
  remove: (lineId: number) => Promise<void>;
  clear: () => Promise<void>;
  refresh: () => Promise<void>;
  toast: (message: string, kind?: "success" | "error") => void;
};

const EMPTY: CartState = { lines: [], subtotal: 0, count: 0 };
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartState>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<{ id: number; message: string; kind: "success" | "error" }[]>([]);
  const timers = useRef<number[]>([]);

  const toast = useCallback((message: string, kind: "success" | "error" = "success") => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, kind }]);
    const timer = window.setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id));
    }, 3600);
    timers.current.push(timer);
  }, []);

  useEffect(() => {
    return () => timers.current.forEach((t) => window.clearTimeout(t));
  }, []);

  const request = useCallback(
    async (method: string, payload?: unknown) => {
      const response = await fetch("/api/cart", {
        method,
        headers: { "Content-Type": "application/json" },
        body: payload ? JSON.stringify(payload) : undefined,
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "No pudimos actualizar tu carrito.");
      }
      const next = (await response.json()) as CartState;
      setCart(next);
      return next;
    },
    [],
  );

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/cart", { cache: "no-store" });
      if (response.ok) setCart((await response.json()) as CartState);
    } catch {
      /* offline: keep current cart */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const add = useCallback(
    async (productId: number, qty = 1, note = "") => {
      try {
        await request("POST", { productId, qty, note });
        toast("Agregado a tu carrito · 0% comisiones");
      } catch (error) {
        toast(error instanceof Error ? error.message : "No se pudo agregar", "error");
      }
    },
    [request, toast],
  );

  const update = useCallback(
    async (lineId: number, patch: { qty?: number; note?: string }) => {
      try {
        await request("PATCH", { lineId, ...patch });
      } catch (error) {
        toast(error instanceof Error ? error.message : "No se pudo actualizar", "error");
      }
    },
    [request, toast],
  );

  const remove = useCallback(
    async (lineId: number) => {
      try {
        await request("DELETE", { lineId });
        toast("Producto retirado del carrito");
      } catch (error) {
        toast(error instanceof Error ? error.message : "No se pudo retirar", "error");
      }
    },
    [request, toast],
  );

  const clear = useCallback(async () => {
    try {
      await request("DELETE", { all: true });
    } catch {
      /* ignore */
    }
  }, [request]);

  const value = useMemo(
    () => ({ cart, loading, add, update, remove, clear, refresh, toast }),
    [cart, loading, add, update, remove, clear, refresh, toast],
  );

  return (
    <CartContext.Provider value={value}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`animate-pop-in flex items-start gap-2.5 rounded-xl px-4 py-3 shadow-lg text-label-md font-label-md ${
              t.kind === "error" ? "bg-error-container text-on-error-container" : "bg-primary text-on-primary"
            }`}
          >
            <span className="material-symbols-outlined text-lg">
              {t.kind === "error" ? "error" : "check_circle"}
            </span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de CartProvider");
  return ctx;
}
