import type { Metadata } from "next";
import { ContactForm } from "@/components/forms/ContactForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { OpenStatus } from "@/components/restaurant/OpenStatus";
import { fullAddress, restaurant } from "@/config/restaurant";

export const metadata: Metadata = {
  title: "Contact",
  description: `Get in touch with ${restaurant.name}: phone, email, address and social links.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <PageHeader eyebrow="Say hi" title={<>Contact</>}>
        <p className="text-ink-soft">For questions about an order in progress, calling is fastest.</p>
      </PageHeader>
      <div className="container-x grid gap-16 pb-28 lg:grid-cols-12">
        <div className="space-y-10 lg:col-span-5">
          <div>
            <p className="eyebrow text-ink-soft">Call</p>
            <a href={`tel:${restaurant.phone.e164}`} className="display mt-2 block text-5xl hover:text-tomato">
              {restaurant.phone.display}
            </a>
            <OpenStatus className="mt-3" />
          </div>
          <div>
            <p className="eyebrow text-ink-soft">Email</p>
            <a href={`mailto:${restaurant.email}`} className="link-underline mt-2 inline-block text-2xl font-semibold">
              {restaurant.email}
            </a>
          </div>
          <div>
            <p className="eyebrow text-ink-soft">Visit</p>
            <address className="mt-2 text-xl not-italic">{fullAddress()}</address>
          </div>
          <div>
            <p className="eyebrow text-ink-soft">Follow</p>
            <ul className="mt-2 flex gap-6 text-lg font-semibold">
              {restaurant.socialLinks.map((s) => (
                <li key={s.label}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer" className="link-underline">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="rounded-[1.5rem] bg-paper p-6 sm:p-10 lg:col-span-6 lg:col-start-7">
          <h2 className="display mb-6 text-4xl">Send a message</h2>
          <ContactForm />
        </div>
      </div>
    </>
  );
}
