"use client";

import { Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { categories, products } from "@/config/menu";
import { CartContents } from "@/components/cart/CartDrawer";
import { FulfillmentToggle } from "@/components/cart/FulfillmentToggle";
import { OpenStatus } from "@/components/restaurant/OpenStatus";
import type { CategoryId } from "@/types/product";
import { ProductCard } from "./ProductCard";

/** `withCartPanel` adds a persistent cart column on large screens (used by /order). */
export function MenuBrowser({ withCartPanel = false }: { withCartPanel?: boolean }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<CategoryId>(categories[0]!.id);
  const navRef = useRef<HTMLDivElement>(null);

  const q = query.trim().toLowerCase();
  const grouped = useMemo(
    () =>
      categories
        .map((c) => ({
          category: c,
          items: products.filter(
            (p) => p.category === c.id && (!q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)),
          ),
        }))
        .filter((g) => g.items.length > 0),
    [q],
  );

  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>("[data-menu-section]");
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const id = visible[0]?.target.getAttribute("data-menu-section") as CategoryId | undefined;
        if (id) setActive(id);
        else if (sections[0] && sections[0].getBoundingClientRect().top > window.innerHeight * 0.3) {
          setActive(sections[0].getAttribute("data-menu-section") as CategoryId);
        }
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [grouped]);

  useEffect(() => {
    const chip = navRef.current?.querySelector<HTMLElement>(`[data-chip="${active}"]`);
    chip?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [active]);

  return (
    <div>
      <div className="container-x grid gap-4 pb-6 md:grid-cols-[minmax(0,22rem)_1fr_minmax(0,20rem)] md:items-center">
        <FulfillmentToggle />
        <OpenStatus className="md:justify-self-center" />
        <div className="relative">
          <label htmlFor="menu-search" className="sr-only">
            Search the menu
          </label>
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-soft" aria-hidden="true" />
          <input
            id="menu-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search burgers, fries, shakes…"
            className="field !rounded-full !pl-11"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full hover:bg-stone"
              aria-label="Clear search"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <div className="sticky top-[var(--header-h)] z-30 border-y border-ink/10 bg-ivory/95 backdrop-blur">
        <nav aria-label="Menu categories" className="container-x">
          <div ref={navRef} className="-mx-2 flex gap-1 overflow-x-auto py-2 [scrollbar-width:none]">
            {grouped.map(({ category }) => (
              <a
                key={category.id}
                href={`#${category.id}`}
                data-chip={category.id}
                aria-current={active === category.id ? "true" : undefined}
                onClick={() => setActive(category.id)}
                className="shrink-0 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold transition hover:bg-stone aria-[current=true]:bg-ink aria-[current=true]:text-ivory"
              >
                {category.name}
              </a>
            ))}
          </div>
        </nav>
      </div>

      <div className={`container-x pb-24 ${withCartPanel ? "lg:grid lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-10" : ""}`}>
        <div className="min-w-0">
        <p className="sr-only" aria-live="polite">
          {q ? `${grouped.reduce((n, g) => n + g.items.length, 0)} items match “${query}”` : ""}
        </p>
        {grouped.length === 0 && (
          <div className="py-24 text-center">
            <p className="display text-5xl">No matches</p>
            <p className="mt-3 text-ink-soft">Nothing on the menu matches “{query}”. Try “fries” or “shake”.</p>
          </div>
        )}
        {grouped.map(({ category, items }) => (
          <section key={category.id} id={category.id} data-menu-section={category.id} className="scroll-mt-36 pt-16" aria-labelledby={`h-${category.id}`}>
            <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b-2 border-ink pb-4">
              <h2 id={`h-${category.id}`} className="display text-[clamp(2.75rem,7vw,5.5rem)]">
                {category.name}
              </h2>
              <p className="font-serif text-xl italic text-ink-soft">{category.kicker}</p>
            </header>
            <div className={`grid gap-x-6 gap-y-12 sm:grid-cols-2 ${withCartPanel ? "xl:grid-cols-3" : "lg:grid-cols-3"}`}>
              {items.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </section>
        ))}
        </div>
        {withCartPanel && (
          <aside aria-label="Your order" className="hidden lg:block">
            <div className="sticky top-[calc(var(--header-h)+5rem)] mt-16 h-[calc(100dvh-var(--header-h)-7rem)] overflow-hidden rounded-[1.5rem] bg-ivory ring-2 ring-ink">
              <CartContents />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
