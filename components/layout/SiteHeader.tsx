"use client";

import { Menu as MenuIcon, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cartCount, useCart } from "@/lib/cart/store";
import { useUi } from "@/lib/cart/ui";
import { Sheet, SheetClose } from "@/components/ui/Sheet";
import { Logo } from "./Logo";
import { NAV_LINKS } from "./nav";

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const count = useCart((s) => cartCount(s.lines));
  const hydrated = useCart((s) => s.hydrated);
  const openCart = useUi((s) => s.openCart);

  useEffect(() => {
    const sentinel = document.getElementById("top-sentinel");
    if (!sentinel) return;
    const io = new IntersectionObserver(([e]) => setScrolled(!e?.isIntersecting), { rootMargin: "24px 0px 0px 0px" });
    io.observe(sentinel);
    return () => io.disconnect();
  }, []);

  const overHero = pathname === "/" && !scrolled;
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-300 ${
          overHero ? "bg-transparent" : "bg-ivory/90 shadow-[0_1px_0_rgb(23_23_23/0.08)] backdrop-blur-md"
        }`}
      >
        <div className="container-x flex h-[var(--header-h)] items-center justify-between gap-4">
          <Link href="/" className="rounded-full" aria-label="Stack House Burgers — home">
            <Logo />
          </Link>

          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-8 text-[0.8rem] font-semibold uppercase tracking-[0.14em]">
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={isActive(l.href) ? "page" : undefined}
                    className="link-underline py-2 aria-[current=page]:bg-[length:100%_2px]"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/order" className="btn btn-primary hidden !min-h-11 !px-5 !py-2.5 sm:inline-flex">
              Order online
            </Link>
            <button
              type="button"
              onClick={openCart}
              className="relative grid size-11 place-items-center rounded-full bg-ink text-ivory transition hover:bg-tomato"
              aria-label={`Open cart, ${hydrated ? count : 0} ${count === 1 ? "item" : "items"}`}
            >
              <ShoppingBag className="size-5" aria-hidden="true" />
              {hydrated && count > 0 && (
                <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-mustard px-1 text-[0.7rem] font-bold leading-5 text-ink tabular-nums">
                  {count}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="grid size-11 place-items-center rounded-full ring-2 ring-ink lg:hidden"
              aria-label="Open navigation menu"
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
            >
              <MenuIcon className="size-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} label="Navigation menu">
        <div className="flex h-full flex-col bg-ink text-ivory">
          <div className="flex items-center justify-between p-4">
            <Logo />
            <SheetClose onClose={() => setMenuOpen(false)} label="Close navigation menu" />
          </div>
          <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-6 pt-6">
            <ul className="space-y-1">
              {NAV_LINKS.map((l, i) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={() => setMenuOpen(false)}
                    aria-current={isActive(l.href) ? "page" : undefined}
                    className="display flex items-baseline gap-4 py-2 text-5xl transition hover:text-mustard aria-[current=page]:text-mustard"
                  >
                    <span className="font-sans text-xs font-bold tracking-widest text-ivory/50">0{i + 1}</span>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="space-y-3 p-6">
            <Link href="/order" onClick={() => setMenuOpen(false)} className="btn btn-primary w-full">
              Order online
            </Link>
          </div>
        </div>
      </Sheet>
    </>
  );
}
