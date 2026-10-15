import type { Category, ModifierGroup, Product } from "@/types/product";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  MENU — single source of truth for products, prices and modifiers.
 *  Prices are integer cents and are SAMPLE prices. The server always prices
 *  orders from this file (or a database that replaces it), never from the browser.
 *
 *  Allergen / dietary fields are intentionally sparse: only fill them in with
 *  information verified by the kitchen.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const categories: Category[] = [
  { id: "signature", name: "Signature Burgers", kicker: "The reason we exist" },
  { id: "classic", name: "Classic Burgers", kicker: "No notes needed" },
  { id: "chicken", name: "Chicken", kicker: "Crunch, then heat" },
  { id: "sides", name: "Fries & Sides", kicker: "Hot from the fryer" },
  { id: "combos", name: "Combos", kicker: "Burger, fries, drink, done" },
  { id: "drinks", name: "Shakes & Drinks", kicker: "Thick and cold" },
  { id: "extras", name: "Sauces & Extras", kicker: "Dip everything" },
  { id: "desserts", name: "Desserts", kicker: "Save room" },
];

/* ── Reusable modifier groups ─────────────────────────────────────────────── */

const pattyGroup = (doubleDelta = 350, tripleDelta = 650): ModifierGroup => ({
  id: "patties",
  name: "Patties",
  type: "single",
  min: 1,
  max: 1,
  options: [
    { id: "single", name: "Single", priceDelta: 0, default: true },
    { id: "double", name: "Double", priceDelta: doubleDelta },
    { id: "triple", name: "Triple", priceDelta: tripleDelta },
  ],
});

const cheeseGroup: ModifierGroup = {
  id: "cheese",
  name: "Cheese",
  type: "single",
  min: 1,
  max: 1,
  options: [
    { id: "american", name: "American", priceDelta: 0, default: true },
    { id: "cheddar", name: "Aged cheddar", priceDelta: 50 },
    { id: "pepper-jack", name: "Pepper jack", priceDelta: 50 },
    { id: "swiss", name: "Swiss", priceDelta: 50 },
    { id: "none", name: "No cheese", priceDelta: 0 },
  ],
};

const removeGroup = (items: string[]): ModifierGroup => ({
  id: "remove",
  name: "Remove ingredients",
  type: "multiple",
  min: 0,
  max: items.length,
  hint: "Tap anything you want left off",
  options: items.map((name) => ({
    id: `no-${name.toLowerCase().replace(/[^a-z]+/g, "-")}`,
    name: `No ${name.toLowerCase()}`,
    priceDelta: 0,
  })),
});

const extrasGroup: ModifierGroup = {
  id: "extras",
  name: "Add extras",
  type: "multiple",
  min: 0,
  max: 4,
  hint: "Up to 4",
  options: [
    { id: "bacon", name: "Thick-cut bacon", priceDelta: 250 },
    { id: "egg", name: "Fried egg", priceDelta: 150 },
    { id: "jalapenos", name: "Pickled jalapeños", priceDelta: 75 },
    { id: "grilled-onions", name: "Grilled onions", priceDelta: 75 },
    { id: "avocado", name: "Smashed avocado", priceDelta: 200, available: false },
  ],
};

const sauceGroup: ModifierGroup = {
  id: "sauce",
  name: "Sauce",
  type: "single",
  min: 1,
  max: 1,
  options: [
    { id: "house", name: "House stack sauce", priceDelta: 0, default: true },
    { id: "smoky-bbq", name: "Smoky BBQ", priceDelta: 0 },
    { id: "chipotle-mayo", name: "Chipotle mayo", priceDelta: 0 },
    { id: "garlic-aioli", name: "Garlic aioli", priceDelta: 0 },
    { id: "no-sauce", name: "No sauce", priceDelta: 0 },
  ],
};

const bunGroup: ModifierGroup = {
  id: "bun",
  name: "Bun",
  type: "single",
  min: 1,
  max: 1,
  options: [
    { id: "brioche", name: "Toasted brioche", priceDelta: 0, default: true },
    { id: "potato", name: "Potato roll", priceDelta: 0 },
    { id: "lettuce-wrap", name: "Lettuce wrap", priceDelta: 0 },
  ],
};

const shakeSize: ModifierGroup = {
  id: "size",
  name: "Size",
  type: "single",
  min: 1,
  max: 1,
  options: [
    { id: "regular", name: "Regular 16oz", priceDelta: 0, default: true },
    { id: "large", name: "Large 24oz", priceDelta: 150 },
  ],
};

