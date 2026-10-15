import Link from "next/link";
import { fullAddress, restaurant } from "@/config/restaurant";
import { OpenStatus } from "@/components/restaurant/OpenStatus";
import { Logo } from "./Logo";
import { NAV_LINKS } from "./nav";

const LEGAL = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/ordering-policy", label: "Ordering & Cancellation" },
  { href: "/refund-policy", label: "Refund Policy" },
];

export function SiteFooter() {
  return (
    <footer className="grain bg-ink text-ivory">
      <div className="container-x pb-10 pt-20">
        <p className="display text-[clamp(3.5rem,13vw,13rem)] text-ivory" aria-hidden="true">
          Stack <span className="text-mustard">House</span>
        </p>
        <div className="mt-16 grid gap-12 border-t border-ivory/15 pt-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <Logo />
            <p className="mt-5 max-w-xs text-ivory/70">{restaurant.description}</p>
            <OpenStatus tone="dark" className="mt-6" />
          </div>
          <nav aria-label="Footer" className="md:col-span-2">
            <p className="eyebrow mb-4 text-ivory/50">Explore</p>
            <ul className="space-y-2">
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="link-underline">
                    {l.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/order" className="link-underline">
                  Order online
                </Link>
              </li>
            </ul>
          </nav>
          <div className="md:col-span-3">
            <p className="eyebrow mb-4 text-ivory/50">Visit</p>
            <address className="not-italic text-ivory/85">
              {fullAddress()}
              <br />
              <a href={`tel:${restaurant.phone.e164}`} className="link-underline">
                {restaurant.phone.display}
              </a>
              <br />
              <a href={`mailto:${restaurant.email}`} className="link-underline">
                {restaurant.email}
              </a>
            </address>
          </div>
          <div className="md:col-span-3">
            <p className="eyebrow mb-4 text-ivory/50">Follow</p>
            <ul className="space-y-2">
              {restaurant.socialLinks.map((s) => (
                <li key={s.label}>
                  <a href={s.href} className="link-underline" rel="noopener noreferrer" target="_blank">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-16 flex flex-col gap-4 border-t border-ivory/15 pt-6 text-xs text-ivory/55 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {restaurant.name}. Sample content — business details are placeholders.
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {LEGAL.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="link-underline">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
