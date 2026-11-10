import { cookies } from "next/headers";

const API_INTERNAL_URL = (process.env.API_INTERNAL_URL || "http://127.0.0.1:4000").replace(/\/$/, "");

/**
 * Server-side fetch against the Node API. Forwards the incoming session/cart
 * cookies so personalized pages (panel, mensajería) keep working with SSR.
 */
export async function serverGet<T>(path: string): Promise<T | null> {
  const store = await cookies();
  const cookie = store
    .getAll()
    .map((item) => `${item.name}=${item.value}`)
    .join("; ");

  const response = await fetch(`${API_INTERNAL_URL}${path}`, {
    headers: cookie ? { cookie } : undefined,
    cache: "no-store",
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`API ${response.status} en ${path}`);
  }
  return (await response.json()) as T;
}
