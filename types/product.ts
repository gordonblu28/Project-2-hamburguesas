/** All money values are integer cents. */
export type Cents = number;

export type CategoryId =
  | "signature"
  | "classic"
  | "chicken"
  | "sides"
  | "combos"
  | "drinks"
  | "extras"
  | "desserts";

export interface Category {
  id: CategoryId;
  name: string;
  /** Short editorial line shown above the category on the menu. */
  kicker: string;
}

export interface ModifierOption {
  id: string;
  name: string;
  /** Price adjustment in cents. May be 0. Negative values are not allowed. */
  priceDelta: Cents;
  available?: boolean;
  /** Pre-selected when the customizer opens. */
  default?: boolean;
}

export interface ModifierGroup {
  id: string;
  name: string;
  /** "single" renders as radio buttons, "multiple" as checkboxes. */
  type: "single" | "multiple";
  min: number;
  max: number;
  /** Optional helper copy e.g. "Tap to remove". */
  hint?: string;
  options: ModifierOption[];
}

/** Keys into the illustrated art library (components/art). */
export type ArtKey =
  | "burger-house"
  | "burger-double"
  | "burger-classic"
  | "burger-bbq"
  | "burger-smash"
  | "burger-veggie"
  | "chicken-spicy"
  | "chicken-classic"
  | "fries-truffle"
  | "fries-loaded"
  | "fries-classic"
  | "onion-rings"
  | "shake-vanilla"
  | "shake-chocolate"
  | "shake-strawberry"
  | "soda"
  | "lemonade"
  | "combo"
  | "sauce"
  | "cookie"
  | "sundae";

export interface ProductImage {
  /** Illustrated fallback that always renders. */
  art: ArtKey;
  /** Optional photograph path (e.g. /images/menu/house-stack.jpg). When set it replaces the art. */
  photo?: string;
  alt: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: Cents;
  category: CategoryId;
  image: ProductImage;
  available: boolean;
  featured?: boolean;
  /** Only populate with information verified by the kitchen. */
  dietary?: string[];
  allergens?: string[];
  calories?: number;
  preparationNote?: string;
  /** Whether the customer may leave a free-text note for this item. */
  allowsNote?: boolean;
  modifierGroups: ModifierGroup[];
}

/** groupId -> selected option ids */
export type ModifierSelection = Record<string, string[]>;
