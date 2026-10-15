import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { LocationBlock } from "@/components/restaurant/LocationBlock";
import { fullAddress, restaurant } from "@/config/restaurant";
import { formatMoney } from "@/lib/money";
import { JsonLd, restaurantJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Location & Hours",
  description: `${restaurant.name} at ${fullAddress()}. Opening hours, holiday hours, pickup instructions, parking and delivery area.`,
  alternates: { canonical: "/location" },
};

export default function LocationPage() {
  return (
    <>
      <JsonLd data={restaurantJsonLd()} />
      <PageHeader eyebrow="Find us" title={<>Location <span className="text-tomato">&amp;</span> hours</>} />
      <div className="container-x pb-24">
        <LocationBlock headingLevel={2} />
        <section className="mt-24 grid gap-8 border-t-2 border-ink pt-12 md:grid-cols-12" aria-labelledby="delivery-area">
          <h2 id="delivery-area" className="display text-5xl md:col-span-4">
            Delivery area
          </h2>
          <div className="space-y-4 md:col-span-7 md:col-start-6">
            {restaurant.ordering.deliveryEnabled ? (
              <>
                <p>
                  We deliver to a limited area around the restaurant. Standard delivery fee {formatMoney(restaurant.delivery.fee)}, minimum
                  order {formatMoney(restaurant.delivery.minimumOrder)}. Enter your postal code in the cart to check.
                </p>
                <ul className="divide-y divide-ink/10 rounded-2xl bg-paper px-5">
                  {restaurant.delivery.zones.map((z) => (
                    <li key={z.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm">
                      <span className="font-semibold">{z.name}</span>
                      <span className="text-ink-soft">
                        {z.postalCodes.join(", ")} · fee {formatMoney(z.fee ?? restaurant.delivery.fee)} · min {formatMoney(z.minimumOrder ?? restaurant.delivery.minimumOrder)}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-ink-soft">Sample zones shown — replace with the restaurant&rsquo;s real delivery coverage.</p>
              </>
            ) : (
              <p>Delivery isn&rsquo;t available right now — pickup only.</p>
            )}
            <Link href="/order" className="btn btn-primary">
              Order online
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
