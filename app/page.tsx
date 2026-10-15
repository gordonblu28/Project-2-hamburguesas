import { BurgerStory } from "@/components/animations/BurgerStory";
import { Hero } from "@/components/hero/Hero";
import { ComboPromo } from "@/components/home/ComboPromo";
import { Featured } from "@/components/home/Featured";
import { FinalCta } from "@/components/home/FinalCta";
import { Gallery } from "@/components/home/Gallery";
import { MenuPreview } from "@/components/home/MenuPreview";
import { Philosophy } from "@/components/home/Philosophy";
import { Reviews } from "@/components/home/Reviews";
import { LocationBlock } from "@/components/restaurant/LocationBlock";
import { JsonLd, restaurantJsonLd } from "@/lib/seo";

export default function HomePage() {
  return (
    <>
      <JsonLd data={restaurantJsonLd()} />
      <Hero />
      <BurgerStory />
      <Featured />
      <ComboPromo />
      <Philosophy />
      <MenuPreview />
      <Gallery />
      <section className="border-t-2 border-ink bg-ivory py-24 md:py-32" aria-label="Location and hours">
        <div className="container-x">
          <p className="eyebrow mb-6 text-tomato-ink">Location & hours</p>
          <LocationBlock />
        </div>
      </section>
      <Reviews />
      <FinalCta />
    </>
  );
}
