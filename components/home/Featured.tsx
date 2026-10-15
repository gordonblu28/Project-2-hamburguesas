import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { products } from "@/config/menu";
import { ART_TONE } from "@/components/art/FoodArt";
import { ProductVisual } from "@/components/art/ProductVisual";
import { Reveal } from "@/components/animations/Reveal";
import { AddToOrderButton } from "@/components/menu/AddToOrderButton";
import { formatMoney } from "@/lib/money";

const TONE = { stone: "bg-stone", mustard: "bg-mustard", tomato: "bg-tomato", ink: "bg-ink", ivory: "bg-paper" } as const;

export function Featured() {
  const featured = products.filter((p) => p.featured && p.available && (p.category === "signature" || p.category === "classic" || p.category === "chicken")).slice(0, 5);
  return (
    <section className="container-x py-24 md:py-36" aria-labelledby="featured-title">
      <div className="grid gap-12 md:grid-cols-12">
        <div className="md:col-span-4">
          <div className="md:sticky md:top-32">
            <p className="eyebrow text-tomato-ink">The heavy hitters</p>
            <h2 id="featured-title" className="display mt-4 text-[clamp(3.5rem,7vw,7rem)]">
              Fan
              <br />
              favorites
            </h2>
            <p className="mt-6 max-w-xs text-ink-soft">The burgers people drive across town for. Customize any of them before you add to your order.</p>
            <Link href="/menu" className="btn btn-ghost mt-8">
              Full menu <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
        <ol className="md:col-span-8">
          {featured.map((p, i) => (
            <Reveal as="li" key={p.id} className="group border-t-2 border-ink last:border-b-2">
              <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 py-6 sm:gap-8 md:py-8">
                <div className={`grain relative size-24 shrink-0 overflow-hidden rounded-full sm:size-36 ${TONE[ART_TONE[p.image.art]]}`}>
                  <ProductVisual image={p.image} className="absolute inset-[10%] transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6" />
                </div>
                <div className="min-w-0">
                  <p className="eyebrow text-ink-soft">
                    {String(i + 1).padStart(2, "0")} · {formatMoney(p.price)}
                  </p>
                  <h3 className="display mt-1 text-[clamp(2.25rem,5vw,4.5rem)] transition-colors group-hover:text-tomato">{p.name}</h3>
                  <p className="mt-2 hidden max-w-lg text-sm text-ink-soft sm:block">{p.description}</p>
                </div>
                <AddToOrderButton productId={p.id} />
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
