import type { Metadata } from "next";
import { MobileCartBar } from "@/components/cart/MobileCartBar";
import { PageHeader } from "@/components/layout/PageHeader";
import { MenuBrowser } from "@/components/menu/MenuBrowser";
import { restaurant } from "@/config/restaurant";

export const metadata: Metadata = {
  title: "Order Online",
  description: `Order ${restaurant.name} online for pickup or delivery. Customize your burger, pick a time and pay securely.`,
  alternates: { canonical: "/order" },
};

export default function OrderPage() {
  return (
    <>
      <PageHeader eyebrow="Pickup or delivery" title={<>Order <span className="text-tomato">online</span></>}>
        <p className="text-ink-soft">
          Choose pickup or delivery, build your order, then pick ASAP or a scheduled time at checkout. Prep usually takes about{" "}
          {restaurant.ordering.preparationMinutes} minutes.
        </p>
      </PageHeader>
      <MenuBrowser withCartPanel />
      <MobileCartBar />
    </>
  );
}
