import type { Metadata, Viewport } from "next";
import { Big_Shoulders, Instrument_Sans, Instrument_Serif } from "next/font/google";
import type { CSSProperties } from "react";
import { ArtDefs } from "@/components/art/ArtDefs";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CartHydrator } from "@/components/cart/CartHydrator";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ProductCustomizer } from "@/components/menu/ProductCustomizer";
import { Toast } from "@/components/ui/Toast";
import { restaurant, siteUrl } from "@/config/restaurant";
import "./globals.css";

const display = Big_Shoulders({
  subsets: ["latin"],
  weight: ["800", "900"],
  variable: "--font-display-face",
  display: "swap",
  adjustFontFallback: false,
  fallback: ["Arial Narrow", "Impact", "sans-serif"],
});
const sans = Instrument_Sans({ subsets: ["latin"], variable: "--font-sans-face", display: "swap" });
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-serif-face", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: `${restaurant.name} — Smash Burgers, Pickup & Delivery`, template: `%s · ${restaurant.name}` },
  description: restaurant.description,
  applicationName: restaurant.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: restaurant.name,
    title: `${restaurant.name} — ${restaurant.tagline}`,
    description: restaurant.description,
    locale: restaurant.locale.replace("-", "_"),
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: restaurant.theme.ivory,
  width: "device-width",
  initialScale: 1,
};

const brandVars = {
  "--brand-ivory": restaurant.theme.ivory,
  "--brand-ink": restaurant.theme.ink,
  "--brand-tomato": restaurant.theme.tomato,
  "--brand-mustard": restaurant.theme.mustard,
  "--brand-stone": restaurant.theme.stone,
  "--brand-white": restaurant.theme.white,
} as CSSProperties;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={restaurant.locale} suppressHydrationWarning style={brandVars} className={`${display.variable} ${sans.variable} ${serif.variable}`}>
      <head>
        {/* Marks JS as available before first paint so animated elements can start hidden without a flash. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body className="min-h-dvh overflow-x-clip">
        <a
          href="#main"
          className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-full bg-ink px-5 py-3 font-bold text-ivory transition focus:translate-y-0"
        >
          Skip to content
        </a>
        <ArtDefs />
        <div id="top-sentinel" className="absolute inset-x-0 top-0 h-px" aria-hidden="true" />
        <SiteHeader />
        <main id="main" tabIndex={-1} className="outline-none">
          {children}
        </main>
        <SiteFooter />
        <CartDrawer />
        <ProductCustomizer />
        <Toast />
        <CartHydrator />
      </body>
    </html>
  );
}