const shakeToppings: ModifierGroup = {
  id: "toppings",
  name: "Toppings",
  type: "multiple",
  min: 0,
  max: 2,
  hint: "Up to 2",
  options: [
    { id: "whipped", name: "Whipped cream", priceDelta: 0, default: true },
    { id: "cherry", name: "Cherry on top", priceDelta: 0 },
    { id: "cookie-crumble", name: "Cookie crumble", priceDelta: 75 },
  ],
};

const sideSize: ModifierGroup = {
  id: "size",
  name: "Size",
  type: "single",
  min: 1,
  max: 1,
  options: [
    { id: "regular", name: "Regular", priceDelta: 0, default: true },
    { id: "large", name: "Large", priceDelta: 200 },
  ],
};

const dipGroup: ModifierGroup = {
  id: "dip",
  name: "Dipping sauce",
  type: "multiple",
  min: 0,
  max: 2,
  hint: "Up to 2",
  options: [
    { id: "house", name: "House stack sauce", priceDelta: 75 },
    { id: "garlic-aioli", name: "Garlic aioli", priceDelta: 75 },
    { id: "chipotle-mayo", name: "Chipotle mayo", priceDelta: 75 },
  ],
};

const drinkChoice: ModifierGroup = {
  id: "drink",
  name: "Drink",
  type: "single",
  min: 1,
  max: 1,
  options: [
    { id: "cola", name: "Cola", priceDelta: 0, default: true },
    { id: "lemon-lime", name: "Lemon-lime soda", priceDelta: 0 },
    { id: "lemonade", name: "House lemonade", priceDelta: 50 },
    { id: "vanilla-shake", name: "Upgrade to vanilla shake", priceDelta: 350 },
    { id: "chocolate-shake", name: "Upgrade to chocolate shake", priceDelta: 350 },
  ],
};

const comboSide: ModifierGroup = {
  id: "side",
  name: "Side",
  type: "single",
  min: 1,
  max: 1,
  options: [
    { id: "fries", name: "Stack fries", priceDelta: 0, default: true },
    { id: "truffle-fries", name: "Truffle parmesan fries", priceDelta: 200 },
    { id: "onion-rings", name: "Onion rings", priceDelta: 150 },
  ],
};

const spiceGroup: ModifierGroup = {
  id: "heat",
  name: "Heat level",
  type: "single",
  min: 1,
  max: 1,
  options: [
    { id: "mild", name: "Mild", priceDelta: 0 },
    { id: "hot", name: "Hot", priceDelta: 0, default: true },
    { id: "fire", name: "Stack fire", priceDelta: 0 },
  ],
};

/* ── Products ─────────────────────────────────────────────────────────────── */

