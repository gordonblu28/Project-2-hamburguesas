import type { ArtKey } from "@/types/product";
import { Burger } from "./burger";
import { Cookie, Fries, Lemonade, OnionRings, SauceCup, Shake, Soda, Sundae } from "./sides";

/**
 * Central art map. Each menu item references an ArtKey; to switch to real
 * photography add `image.photo` to the product in config/menu.ts instead.
 */
export const ART_TONE: Record<ArtKey, "stone" | "mustard" | "tomato" | "ink" | "ivory"> = {
  "burger-house": "mustard",
  "burger-double": "tomato",
  "burger-classic": "stone",
  "burger-bbq": "ink",
  "burger-smash": "stone",
  "burger-veggie": "stone",
  "chicken-spicy": "tomato",
  "chicken-classic": "mustard",
  "fries-truffle": "ink",
  "fries-loaded": "mustard",
  "fries-classic": "stone",
  "onion-rings": "stone",
  "shake-vanilla": "tomato",
  "shake-chocolate": "mustard",
  "shake-strawberry": "stone",
  soda: "mustard",
  lemonade: "stone",
  combo: "mustard",
  sauce: "stone",
  cookie: "stone",
  sundae: "tomato",
};

export function FoodArt({ art, className }: { art: ArtKey; className?: string }) {
  switch (art) {
    case "burger-house":
      return <Burger recipe="house" className={className} />;
    case "burger-double":
      return <Burger recipe="double" className={className} seed={8} />;
    case "burger-classic":
      return <Burger recipe="classic" className={className} seed={5} />;
    case "burger-bbq":
      return <Burger recipe="bbq" className={className} seed={12} />;
    case "burger-smash":
      return <Burger recipe="smash" className={className} seed={21} />;
    case "burger-veggie":
      return <Burger recipe="veggie" className={className} seed={33} />;
    case "chicken-spicy":
      return <Burger recipe="chickenSpicy" className={className} seed={4} />;
    case "chicken-classic":
      return <Burger recipe="chickenClassic" className={className} seed={9} />;
    case "fries-classic":
      return <Fries className={className} />;
    case "fries-truffle":
      return <Fries variant="truffle" className={className} />;
    case "fries-loaded":
      return <Fries variant="loaded" className={className} />;
    case "onion-rings":
      return <OnionRings className={className} />;
    case "shake-vanilla":
      return <Shake flavor="vanilla" className={className} />;
    case "shake-chocolate":
      return <Shake flavor="chocolate" className={className} />;
    case "shake-strawberry":
      return <Shake flavor="strawberry" className={className} />;
    case "soda":
      return <Soda className={className} />;
    case "lemonade":
      return <Lemonade className={className} />;
    case "sauce":
      return <SauceCup className={className} />;
    case "cookie":
      return <Cookie className={className} />;
    case "sundae":
      return <Sundae className={className} />;
    case "combo":
      return <Combo className={className} />;
  }
}

function Combo({ className }: { className?: string }) {
  return (
    <div className={`relative ${className ?? ""}`} aria-hidden="true">
      <Fries className="absolute left-[2%] top-[4%] w-[44%]" />
      <Soda className="absolute right-[4%] top-0 w-[34%]" />
      <Burger recipe="classic" className="absolute bottom-0 left-1/2 w-[72%] -translate-x-1/2" seed={5} />
    </div>
  );
}
