"use client";

import Link from "next/link";
import { useI18n } from "./I18nProvider";
import { Logo } from "./Logo";

export function SiteFooter() {
  const { t } = useI18n();
  return (
    <footer className="w-full bg-surface-container-low text-on-surface-variant mt-space-xl pt-space-xl pb-space-lg">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-space-lg mb-space-xl">
          <div>
            <div className="flex items-center gap-space-xs mb-space-sm">
              <Logo className="h-7 w-7" />
              <span className="font-headline-sm text-headline-sm text-primary">ORIGEN CHIAPAS</span>
            </div>
            <p className="font-body-sm text-body-sm mb-space-md text-on-surface-variant">{t("footer.about")}</p>
            <div className="flex items-center gap-2 p-2 bg-secondary-container/50 rounded-lg text-on-secondary-container font-label-sm text-label-sm">
              <span className="material-symbols-outlined text-base">verified</span>
              <span>{t("footer.fair")}</span>
            </div>
          </div>
          <div>
            <h4 className="font-title-md text-title-md text-primary mb-space-sm">{t("footer.regions")}</h4>
            <ul className="font-body-sm text-body-sm space-y-1">
              {[
                "San Cristóbal de Las Casas (Los Altos)",
                "Tuxtla Gutiérrez (Metropolitana)",
                "Simojovel (De Los Bosques - Ámbar)",
                "Tapachula & Soconusco (Cacao y Café)",
                "Palenque & Selva Lacandona",
                "Chiapa de Corzo (Laca y Tradición)",
              ].map((item) => (
                <li key={item}>
                  <Link href="/mapa" className="hover:text-primary transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/mapa" className="text-secondary font-label-md text-label-md hover:underline">
                  {t("footer.directory")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-title-md text-title-md text-primary mb-space-sm">{t("footer.buyers")}</h4>
            <ul className="font-body-sm text-body-sm space-y-1">
              <li><Link href="/como-funciona" className="hover:text-primary transition-colors">{t("footer.how")}</Link></li>
              <li><Link href="/productores" className="hover:text-primary transition-colors">{t("footer.certs")}</Link></li>
              <li><Link href="/como-funciona#trazabilidad" className="hover:text-primary transition-colors">{t("footer.shipping")}</Link></li>
              <li><Link href="/como-funciona#impacto" className="hover:text-primary transition-colors">{t("footer.impact")}</Link></li>
              <li><Link href="/como-funciona#soporte" className="hover:text-primary transition-colors">{t("footer.help")}</Link></li>
              <li><Link href="/lenguas" className="hover:text-primary transition-colors">{t("footer.languages")}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-title-md text-title-md text-primary mb-space-sm">{t("footer.join")}</h4>
            <p className="font-body-sm text-body-sm mb-space-sm text-on-surface-variant">{t("footer.joinText")}</p>
            <Link
              href="/acceso?rol=productor"
              className="inline-block px-space-md py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-surface-tint transition-colors mb-space-sm"
            >
              {t("footer.register")}
            </Link>
            <p className="font-label-sm text-label-sm text-outline">{t("footer.support")}</p>
          </div>
        </div>
        <div className="pt-space-md flex flex-col md:flex-row items-center justify-between gap-space-sm font-label-sm text-label-sm text-outline">
          <p>{t("footer.rights")}</p>
          <div className="flex flex-wrap gap-space-md">
            <Link href="/como-funciona#terminos" className="hover:text-on-surface transition-colors">{t("footer.terms")}</Link>
            <Link href="/como-funciona#privacidad" className="hover:text-on-surface transition-colors">{t("footer.privacy")}</Link>
            <Link href="/como-funciona#patrimonio" className="hover:text-on-surface transition-colors">{t("footer.heritage")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
