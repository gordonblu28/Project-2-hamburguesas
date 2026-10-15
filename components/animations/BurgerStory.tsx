"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { Burger, RECIPES } from "@/components/art/burger";
import { gsap, ScrollTrigger, useGSAP } from "./gsap";

const SCENES = [
  {
    key: "bun",
    word: "Bun",
    eyebrow: "01 — The bun",
    title: "Start with the good stuff.",
    body: "A soft brioche bun, buttered and toasted on the flat-top until the edges go golden and crisp.",
    bg: "#F7F4ED",
    fg: "#171717",
  },
  {
    key: "patty",
    word: "Patty",
    eyebrow: "02 — The patty",
    title: "Smashed hard. Seared fast.",
    body: "Fresh beef balls pressed thin onto a ripping-hot griddle, so every patty gets that lacy, caramelised crust.",
    bg: "#171717",
    fg: "#F7F4ED",
  },
  {
    key: "cheese",
    word: "Cheese",
    eyebrow: "03 — The cheese",
    title: "Melted. Not suggested.",
    body: "Cheese goes on while the patty is still sizzling, then the lid comes down so it drapes over every edge.",
    bg: "#F2B544",
    fg: "#171717",
  },
  {
    key: "stack",
    word: "Stack",
    eyebrow: "04 — The stack",
    title: "The House Stack.",
    body: "Two patties, two slices, crisp lettuce, tomato, pickles and house sauce. Built in the order it tastes best.",
    bg: "#D83B2D",
    fg: "#F7F4ED",
  },
] as const;

const N = RECIPES.house.length;

