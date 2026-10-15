import type { Metadata } from "next";
import { MobileCartBar } from "@/components/cart/MobileCartBar";
import { PageHeader } from "@/components/layout/PageHeader";
import { MenuBrowser } from "@/components/menu/MenuBrowser";
import { restaurant } from "@/config/restaurant";
import { JsonLd, menuJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Menu",
  description: `Smash burgers, crispy chicken, fries, shakes and combos at ${restaurant.name}. Browse the full menu and order online for pickup or delivery.`,
  alternates: { canonical: "/menu" },
};

export default function MenuPage() {
  return (
    <>
      <JsonLd data={menuJsonLd()} />
      <PageHeader eyebrow="Burgers · Chicken · Fries · Shakes" title={<>The menu</>}>
        <p className="text-ink-soft">Everything is cooked to order. Tap any item to customize it and add it to your order.</p>
      </PageHeader>
      <MenuBrowser />
      <MobileCartBar />
    </>
  );
}
