import { products, categories } from "@/config/menu";
import { restaurant, siteUrl } from "@/config/restaurant";
import { DISPLAY_ORDER, WEEKDAY_LABELS } from "@/lib/availability/hours";

/**
 * Schema.org Restaurant data generated from the same config the page displays.
 * Coordinates are only included when restaurant.geo is set (verified).
 * No ratings or reviews are emitted.
 */
export function restaurantJsonLd() {
  const openingHoursSpecification = DISPLAY_ORDER.flatMap((d) =>
    restaurant.hours[d].map((w) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: `https://schema.org/${WEEKDAY_LABELS[d]}`,
      opens: w.open,
      closes: w.close,
    })),
  );
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "@id": `${siteUrl}/#restaurant`,
    name: restaurant.name,
    description: restaurant.description,
    url: siteUrl,
    telephone: restaurant.phone.e164,
    email: restaurant.email,
    priceRange: restaurant.priceRange,
    servesCuisine: ["Burgers", "American"],
    menu: `${siteUrl}/menu`,
    hasMenu: `${siteUrl}/menu`,
    acceptsReservations: false,
    address: {
      "@type": "PostalAddress",
      streetAddress: restaurant.address.street,
      addressLocality: restaurant.address.city,
      addressRegion: restaurant.address.region,
      postalCode: restaurant.address.postalCode,
      addressCountry: restaurant.address.country,
    },
    ...(restaurant.geo ? { geo: { "@type": "GeoCoordinates", latitude: restaurant.geo.latitude, longitude: restaurant.geo.longitude } } : {}),
    openingHoursSpecification,
    potentialAction: { "@type": "OrderAction", target: `${siteUrl}/order`, deliveryMethod: ["http://purl.org/goodrelations/v1#DeliveryModePickUp"] },
    sameAs: restaurant.socialLinks.map((s) => s.href),
  };
}

export function menuJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Menu",
    name: `${restaurant.name} Menu`,
    url: `${siteUrl}/menu`,
    hasMenuSection: categories.map((c) => ({
      "@type": "MenuSection",
      name: c.name,
      hasMenuItem: products
        .filter((p) => p.category === c.id)
        .map((p) => ({
          "@type": "MenuItem",
          name: p.name,
          description: p.description,
          offers: { "@type": "Offer", price: (p.price / 100).toFixed(2), priceCurrency: restaurant.currency, availability: p.available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" },
        })),
    })),
  };
}

export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
