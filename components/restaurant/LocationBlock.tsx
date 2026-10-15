import { Car, Clock, Mail, MapPin, Navigation, Phone, ShoppingBag } from "lucide-react";
import { fullAddress, restaurant } from "@/config/restaurant";
import { HoursTable } from "./HoursTable";
import { OpenStatus } from "./OpenStatus";

/** Address, contact, hours and directions. All values come from config/restaurant.ts. */
export function LocationBlock({ headingLevel = 2 }: { headingLevel?: 2 | 3 }) {
  const H = `h${headingLevel}` as "h2" | "h3";
  const mapsHref = restaurant.geo
    ? `https://www.google.com/maps/dir/?api=1&destination=${restaurant.geo.latitude},${restaurant.geo.longitude}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress())}`;
  return (
    <div className="grid gap-12 lg:grid-cols-12">
      <div className="lg:col-span-6">
        <H className="display text-[clamp(3rem,7vw,6.5rem)]">
          Come
          <br />
          get it.
        </H>
        <OpenStatus className="mt-6" />
        <dl className="mt-10 space-y-6">
          <div className="flex gap-4">
            <dt>
              <MapPin className="mt-1 size-5 text-tomato" aria-hidden="true" />
              <span className="sr-only">Address</span>
            </dt>
            <dd>
              <address className="not-italic text-lg">{fullAddress()}</address>
              <a href={mapsHref} target="_blank" rel="noopener noreferrer" className="btn btn-dark mt-4 !min-h-11">
                <Navigation className="size-4" aria-hidden="true" /> Get directions
              </a>
            </dd>
          </div>
          <div className="flex gap-4">
            <dt>
              <Phone className="mt-1 size-5 text-tomato" aria-hidden="true" />
              <span className="sr-only">Phone</span>
            </dt>
            <dd>
              <a href={`tel:${restaurant.phone.e164}`} className="link-underline text-lg font-semibold">
                {restaurant.phone.display}
              </a>
            </dd>
          </div>
          <div className="flex gap-4">
            <dt>
              <Mail className="mt-1 size-5 text-tomato" aria-hidden="true" />
              <span className="sr-only">Email</span>
            </dt>
            <dd>
              <a href={`mailto:${restaurant.email}`} className="link-underline text-lg">
                {restaurant.email}
              </a>
            </dd>
          </div>
          <div className="flex gap-4">
            <dt>
              <ShoppingBag className="mt-1 size-5 text-tomato" aria-hidden="true" />
              <span className="sr-only">Pickup instructions</span>
            </dt>
            <dd className="text-ink-soft">{restaurant.location.pickupInstructions}</dd>
          </div>
          {restaurant.location.parking && (
            <div className="flex gap-4">
              <dt>
                <Car className="mt-1 size-5 text-tomato" aria-hidden="true" />
                <span className="sr-only">Parking</span>
              </dt>
              <dd className="text-ink-soft">{restaurant.location.parking}</dd>
            </div>
          )}
          {restaurant.location.accessibility && (
            <div className="flex gap-4">
              <dt className="eyebrow mt-1">Access</dt>
              <dd className="text-ink-soft">{restaurant.location.accessibility}</dd>
            </div>
          )}
        </dl>
      </div>
      <div className="lg:col-span-5 lg:col-start-8">
        <div className="rounded-[1.5rem] bg-paper p-6 shadow-[0_1px_0_rgb(23_23_23/0.06)] sm:p-8">
          <p className="eyebrow flex items-center gap-2">
            <Clock className="size-4" aria-hidden="true" /> Hours
          </p>
          <div className="mt-4">
            <HoursTable />
          </div>
        </div>
        <MapCard />
      </div>
    </div>
  );
}

/** Stylised map placeholder. Swap for an embedded map once an API key / verified coordinates exist. */
function MapCard() {
  return (
    <a
      href={restaurant.location.mapUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="grain group relative mt-6 block aspect-[16/9] overflow-hidden rounded-[1.5rem] bg-stone"
      aria-label="Open the restaurant location in a map (opens in a new tab)"
    >
      <svg viewBox="0 0 400 225" className="absolute inset-0 size-full" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
        <g stroke="#FFFFFF" strokeWidth="10" fill="none">
          <path d="M-10 60h420M-10 150h420M90-10v250M260-10v250" />
        </g>
        <g stroke="#FFFFFF" strokeWidth="4" fill="none" opacity="0.8">
          <path d="M-10 105h420M175-10v250M340-10v250M-10 195l420-120" />
        </g>
        <rect x="190" y="70" width="60" height="70" fill="#F2B544" opacity="0.5" />
      </svg>
      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[85%] transition-transform group-hover:-translate-y-[100%]">
        <span className="grid size-14 rotate-45 place-items-center rounded-full rounded-br-none bg-tomato text-ivory shadow-lg">
          <MapPin className="size-6 -rotate-45" aria-hidden="true" />
        </span>
      </span>
      <span className="eyebrow absolute bottom-4 left-4 rounded-full bg-ink px-3 py-2 text-ivory">Open in maps ↗</span>
    </a>
  );
}
