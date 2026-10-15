import { FoodArt } from "@/components/art/FoodArt";
import { Reveal } from "@/components/animations/Reveal";
import type { ArtKey } from "@/types/product";

/**
 * Kitchen gallery. Ships with illustrated tiles; replace any `art` with a
 * photograph (next/image) once the restaurant's own food photography exists.
 */
const TILES: { art: ArtKey; label: string; bg: string; span: string; fg?: string }[] = [
  { art: "burger-bbq", label: "Smoky BBQ, sauce first", bg: "bg-mustard", span: "md:col-span-7 md:row-span-2 aspect-[4/5] md:aspect-auto" },
  { art: "shake-chocolate", label: "Spoon recommended", bg: "bg-stone", span: "md:col-span-5 aspect-[5/4]" },
  { art: "fries-loaded", label: "Loaded, not lightly", bg: "bg-ink", span: "md:col-span-5 aspect-[5/4]", fg: "text-ivory/70" },
  { art: "chicken-spicy", label: "Hot honey crunch", bg: "bg-tomato", span: "md:col-span-4 aspect-square", fg: "text-ivory/80" },
  { art: "onion-rings", label: "Rings, thick-cut", bg: "bg-paper", span: "md:col-span-4 aspect-square" },
  { art: "sundae", label: "Save room", bg: "bg-mustard", span: "md:col-span-4 aspect-square" },
];

export function Gallery() {
  return (
    <section className="container-x py-24 md:py-36" aria-labelledby="gallery-title">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <h2 id="gallery-title" className="display text-[clamp(3rem,8vw,7rem)]">
          From the <span className="text-tomato">griddle</span>
        </h2>
        <p className="max-w-xs text-sm text-ink-soft">Hot off the flat-top, straight into the bag. Tag us when it lands.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 md:auto-rows-[minmax(14rem,auto)] md:grid-cols-12 md:gap-4">
        {TILES.map((t, i) => (
          <Reveal key={t.label} delay={(i % 3) * 90} className={`grain group relative col-span-2 overflow-hidden rounded-[1.25rem] ${t.bg} ${t.span} ${i > 2 ? "col-span-1 md:col-span-4" : ""}`}>
            <figure className="absolute inset-0 m-0">
              <div className="absolute inset-[12%] transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-105" aria-hidden="true">
                <FoodArt art={t.art} className="h-full w-full" />
              </div>
              <figcaption className={`eyebrow absolute bottom-4 left-4 ${t.fg ?? "text-ink/70"}`}>{t.label}</figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
