import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cómo Funciona",
  description:
    "Compra directa a productores de Chiapas: sin comisiones, con trazabilidad y pago directo. Conoce el protocolo de verificación comunitaria.",
};

const STEPS = [
  {
    icon: "search",
    title: "Explora por origen",
    body: "Navega el mapa vivo de Chiapas o el mercado y encuentra cafés, textiles, ámbar, miel y alimentos por municipio y comunidad.",
  },
  {
    icon: "forum",
    title: "Pregunta directo",
    body: "Habla con la familia productora por mensajería interna o WhatsApp. Acuerda tallas, molienda, cantidades y tiempos sin intermediarios.",
  },
  {
    icon: "shopping_basket",
    title: "Confirma tu pedido",
    body: "Elige entrega local, recolección en taller o paquetería nacional. El 100% del importe se liquida directamente al productor.",
  },
  {
    icon: "local_shipping",
    title: "Recibe con trazabilidad",
    body: "Cada pieza conserva su código de origen, comunidad y proceso. Recibe tu pedido y comparte tu experiencia con la red.",
  },
];

export default function ComoFuncionaPage() {
  return (
    <main className="w-full pt-36 bg-surface">
      <section className="bg-surface-container-low py-space-xl px-4 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm uppercase tracking-wider">
              <span className="material-symbols-outlined text-sm">handshake</span> Comercio comunitario y directo
            </span>
            <h1 className="font-display-lg text-display-lg text-primary tracking-tight mt-3">
              Cómo funciona la compra directa
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant mt-2 max-w-2xl">
              ORIGEN CHIAPAS conecta a compradores conscientes con familias productoras de las 15 regiones
              socioeconómicas del estado. Sin comisiones abusivas, sin bodegas intermediarias y con el 100% del pago
              directo a quien siembra, teje o transforma.
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-5">
              <Link href="/marketplace" className="px-5 py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md">
                Explorar el mercado
              </Link>
              <Link href="/mapa" className="px-4 py-2.5 rounded-lg bg-surface-container-lowest text-primary font-label-md text-label-md shadow-sm">
                Ver el mapa de Chiapas
              </Link>
            </div>
          </div>
          <div className="lg:col-span-5 relative h-64 rounded-2xl overflow-hidden shadow-lg">
            <Image src="/img/img-08.jpg" alt="Cafetales de altura en la niebla de Chiapas" fill sizes="(max-width:1024px) 100vw, 480px" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-on-primary">
              <p className="font-label-sm text-label-sm text-primary-fixed-dim uppercase tracking-widest">Trazabilidad viva</p>
              <p className="font-headline-sm text-headline-sm font-bold">De la parcela a tu mesa, sin atajos.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {STEPS.map((step, index) => (
            <article key={step.title} className="bg-surface-container-lowest rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="w-11 h-11 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center">
                  <span className="material-symbols-outlined">{step.icon}</span>
                </span>
                <span className="font-display-lg text-display-lg text-surface-container-highest font-bold leading-none">
                  0{index + 1}
                </span>
              </div>
              <h2 className="font-title-md text-title-md text-primary font-bold mt-3">{step.title}</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="trazabilidad" className="max-w-7xl mx-auto px-4 lg:px-8 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <article className="bg-primary text-on-primary rounded-2xl p-7">
            <h2 className="font-headline-md text-headline-md">Sellos y certificados de origen</h2>
            <p className="font-body-md text-body-md text-primary-fixed mt-2">
              Cada publicación incluye código de origen, comunidad, proceso y responsable. Los sellos de Productor
              Verificado, Comercio Justo, 100% Hecho en Chiapas y Trazabilidad Total son revisados por el consejo
              comunitario antes de publicarse.
            </p>
            <ul className="mt-4 space-y-3">
              {[
                ["verified", "Productor Verificado Chiapas", "Identidad y comunidad validadas por asamblea."],
                ["eco", "Libre de agroquímicos", "Prácticas regenerativas y sombra nativa."],
                ["local_shipping", "Envíos comunitarios", "Rutas compartidas con guía rastreable."],
              ].map(([icon, title, sub]) => (
                <li key={title} className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-secondary-fixed">{icon}</span>
                  <div>
                    <p className="font-label-md text-label-md font-bold">{title}</p>
                    <p className="font-body-sm text-body-sm text-primary-fixed-dim">{sub}</p>
                  </div>
                </li>
              ))}
            </ul>
          </article>
          <article id="impacto" className="bg-surface-container-lowest rounded-2xl p-7 shadow-sm">
            <h2 className="font-headline-md text-headline-md text-primary">Informe de impacto familiar</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-2">
              En 2024, el 92% de cada peso pagado llegó íntegro a las familias productoras. El 8% restante cubrió
              pasarelas de pago y logística, jamás comisiones de intermediación.
            </p>
            <div className="grid grid-cols-3 gap-3 mt-5">
              {[
                ["124", "Municipios"],
                ["0%", "Comisión"],
                ["100%", "Al productor"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-xl bg-surface-container-low p-3">
                  <p className="font-headline-md text-headline-md text-primary font-bold">{value}</p>
                  <p className="font-label-sm text-label-sm text-outline">{label}</p>
                </div>
              ))}
            </div>
            <p id="soporte" className="font-body-sm text-body-sm text-on-surface-variant mt-5">
              Centro de Ayuda Cívica: 800-CHIAPAS-DIR · Atención en tsotsil, tseltal, ch'ol y español.
            </p>
          </article>
        </div>
      </section>

      <section id="terminos" className="max-w-7xl mx-auto px-4 lg:px-8 pb-16">
        <div className="bg-surface-container-low rounded-2xl p-7 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-title-md text-title-md text-primary font-bold">Términos de Compra Directa</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
              El acuerdo de entrega y pago se realiza entre comprador y productor. Origen Chiapas no retiene fondos ni
              cobra comisiones por transacción.
            </p>
          </div>
          <div id="privacidad">
            <h3 className="font-title-md text-title-md text-primary font-bold">Privacidad y Datos</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
              Tus datos de contacto solo se comparten con el productor del pedido para coordinar la entrega. Nunca se
              venden a terceros.
            </p>
          </div>
          <div id="patrimonio">
            <h3 className="font-title-md text-title-md text-primary font-bold">Salvaguarda de Patrimonio</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
              Los diseños textiles y saberes comunitarios son propiedad colectiva. Se reconoce y remunera a las autoras
              de cada pieza.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
