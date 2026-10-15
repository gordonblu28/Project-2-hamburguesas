import { productBySlug } from "@/config/menu";
import { FoodArt } from "@/components/art/FoodArt";
import { AddToOrderButton } from "@/components/menu/AddToOrderButton";
import { formatMoney } from "@/lib/money";

export function ComboPromo() {
  const combo = productBySlug.get("house-combo");
  if (!combo) return null;
  return (
    <section className="grain relative overflow-hidden bg-tomato text-ivory" aria-labelledby="combo-title">
      <div className="overflow-hidden border-y-2 border-ink bg-mustard py-3 text-ink" aria-hidden="true">
        <div className="marquee-track flex w-max gap-8 whitespace-nowrap">
          {Array.from({ length: 2 }).map((_, k) => (
            <span key={k} className="display flex gap-8 text-3xl">
              {Array.from({ length: 6 }).map((__, i) => (
                <span key={i}>Burger · Fries · Drink ✦</span>
              ))}
            </span>
          ))}
        </div>
      </div>
      <div className="container-x grid items-center gap-10 py-20 md:grid-cols-12 md:py-28">
        <div className="md:col-span-6">
          <p className="eyebrow text-ivory/80">The full meal deal</p>
          <h2 id="combo-title" className="display mt-4 text-[clamp(4rem,11vw,10rem)]">
            House
            <br />
            combo
          </h2>
          <p className="mt-6 max-w-md text-lg text-ivory/90">{combo.description}</p>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <AddToOrderButton productId={combo.id} variant="pill" className="!bg-ivory !text-ink hover:!bg-ink hover:!text-ivory" label="Build your combo" />
            <p className="display text-5xl">
              {formatMoney(combo.price)}
              <span className="ml-2 align-middle font-sans text-xs font-bold tracking-widest">FROM</span>
            </p>
          </div>
        </div>
        <div className="relative md:col-span-6" aria-hidden="true">
          <div className="absolute inset-[6%] rounded-full bg-ink/15" />
          <FoodArt art="combo" className="relative mx-auto aspect-square w-full max-w-[34rem]" />
        </div>
      </div>
    </section>
  );
}
