import type { Metadata } from "next";
import { LanguagesView, type LanguagesPayload } from "@/components/LanguagesView";
import { serverGet } from "@/lib/server-api";

export const metadata: Metadata = {
  title: "Lenguas Originarias de Chiapas",
  description:
    "Directorio de las 12 lenguas originarias de Chiapas, estado real de la traducción automática, diccionarios y red de intérpretes comunitarios.",
};

export const dynamic = "force-dynamic";

export default async function LenguasPage() {
  const data = await serverGet<LanguagesPayload>("/api/languages");
  if (!data) {
    return (
      <main className="w-full pt-36 bg-surface">
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <span className="material-symbols-outlined text-5xl text-outline">translate</span>
          <h1 className="font-headline-md text-headline-md text-primary mt-3">No pudimos cargar las lenguas</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">
            Verifica que la API esté en ejecución y vuelve a intentarlo.
          </p>
        </div>
      </main>
    );
  }
  return (
    <main className="w-full pt-36 bg-surface">
      <LanguagesView data={data} />
    </main>
  );
}
