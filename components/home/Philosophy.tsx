import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Burger } from "@/components/art/burger";
import { Fries } from "@/components/art/sides";
import { Reveal } from "@/components/animations/Reveal";

/** Editorial brand section. All claims are sample marketing copy — edit before launch. */
export function Philosophy() {
  return (
    <section className="relative overflow-hidden py-24 md:py-40" aria-labelledby="philosophy-title">
      <div className="container-x grid gap-10 md:grid-cols-12">
        <p className="eyebrow md:col-span-12">Our philosophy</p>
        <h2 id="philosophy-title" className="display text-[clamp(3.6rem,10vw,10rem)] md:col-span-10">
          No shortcuts.
          <br />
          <span className="font-serif font-normal normal-case italic tracking-normal text-tomato">just</span> great burgers.
        </h2>

        <Reveal className="relative md:col-span-5 md:col-start-2">
          <div className="grain relative aspect-[4/5] overflow-hidden rounded-[1.5rem] bg-ink">
            <Burger recipe="double" spread={10} className="absolute inset-x-[8%] top-[16%] w-[84%]" seed={8} />
            <p className="eyebrow absolute bottom-5 left-5 text-ivory/70">Fig. 01 — Double Trouble, deconstructed</p>
          </div>
        </Reveal>

        <div className="flex flex-col justify-end gap-8 md:col-span-4 md:col-start-8">
          <Reveal>
            <p className="text-xl leading-relaxed">
              We keep it simple: fresh preparation, quality ingredients and burgers built with care, every single time. Nothing
              sits under a heat lamp. Every order is cooked when you place it.
            </p>
          </Reveal>
          <Reveal delay={120}>
            <p className="text-ink-soft">
              Come hungry, sit at the counter, and stay a while. Or take it home — we pack fries in vented cartons so they arrive
              crisp.
            </p>
          </Reveal>
          <Reveal delay={200} className="flex items-end justify-between gap-6">
            <Link href="/our-story" className="btn btn-dark">
              Our story <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
            <div className="grain w-28 shrink-0 rotate-6 rounded-2xl bg-mustard p-3" aria-hidden="true">
              <Fries className="w-full" />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
