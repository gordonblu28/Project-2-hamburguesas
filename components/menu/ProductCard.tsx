import { ART_TONE } from "@/components/art/FoodArt";
import { ProductVisual } from "@/components/art/ProductVisual";
import { formatMoney } from "@/lib/money";
import type { Product } from "@/types/product";
import { AddToOrderButton } from "./AddToOrderButton";

const TONE = {
  stone: "bg-stone",
  mustard: "bg-mustard",
  tomato: "bg-tomato",
  ink: "bg-ink",
  ivory: "bg-paper",
} as const;

export function ProductCard({ product, index }: { product: Product; index?: number }) {
  const tone = ART_TONE[product.image.art];
  return (
    <article className="group flex flex-col" aria-labelledby={`p-${product.id}`}>
      <div className={`grain relative aspect-[5/4] overflow-hidden rounded-[1.25rem] ${TONE[tone]} ${product.available ? "" : "grayscale-[0.7]"}`}>
        {index !== undefined && (
          <span className={`eyebrow absolute left-4 top-4 ${tone === "ink" || tone === "tomato" ? "text-ivory/80" : "text-ink/60"}`}>
            {String(index + 1).padStart(2, "0")}
          </span>
        )}
        {product.featured && (
          <span className="eyebrow absolute right-4 top-4 rounded-full bg-ivory px-2.5 py-1 text-ink">Fan favorite</span>
        )}
        <ProductVisual
          image={product.image}
          className="absolute inset-x-[12%] inset-y-[14%] transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:-translate-y-1.5 group-hover:scale-[1.04]"
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
        />
        {!product.available && (
          <span className="absolute inset-x-0 bottom-0 bg-ink/85 py-2 text-center text-xs font-bold uppercase tracking-widest text-ivory">
            Unavailable today
          </span>
        )}
      </div>
      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 id={`p-${product.id}`} className="display text-[2rem]">
            {product.name}
          </h3>
          <p className="mt-2 line-clamp-3 text-sm text-ink-soft">{product.description}</p>
          <p className="mt-2 font-bold tabular-nums">{formatMoney(product.price)}</p>
          {product.dietary && product.dietary.length > 0 && <p className="eyebrow mt-2 text-ink-soft">{product.dietary.join(" · ")}</p>}
        </div>
        <AddToOrderButton productId={product.id} />
      </div>
    </article>
  );
}
