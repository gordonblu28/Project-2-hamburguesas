import { restaurant } from "@/config/restaurant";

/**
 * DEMO REVIEWS — placeholder content, clearly labelled on the page.
 * Replace with genuine, verifiable customer reviews (with permission) or set
 * restaurant.reviews.showDemoReviews = false to hide this section.
 */
const DEMO_REVIEWS = [
  { quote: "The crust on the patties is unreal. I think about the House Stack weekly.", name: "Sample reviewer A" },
  { quote: "Truffle fries arrived crispy after a 20 minute drive. Witchcraft.", name: "Sample reviewer B" },
  { quote: "Ordered ASAP, it was ready when I walked in. Chocolate shake is dangerous.", name: "Sample reviewer C" },
];

export function Reviews() {
  if (!restaurant.reviews.showDemoReviews) return null;
  return (
    <section className="overflow-hidden bg-mustard py-24 md:py-32" aria-labelledby="reviews-title">
      <div className="container-x">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 id="reviews-title" className="display text-[clamp(3rem,8vw,7rem)]">
            Word of mouth
          </h2>
          <p className="eyebrow rounded-full border-2 border-ink px-4 py-2">Demo content — not real reviews</p>
        </div>
        <ul className="mt-14 grid gap-10 md:grid-cols-3">
          {DEMO_REVIEWS.map((r, i) => (
            <li key={r.name} className={i === 1 ? "md:translate-y-12" : ""}>
              <figure>
                <blockquote className="font-serif text-3xl leading-tight">“{r.quote}”</blockquote>
                <figcaption className="eyebrow mt-5">— {r.name}</figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
