import Link from "next/link";
import { Logo } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="w-full bg-surface-container-low text-on-surface-variant mt-space-xl pt-space-xl pb-space-lg">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-space-lg mb-space-xl">
          <div>
            <div className="flex items-center gap-space-xs mb-space-sm">
              <Logo className="h-7 w-7" />
              <span className="font-headline-sm text-headline-sm text-primary">ORIGEN CHIAPAS</span>
            </div>
            <p className="font-body-sm text-body-sm mb-space-md text-on-surface-variant">
              Plataforma comunitaria de comercio justo dedicada a visibilizar y conectar a los creadores,
              campesinos y microempresas de las 15 regiones socioeconómicas de Chiapas.
            </p>
            <div className="flex items-center gap-2 p-2 bg-secondary-container/50 rounded-lg text-on-secondary-container font-label-sm text-label-sm">
              <span className="material-symbols-outlined text-base">verified</span>
              <span>Comercio Justo y 100% Libre de Comisiones abusivas</span>
            </div>
          </div>
          <div>
            <h4 className="font-title-md text-title-md text-primary mb-space-sm">Regiones &amp; Municipios Destacados</h4>
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
                  Ver directorio de los 124 municipios →
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-title-md text-title-md text-primary mb-space-sm">Para Compradores y Aliados</h4>
            <ul className="font-body-sm text-body-sm space-y-1">
              <li>
                <Link href="/como-funciona" className="hover:text-primary transition-colors">
                  ¿Cómo funciona la compra directa?
                </Link>
              </li>
              <li>
                <Link href="/productores" className="hover:text-primary transition-colors">
                  Sellos y Certificados de Origen
                </Link>
              </li>
              <li>
                <Link href="/como-funciona#trazabilidad" className="hover:text-primary transition-colors">
                  Envíos comunitarios y Trazabilidad
                </Link>
              </li>
              <li>
                <Link href="/como-funciona#impacto" className="hover:text-primary transition-colors">
                  Informe de Impacto Familiar
                </Link>
              </li>
              <li>
                <Link href="/como-funciona#soporte" className="hover:text-primary transition-colors">
                  Centro de Ayuda Cívica
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-title-md text-title-md text-primary mb-space-sm">Únete como Productor</h4>
            <p className="font-body-sm text-body-sm mb-space-sm text-on-surface-variant">
              ¿Elaboras café, textiles, bordados, miel o tienes un micronegocio local chiapaneco?
            </p>
            <Link
              href="/acceso?rol=productor"
              className="inline-block px-space-md py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-surface-tint transition-colors mb-space-sm"
            >
              Registra tu emprendimiento
            </Link>
            <p className="font-label-sm text-label-sm text-outline">
              Acompañamiento en lenguas originarias y talleres de digitalización comunitaria.
            </p>
          </div>
        </div>
        <div className="pt-space-md flex flex-col md:flex-row items-center justify-between gap-space-sm font-label-sm text-label-sm text-outline">
          <p>© 2024 ORIGEN CHIAPAS. Plataforma de soberanía económica para los pueblos originarios y micronegocios locales.</p>
          <div className="flex flex-wrap gap-space-md">
            <Link href="/como-funciona#terminos" className="hover:text-on-surface transition-colors">
              Términos de Compra Directa
            </Link>
            <Link href="/como-funciona#privacidad" className="hover:text-on-surface transition-colors">
              Privacidad y Datos
            </Link>
            <Link href="/como-funciona#patrimonio" className="hover:text-on-surface transition-colors">
              Salvaguarda de Patrimonio Cultural
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
