"use client";

import { ArrowDown, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { Burger } from "@/components/art/burger";
import { Badge } from "@/components/animations/Badge";
import { gsap, useGSAP } from "@/components/animations/gsap";
import { OpenStatus } from "@/components/restaurant/OpenStatus";

const LINES = ["Good food.", "No half", "stacks."];

export function Hero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(
        { motion: "(prefers-reduced-motion: no-preference)", reduce: "(prefers-reduced-motion: reduce)" },
        (ctx) => {
          const q = gsap.utils.selector(root);
          gsap.set(q("[data-hero-reveal]"), { visibility: "visible" });
          if (ctx.conditions?.reduce) return;
          const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
          tl.from(q("[data-hero-line]"), { yPercent: 108, duration: 1.05, stagger: 0.09 })
            .from(q("[data-hero-disc]"), { scale: 0.4, autoAlpha: 0, duration: 1.1 }, 0.1)
            .from(q("[data-hero-burger]"), { scale: 0.72, rotate: -14, yPercent: 10, autoAlpha: 0, duration: 1.3 }, 0.2)
            .from(q("[data-hero-sub]"), { y: 24, autoAlpha: 0, duration: 0.8 }, 0.45)
            .from(q("[data-hero-label]"), { scale: 0.6, autoAlpha: 0, duration: 0.7, stagger: 0.08, ease: "back.out(2)" }, 0.65)
            .from(q("[data-hero-cta]"), { y: 16, autoAlpha: 0, duration: 0.6, stagger: 0.06 }, 0.7)
            .from(q("[data-hero-scroll]"), { autoAlpha: 0, duration: 0.6 }, 1);

          // Subtle parallax as the hero leaves the viewport.
          gsap.to(q("[data-hero-burger]"), {
            yPercent: -8,
            rotate: 6,
            ease: "none",
            scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
          });
        },
      );
    },
    { scope: root },
  );

  return (
    <section ref={root} className="grain relative overflow-hidden bg-ivory pt-[var(--header-h)]" aria-labelledby="hero-title">
      <div className="container-x relative grid min-h-[calc(100svh-var(--header-h))] grid-rows-[auto_1fr_auto] gap-6 pb-8 pt-6 md:grid-cols-12 md:grid-rows-[1fr_auto] md:gap-x-6 md:pt-10">
        <div className="md:col-span-7 md:row-start-1 md:self-center">
          <p data-hero-reveal className="eyebrow mb-5 flex items-center gap-3 text-ink-soft">
            <span className="h-px w-10 bg-ink/40" aria-hidden="true" />
            Smash burgers · Made fresh to order
          </p>
          <h1 id="hero-title" className="display text-[clamp(4.1rem,10.4vw,10.5rem)]">
            {LINES.map((l, i) => (
              <span key={l} className="block overflow-hidden pb-[0.04em]">
                <span data-hero-line data-hero-reveal className={`block ${i === 2 ? "text-tomato" : ""}`}>
                  {l}
                </span>
              </span>
            ))}
          </h1>
        </div>

        <div className="relative md:col-span-5 md:row-span-2 md:row-start-1 md:self-center" aria-hidden="true">
          <div className="relative mx-auto aspect-square w-[min(88vw,30rem)] md:w-[125%] md:max-w-[44rem] md:-translate-x-[8%]">
            <div data-hero-disc data-hero-reveal className="absolute inset-[8%] rounded-full bg-tomato" />
            <div data-hero-disc data-hero-reveal className="absolute inset-[22%] rounded-full border-2 border-dashed border-ivory/50" />
            <div data-hero-burger data-hero-reveal className="absolute inset-x-[2%] top-[14%]">
              <Burger recipe="house" className="w-full drop-shadow-[0_30px_40px_rgb(23_23_23/0.25)]" />
            </div>
            <span data-hero-label data-hero-reveal className="eyebrow absolute left-0 top-[12%] -rotate-6 rounded-full bg-ink px-3 py-2 text-ivory">
              Made fresh to order
            </span>
            <Badge
              text="100% BIG FLAVOR • NO HALF STACKS • "
              className="absolute -right-2 bottom-[6%] size-28 text-ink md:size-36"
              inner={<span data-hero-label data-hero-reveal className="display text-3xl md:text-4xl">SH</span>}
            />
          </div>
        </div>

        <div className="md:col-span-6 md:row-start-2">
          <p data-hero-sub data-hero-reveal className="max-w-md text-lg leading-relaxed md:text-xl">
            Big flavor. Fresh ingredients. <span className="font-serif text-2xl italic">Burgers worth coming back for.</span>
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link data-hero-cta data-hero-reveal href="/order" className="btn btn-primary">
              Order now <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link data-hero-cta data-hero-reveal href="/menu" className="btn btn-ghost">
              Explore the menu
            </Link>
          </div>
          <div data-hero-cta data-hero-reveal className="mt-6">
            <OpenStatus />
          </div>
        </div>

        <a
          href="#signature"
          data-hero-scroll
          data-hero-reveal
          className="eyebrow absolute bottom-8 right-[clamp(1rem,4vw,3rem)] hidden items-center gap-2 text-ink-soft md:flex"
        >
          Scroll <ArrowDown className="size-4 animate-bounce" aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
