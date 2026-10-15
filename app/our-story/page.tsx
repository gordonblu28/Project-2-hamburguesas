import type { Metadata } from "next";
import Link from "next/link";
import { Burger } from "@/components/art/burger";
import { Shake } from "@/components/art/sides";
import { Reveal } from "@/components/animations/Reveal";
import { PageHeader } from "@/components/layout/PageHeader";
import { restaurant } from "@/config/restaurant";

export const metadata: Metadata = {
  title: "Our Story",
  description: `The story behind ${restaurant.name}: smash burgers, made fresh to order.`,
  alternates: { canonical: "/our-story" },
};

/** Sample brand story. Replace with the owners' real story; avoid unverified sourcing or certification claims. */
const CHAPTERS = [
  { n: "01", title: "One flat-top, one idea", body: "Stack House started with a simple obsession: the perfect crust on a smashed patty. Everything else on the menu exists to support that." },
  { n: "02", title: "Made to order", body: "Nothing is cooked ahead and nothing waits under a heat lamp. When you order, your burger hits the griddle." },
  { n: "03", title: "A room to hang out in", body: "Loud music, a long counter and shakes thick enough to need a spoon. Come for a burger, stay for a second." },
];

export default function StoryPage() {
  return (
    <>
      <PageHeader eyebrow="Our story" title={<>No half <span className="text-tomato">stacks.</span></>} tone="ink">
        <p className="text-ivory/80">Sample brand story — edit this page with the restaurant&rsquo;s real history.</p>
      </PageHeader>
      <div className="container-x py-24">
        <div className="grid items-center gap-12 md:grid-cols-12">
          <div className="grain relative aspect-square overflow-hidden rounded-[1.5rem] bg-mustard md:col-span-6">
            <Burger recipe="house" spread={12} className="absolute inset-x-[10%] top-[8%] w-[80%]" />
          </div>
          <div className="md:col-span-5 md:col-start-8">
            <p className="font-serif text-4xl leading-tight">
              &ldquo;We wanted the kind of burger you think about on the drive home.&rdquo;
            </p>
            <p className="eyebrow mt-6 text-ink-soft">— The Stack House team (sample quote)</p>
          </div>
        </div>
        <ol className="mt-28 space-y-0">
          {CHAPTERS.map((c) => (
            <Reveal as="li" key={c.n} className="grid gap-6 border-t-2 border-ink py-10 md:grid-cols-12">
              <span className="display text-7xl text-tomato md:col-span-2">{c.n}</span>
              <h2 className="display text-5xl md:col-span-4">{c.title}</h2>
              <p className="text-lg text-ink-soft md:col-span-5 md:col-start-8">{c.body}</p>
            </Reveal>
          ))}
        </ol>
        <div className="mt-20 flex flex-col items-center gap-8 text-center">
          <Shake flavor="chocolate" className="w-32" />
          <Link href="/order" className="btn btn-primary">
            Order online
          </Link>
        </div>
      </div>
    </>
  );
}
