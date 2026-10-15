import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { categories, products } from "@/config/menu";
import { formatMoney } from "@/lib/money";

const SHOW = ["signature", "classic", "chicken", "sides", "drinks", "desserts"] as const;

/** A printed-menu-board preview — typographic, no cards. */
export function MenuPreview() {
  return (
    <section className="grain bg-ink py-24 text-ivory md:py-32" aria-labelledby="menu-preview-title">
      <div className="container-x">
        <div className="flex flex-wrap items-end justify-between gap-6 border-b border-ivory/20 pb-8">
          <h2 id="menu-preview-title" className="display text-[clamp(3.5rem,9vw,8rem)]">
            The <span className="text-mustard">menu</span>
          </h2>
          <Link href="/order" className="btn btn-primary">
            Start your order <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="mt-12 grid gap-x-16 gap-y-14 md:grid-cols-2 xl:grid-cols-3">
          {SHOW.map((id) => {
            const cat = categories.find((c) => c.id === id)!;
            const items = products.filter((p) => p.category === id).slice(0, 4);
            return (
              <div key={id}>
                <h3 className="eyebrow text-mustard">{cat.name}</h3>
                <ul className="mt-4 space-y-3">
                  {items.map((p) => (
                    <li key={p.id} className="flex items-baseline gap-3">
                      <Link href={`/menu#${p.category}`} className={`font-semibold hover:text-mustard ${p.available ? "" : "text-ivory/40 line-through"}`}>
                        {p.name}
                      </Link>
                      <span className="mb-1 flex-1 border-b border-dotted border-ivory/30" aria-hidden="true" />
                      <span className="tabular-nums text-ivory/85">{formatMoney(p.price)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
        <p className="mt-14 text-xs text-ivory/50">Sample prices. Taxes and fees calculated at checkout.</p>
      </div>
    </section>
  );
}