export const products: Product[] = [
  {
    id: "p_house_stack",
    slug: "the-house-stack",
    name: "The House Stack",
    description:
      "Two smashed beef patties, American cheese, crisp lettuce, tomato, pickles, grilled onions and house stack sauce on a toasted brioche bun.",
    price: 1295,
    category: "signature",
    image: { art: "burger-house", alt: "Illustration of The House Stack double burger with lettuce, tomato and melted cheese" },
    available: true,
    featured: true,
    allowsNote: true,
    preparationNote: "Smashed and cooked to order — about 8 minutes on the grill.",
    modifierGroups: [
      bunGroup,
      cheeseGroup,
      removeGroup(["Lettuce", "Tomato", "Pickles", "Onions"]),
      extrasGroup,
      sauceGroup,
    ],
  },
  {
    id: "p_double_trouble",
    slug: "double-trouble",
    name: "Double Trouble",
    description:
      "Double patty, double cheddar, thick-cut bacon, crispy onions and chipotle mayo. Not a light lunch.",
    price: 1495,
    category: "signature",
    image: { art: "burger-double", alt: "Illustration of the Double Trouble burger with bacon and two patties" },
    available: true,
    featured: true,
    allowsNote: true,
    modifierGroups: [bunGroup, removeGroup(["Bacon", "Crispy onions"]), extrasGroup, sauceGroup],
  },
  {
    id: "p_smoky_bbq",
    slug: "smoky-bbq-burger",
    name: "Smoky BBQ Burger",
    description: "Beef patty, aged cheddar, smoky BBQ sauce, bacon and a tangle of grilled onions.",
    price: 1395,
    category: "signature",
    image: { art: "burger-bbq", alt: "Illustration of the Smoky BBQ burger dripping with sauce" },
    available: true,
    featured: true,
    allowsNote: true,
    modifierGroups: [pattyGroup(), bunGroup, removeGroup(["Bacon", "Onions"]), extrasGroup],
  },
  {
    id: "p_classic_cheese",
    slug: "classic-cheeseburger",
    name: "Classic Cheeseburger",
    description: "The one that started it all. Smashed patty, American cheese, pickles, onion, ketchup and mustard.",
    price: 995,
    category: "classic",
    image: { art: "burger-classic", alt: "Illustration of a classic cheeseburger" },
    available: true,
    featured: true,
    allowsNote: true,
    modifierGroups: [pattyGroup(), bunGroup, cheeseGroup, removeGroup(["Pickles", "Onion", "Ketchup", "Mustard"]), extrasGroup],
  },
  {
    id: "p_smash_single",
    slug: "little-smash",
    name: "Little Smash",
    description: "A single smash patty with cheese and house sauce. Small burger, big crust.",
    price: 795,
    category: "classic",
    image: { art: "burger-smash", alt: "Illustration of a small single smash burger" },
    available: true,
    allowsNote: true,
    modifierGroups: [cheeseGroup, extrasGroup, sauceGroup],
  },
  {
    id: "p_garden_stack",
    slug: "garden-stack",
    name: "Garden Stack",
    description: "Plant-based patty, vegan cheese, lettuce, tomato and garlic aioli. Ask the team about preparation.",
    price: 1295,
    category: "classic",
    image: { art: "burger-veggie", alt: "Illustration of a plant-based burger with greens" },
    available: false,
    allowsNote: true,
    preparationNote: "Cooked on a shared grill.",
    modifierGroups: [bunGroup, removeGroup(["Lettuce", "Tomato"]), sauceGroup],
  },
  {
    id: "p_spicy_chicken",
    slug: "spicy-crispy-chicken",
    name: "Spicy Crispy Chicken",
    description: "Buttermilk-brined crispy chicken thigh, hot honey glaze, slaw and pickles on a potato roll.",
    price: 1245,
    category: "chicken",
    image: { art: "chicken-spicy", alt: "Illustration of a spicy crispy chicken sandwich" },
    available: true,
    featured: true,
    allowsNote: true,
    modifierGroups: [spiceGroup, removeGroup(["Slaw", "Pickles"]), extrasGroup],
  },
  {
    id: "p_classic_chicken",
    slug: "classic-crispy-chicken",
    name: "Classic Crispy Chicken",
    description: "Crispy chicken thigh, lettuce, pickles and garlic aioli.",
    price: 1145,
    category: "chicken",
    image: { art: "chicken-classic", alt: "Illustration of a classic crispy chicken sandwich" },
    available: true,
    allowsNote: true,
    modifierGroups: [removeGroup(["Lettuce", "Pickles"]), extrasGroup, sauceGroup],
  },
  {
    id: "p_fries",
    slug: "stack-fries",
    name: "Stack Fries",
    description: "Skin-on fries, double fried and salted the second they leave the oil.",
    price: 445,
    category: "sides",
    image: { art: "fries-classic", alt: "Illustration of golden fries in a paper carton" },
    available: true,
    modifierGroups: [sideSize, dipGroup],
  },
  {
    id: "p_truffle_fries",
    slug: "truffle-parmesan-fries",
    name: "Truffle Parmesan Fries",
    description: "Stack fries tossed with truffle oil, grated parmesan and parsley.",
    price: 695,
    category: "sides",
    image: { art: "fries-truffle", alt: "Illustration of truffle parmesan fries" },
    available: true,
    featured: true,
    modifierGroups: [sideSize, dipGroup],
  },
  {
    id: "p_loaded_fries",
    slug: "loaded-fries",
    name: "Loaded Fries",
    description: "Fries buried under cheese sauce, bacon, jalapeños and house stack sauce.",
    price: 895,
    category: "sides",
    image: { art: "fries-loaded", alt: "Illustration of loaded fries with cheese sauce and jalapeños" },
    available: true,
    modifierGroups: [removeGroup(["Bacon", "Jalapeños"])],
  },
  {
    id: "p_onion_rings",
    slug: "onion-rings",
    name: "Onion Rings",
    description: "Thick-cut onion rings in a crackly beer-style batter.",
    price: 545,
    category: "sides",
    image: { art: "onion-rings", alt: "Illustration of onion rings" },
    available: true,
    modifierGroups: [dipGroup],
  },
  {
    id: "p_house_combo",
    slug: "house-combo",
    name: "House Combo",
    description: "The House Stack, Stack Fries and a drink. Swap the side or upgrade to a shake.",
    price: 1795,
    category: "combos",
    image: { art: "combo", alt: "Illustration of a burger, fries and drink combo" },
    available: true,
    featured: true,
    allowsNote: true,
    modifierGroups: [comboSide, drinkChoice, cheeseGroup, removeGroup(["Lettuce", "Tomato", "Pickles", "Onions"])],
  },
  {
    id: "p_classic_combo",
    slug: "classic-combo",
    name: "Classic Combo",
    description: "Classic Cheeseburger, Stack Fries and a drink.",
    price: 1445,
    category: "combos",
    image: { art: "combo", alt: "Illustration of a classic cheeseburger combo" },
    available: true,
    allowsNote: true,
    modifierGroups: [pattyGroup(), comboSide, drinkChoice],
  },
  {
    id: "p_chicken_combo",
    slug: "chicken-combo",
    name: "Crispy Chicken Combo",
    description: "Spicy or classic crispy chicken, Stack Fries and a drink.",
    price: 1695,
    category: "combos",
    image: { art: "combo", alt: "Illustration of a crispy chicken combo" },
    available: true,
    allowsNote: true,
    modifierGroups: [spiceGroup, comboSide, drinkChoice],
  },
  {
    id: "p_vanilla_shake",
    slug: "vanilla-shake",
    name: "Vanilla Shake",
    description: "Thick vanilla bean shake. Spoon recommended.",
    price: 645,
    category: "drinks",
    image: { art: "shake-vanilla", alt: "Illustration of a vanilla milkshake with whipped cream" },
    available: true,
    featured: true,
    modifierGroups: [shakeSize, shakeToppings],
  },
  {
    id: "p_chocolate_shake",
    slug: "chocolate-shake",
    name: "Chocolate Shake",
    description: "Dark chocolate shake with fudge swirl.",
    price: 645,
    category: "drinks",
    image: { art: "shake-chocolate", alt: "Illustration of a chocolate milkshake" },
    available: true,
    modifierGroups: [shakeSize, shakeToppings],
  },
  {
    id: "p_strawberry_shake",
    slug: "strawberry-shake",
    name: "Strawberry Shake",
    description: "Strawberry shake, seasonal. Ask what's in this week.",
    price: 645,
    category: "drinks",
    image: { art: "shake-strawberry", alt: "Illustration of a strawberry milkshake" },
    available: true,
    modifierGroups: [shakeSize, shakeToppings],
  },
  {
    id: "p_lemonade",
    slug: "house-lemonade",
    name: "House Lemonade",
    description: "Freshly squeezed, lightly sweet.",
    price: 395,
    category: "drinks",
    image: { art: "lemonade", alt: "Illustration of a glass of lemonade" },
    available: true,
    modifierGroups: [],
  },
  {
    id: "p_soda",
    slug: "fountain-soda",
    name: "Fountain Soda",
    description: "Cola, diet cola or lemon-lime.",
    price: 295,
    category: "drinks",
    image: { art: "soda", alt: "Illustration of a fountain soda cup" },
    available: true,
    modifierGroups: [
      {
        id: "flavor",
        name: "Flavor",
        type: "single",
        min: 1,
        max: 1,
        options: [
          { id: "cola", name: "Cola", priceDelta: 0, default: true },
          { id: "diet-cola", name: "Diet cola", priceDelta: 0 },
          { id: "lemon-lime", name: "Lemon-lime", priceDelta: 0 },
        ],
      },
    ],
  },
  {
    id: "p_sauce_house",
    slug: "house-stack-sauce",
    name: "House Stack Sauce",
    description: "The tangy pink one. 2oz cup.",
    price: 75,
    category: "extras",
    image: { art: "sauce", alt: "Illustration of a sauce cup" },
    available: true,
    modifierGroups: [],
  },
  {
    id: "p_sauce_aioli",
    slug: "garlic-aioli",
    name: "Garlic Aioli",
    description: "Roasted garlic, lemon, lots of it. 2oz cup.",
    price: 75,
    category: "extras",
    image: { art: "sauce", alt: "Illustration of a sauce cup" },
    available: true,
    modifierGroups: [],
  },
  {
    id: "p_extra_patty",
    slug: "extra-patty",
    name: "Extra Smash Patty",
    description: "One more patty with cheese, on the side.",
    price: 350,
    category: "extras",
    image: { art: "burger-smash", alt: "Illustration of a smash patty" },
    available: true,
    modifierGroups: [],
  },
  {
    id: "p_cookie",
    slug: "brown-butter-cookie",
    name: "Brown Butter Cookie",
    description: "Warm, chewy, dark chocolate chunks, flaky salt.",
    price: 345,
    category: "desserts",
    image: { art: "cookie", alt: "Illustration of a chocolate chunk cookie" },
    available: true,
    modifierGroups: [],
  },
  {
    id: "p_sundae",
    slug: "stack-sundae",
    name: "Stack Sundae",
    description: "Soft serve, hot fudge, toasted pecans and a cherry.",
    price: 595,
    category: "desserts",
    image: { art: "sundae", alt: "Illustration of an ice cream sundae" },
    available: true,
    modifierGroups: [],
  },
];

export const productById = new Map(products.map((p) => [p.id, p]));
export const productBySlug = new Map(products.map((p) => [p.slug, p]));
