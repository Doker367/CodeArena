import { cookies } from "next/headers";
import { isLang, translate, type Lang } from "./i18n";

export async function getLang(): Promise<Lang> {
  const value = (await cookies()).get("oc_lang")?.value;
  return isLang(value) ? value : "es";
}

export async function getTranslator() {
  const lang = await getLang();
  return {
    lang,
    t: (key: string, vars?: Record<string, string>) => translate(lang, key, vars),
  };
}
