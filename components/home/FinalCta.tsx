import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Burger } from "@/components/art/burger";

export function FinalCta() {
  return (
    <section className="relative overflow-hidden py-28 md:py-40" aria-labelledby="final-cta-title">
      <div className="container-x relative grid items-center gap-10 md:grid-cols-12">
        <div className="md:col-span-7">
          <h2 id="final-cta-title" className="display text-[clamp(4.5rem,13vw,13rem)]">
            Hungry
            <br />
            <span className="text-tomato">yet?</span>
          </h2>
          <p className="mt-6 max-w-md text-lg text-ink-soft">Order ahead for pickup or get it delivered. Skip the line, keep the crust.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/order" className="btn btn-primary">
              Order online <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link href="/location" className="btn btn-ghost">
              Hours & location
            </Link>
          </div>
        </div>
        <div className="md:col-span-5" aria-hidden="true">
          <Burger recipe="smash" className="mx-auto w-full max-w-md rotate-[-8deg]" seed={21} />
        </div>
      </div>
    </section>
  );
}