/** Signature scroll-linked burger story. Pinned on larger screens, stacked panels on mobile / reduced motion. */
export function BurgerStory() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
        const q = gsap.utils.selector(root);
        const stage = q("[data-stage]")[0] as HTMLElement;
        const layers = q("[data-pinned-burger] [data-layer]");
        const byKind = (kind: string) => layers.filter((l) => l.getAttribute("data-layer") === kind);
        const spread = (i: number) => (i - (N - 1) / 2) * 30;
        const panels = q("[data-panel]");
        const words = q("[data-word]");
        const ticks = q("[data-tick]");

        gsap.set(panels.slice(1), { autoAlpha: 0, y: 40 });
        gsap.set(words.slice(1), { autoAlpha: 0, yPercent: 20 });

        const tl = gsap.timeline({
          defaults: { ease: "power2.inOut", duration: 1 },
          scrollTrigger: {
            trigger: stage,
            start: "top top",
            end: () => `+=${window.innerHeight * 3.2}`,
            pin: true,
            scrub: 0.6,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              const idx = Math.min(SCENES.length - 1, Math.floor(self.progress * SCENES.length));
              ticks.forEach((t, i) => t.classList.toggle("is-active", i <= idx));
            },
          },
        });

        const toScene = (i: number) => {
          const s = SCENES[i]!;
          const at = `scene${i}`;
          tl.addLabel(at)
            .to(stage, { backgroundColor: s.bg, color: s.fg, duration: 0.6 }, at)
            .to(panels[i - 1]!, { autoAlpha: 0, y: -40, duration: 0.5 }, at)
            .to(panels[i]!, { autoAlpha: 1, y: 0, duration: 0.5 }, `${at}+=0.35`)
            .to(words[i - 1]!, { autoAlpha: 0, yPercent: -20, duration: 0.5 }, at)
            .to(words[i]!, { autoAlpha: 1, yPercent: 0, duration: 0.5 }, `${at}+=0.3`);
        };

        // Scene 1 → bun lifts slightly, burger turns.
        tl.to(byKind("bunTop"), { y: -40, duration: 0.8 }, 0).to(q("[data-burger-wrap]"), { rotate: -4, duration: 0.8 }, 0);

        // Scene 2 → explode the layers to reveal the patties.
        toScene(1);
        layers.forEach((l) => {
          const i = Number(l.getAttribute("data-index"));
          tl.to(l, { y: spread(i), duration: 1 }, "scene1");
        });
        tl.to(q("[data-burger-wrap]"), { rotate: 3, scale: 0.92, duration: 1 }, "scene1");

        // Scene 3 → spotlight the cheese.
        toScene(2);
        tl.to(layers.filter((l) => !/cheese/.test(l.getAttribute("data-layer") ?? "")), { opacity: 0.28, duration: 0.6 }, "scene2").to(
          [...byKind("cheese")],
          { scaleX: 1.08, transformOrigin: "50% 50%", duration: 0.6 },
          "scene2",
        );

        // Scene 4 → restack and present.
        toScene(3);
        tl.to(layers, { y: 0, opacity: 1, scaleX: 1, duration: 1 }, "scene3")
          .to(q("[data-burger-wrap]"), { rotate: 0, scale: 1.08, duration: 1 }, "scene3")
          .from(q("[data-story-cta]"), { autoAlpha: 0, y: 20, duration: 0.4 }, "scene3+=0.6")
          .to({}, { duration: 0.4 });

        // Fonts/images can change layout height after first paint.
        document.fonts?.ready.then(() => ScrollTrigger.refresh());
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="signature" aria-labelledby="story-title" className="relative">
      <h2 id="story-title" className="sr-only">
        How we build The House Stack
      </h2>

      {/* Pinned, scroll-linked version */}
      <div data-stage className="relative hidden h-svh overflow-hidden bg-ivory text-ink md:block md:motion-reduce:hidden">
        <div className="pointer-events-none absolute inset-0 grid place-items-center opacity-[0.08]" aria-hidden="true">
          {SCENES.map((s) => (
            <span
              key={s.key}
              data-word
              className="display absolute select-none text-[clamp(10rem,28vw,30rem)]"
            >
              {s.word}
            </span>
          ))}
        </div>

        <div className="container-x relative grid h-full grid-cols-12 items-center gap-6 pt-[var(--header-h)]">
          <div className="relative col-span-5 h-[22rem]">
            {SCENES.map((s, i) => (
              <div key={s.key} data-panel className="absolute inset-0 flex flex-col justify-center">
                <p className="eyebrow opacity-70">{s.eyebrow}</p>
                <p className="display mt-4 text-[clamp(3rem,5.6vw,5.75rem)]">{s.title}</p>
                <p className="mt-5 max-w-sm text-lg opacity-80">{s.body}</p>
                {i === SCENES.length - 1 && (
                  <div data-story-cta className="mt-8">
                    <Link href="/order" className="btn bg-ivory text-ink hover:bg-ink hover:text-ivory">
                      Order the House Stack <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="col-span-7 flex h-full items-center justify-center">
            <div data-burger-wrap data-pinned-burger className="w-[min(40rem,52vw)]">
              <Burger recipe="house" className="w-full" />
            </div>
          </div>
        </div>

        <ol className="absolute bottom-8 left-1/2 flex -translate-x-1/2 gap-2" aria-hidden="true">
          {SCENES.map((s) => (
            <li
              key={s.key}
              data-tick
              className="h-1 w-10 rounded-full bg-current opacity-20 transition-opacity [&.is-active]:opacity-100"
            />
          ))}
        </ol>
      </div>

      {/* Stacked fallback: mobile and reduced motion */}
      <div className="md:hidden md:motion-reduce:block">
        {SCENES.map((s, i) => (
          <article key={s.key} style={{ backgroundColor: s.bg, color: s.fg }} className="grain overflow-hidden px-4 py-16 sm:px-8">
            <p className="eyebrow opacity-70">{s.eyebrow}</p>
            <h3 className="display mt-3 text-6xl">{s.title}</h3>
            <p className="mt-4 max-w-md text-lg opacity-85">{s.body}</p>
            <div className="mx-auto mt-10 w-[min(26rem,86%)]">
              <Burger recipe="house" spread={i === 1 || i === 2 ? 14 : 0} className="w-full" />
            </div>
            {i === SCENES.length - 1 && (
              <Link href="/order" className="btn mt-10 bg-ivory text-ink">
                Order the House Stack <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
