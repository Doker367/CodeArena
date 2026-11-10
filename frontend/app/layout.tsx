import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/CartProvider";
import { I18nProvider } from "@/components/I18nProvider";
import { getLang } from "@/lib/i18n-server";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: {
    default: "ORIGEN CHIAPAS · Marketplace Digital Comunitario",
    template: "%s · ORIGEN CHIAPAS",
  },
  description:
    "Marketplace digital de comercio justo: café de altura, ámbar de Simojovel, textiles de Zinacantán, miel melipona y gastronomía chiapaneca. 100% sin intermediarios.",
  keywords: ["Chiapas", "marketplace", "comercio justo", "café", "ámbar", "textiles", "artesanía"],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  return (
    <html lang={lang} className={jakarta.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
        />
      </head>
      <body className={`${jakarta.className} bg-surface font-body-md text-on-surface antialiased`}>
        <I18nProvider initialLang={lang}>
          <CartProvider>{children}</CartProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
