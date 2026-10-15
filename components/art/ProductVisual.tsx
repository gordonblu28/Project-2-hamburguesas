import Image from "next/image";
import type { ProductImage } from "@/types/product";
import { FoodArt } from "./FoodArt";

/** Renders a product photograph when configured, otherwise the illustrated art. */
export function ProductVisual({ image, className, sizes = "(min-width: 1024px) 33vw, 90vw", priority = false }: {
  image: ProductImage;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  if (image.photo) {
    return (
      <div className={`relative ${className ?? ""}`}>
        <Image src={image.photo} alt={image.alt} fill sizes={sizes} priority={priority} className="object-contain" />
      </div>
    );
  }
  return (
    <div className={className} role="img" aria-label={image.alt}>
      <FoodArt art={image.art} className="h-full w-full" />
    </div>
  );
}
