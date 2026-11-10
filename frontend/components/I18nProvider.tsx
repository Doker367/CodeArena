"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { LANG_COOKIE, langMeta, translate, type Lang } from "@/lib/i18n";

type I18nValue = {
  lang: Lang;
  meta: ReturnType<typeof langMeta>;
  setLang: (lang: Lang) => void;
  t: (key: string, vars?: Record<string, string>) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ initialLang, children }: { initialLang: Lang; children: ReactNode }) {
  const router = useRouter();
  const [lang, setLangState] = useState<Lang>(initialLang);

  const setLang = useCallback(
    (next: Lang) => {
      document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=${365 * 24 * 3600}; samesite=lax`;
      document.documentElement.lang = next;
      setLangState(next);
      router.refresh();
    },
    [router],
  );

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      meta: langMeta(lang),
      setLang,
      t: (key, vars) => translate(lang, key, vars),
    }),
    [lang, setLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n debe usarse dentro de I18nProvider");
  return context;
}
