import Link from "next/link";
import { Burger } from "@/components/art/burger";

export default function NotFound() {
  return (
    <div className="container-x grid min-h-[80svh] items-center gap-10 pt-[var(--header-h)] md:grid-cols-2">
      <div>
        <p className="eyebrow text-tomato-ink">404</p>
        <h1 className="display mt-4 text-[clamp(4rem,12vw,10rem)]">Half a stack.</h1>
        <p className="mt-4 text-lg text-ink-soft">We couldn&rsquo;t find that page.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="btn btn-dark">
            Home
          </Link>
          <Link href="/menu" className="btn btn-ghost">
            See the menu
          </Link>
        </div>
      </div>
      <Burger recipe="classic" spread={26} className="mx-auto w-full max-w-md" />
    </div>
  );
}
