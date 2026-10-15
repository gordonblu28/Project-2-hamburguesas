import type { RestaurantConfig } from "@/types/restaurant";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  STACK HOUSE BURGERS — central restaurant configuration
 * ─────────────────────────────────────────────────────────────────────────────
 *  Every business detail below is an EDITABLE PLACEHOLDER. Nothing here is a
 *  verified real-world address, phone number, tax rate or delivery area.
 *  Replace values with information supplied by the business owner before launch.
 *
 *  - Phone numbers use the reserved fictional 555-01xx range.
 *  - `geo` is null on purpose: coordinates are only emitted in structured data
 *    once verified.
 *  - Tax rate is a sample. Confirm the correct rate with an accountant.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const restaurant: RestaurantConfig = {
  name: "Stack House Burgers",
  shortName: "Stack House",
  tagline: "Good food. No half stacks.",
  description:
    "Big flavor. Fresh ingredients. Burgers worth coming back for. Smash burgers, crispy chicken, fries and thick shakes — made to order for pickup and delivery.",
  logoText: { line1: "STACK", line2: "HOUSE" },
  theme: {
    ivory: "#F7F4ED",
    ink: "#171717",
    tomato: "#D83B2D",
    mustard: "#F2B544",
    stone: "#E7E4DD",
    white: "#FFFFFF",
  },
  currency: "USD",
  locale: "en-US",
  timeZone: "America/Chicago",
  priceRange: "$$",
  address: {
    street: "123 Placeholder Avenue",
    city: "Your City",
    region: "ST",
    postalCode: "00000",
    country: "US",
  },
  geo: null,
  phone: { display: "(555) 010-0199", e164: "+15550100199" },
  email: "hello@example.com",
  socialLinks: [
    { label: "Instagram", href: "https://instagram.com/" },
    { label: "TikTok", href: "https://tiktok.com/" },
  ],
  location: {
    parking: "Placeholder: street parking and a small lot behind the building.",
    pickupInstructions:
      "Placeholder: head to the pickup shelf to the left of the counter. Give the team your order number.",
    accessibility: undefined, // Only add once verified on site.
    mapUrl: "https://www.google.com/maps/search/?api=1&query=123+Placeholder+Avenue",
  },
  hours: {
    mon: [],
    tue: [{ open: "11:00", close: "22:00" }],
    wed: [{ open: "11:00", close: "22:00" }],
    thu: [{ open: "11:00", close: "22:00" }],
    fri: [{ open: "11:00", close: "01:00" }],
    sat: [{ open: "11:00", close: "01:00" }],
    sun: [
      { open: "11:00", close: "15:00" },
      { open: "17:00", close: "21:00" },
    ],
  },
  holidays: [
    { date: "2026-11-26", label: "Thanksgiving", windows: [] },
    { date: "2026-12-24", label: "Christmas Eve", windows: [{ open: "11:00", close: "16:00" }] },
    { date: "2026-12-25", label: "Christmas Day", windows: [] },
    { date: "2027-01-01", label: "New Year's Day", windows: [{ open: "14:00", close: "21:00" }] },
  ],
  temporaryClosure: {
    active: false,
    message: "We're temporarily closed for kitchen maintenance. Back soon.",
  },
  ordering: {
    pickupEnabled: true,
    deliveryEnabled: true,
    scheduledOrdersEnabled: true,
    scheduleWhileClosed: true,
    scheduleDaysAhead: 2,
    slotIntervalMinutes: 15,
    preparationMinutes: 20,
    deliveryMinutes: 25,
    cutoffMinutesBeforeClose: 15,
    maxItemQuantity: 20,
    maxLinesPerOrder: 40,
  },
  delivery: {
    fee: 399,
    minimumOrder: 1500,
    // Placeholder zones — NOT real coverage. Replace with the restaurant's actual delivery area.
    zones: [
      { id: "zone-a", name: "Zone A (sample)", postalCodes: ["00000", "00001", "00002"] },
      { id: "zone-b", name: "Zone B (sample)", postalCodes: ["00010", "00011"], fee: 599, minimumOrder: 2500 },
    ],
  },
  fees: { serviceFeeBps: 0, serviceFeeLabel: "Service fee" },
  tax: { rateBps: 875, label: "Sales tax (sample 8.75%)", taxDeliveryFee: false, taxServiceFee: true },
  payments: {
    onlineProvider: "stripe",
    methods: [
      {
        id: "online",
        label: "Pay online",
        description: "Secure card payment via Stripe Checkout.",
        enabled: true,
        fulfillment: ["pickup", "delivery"],
      },
      {
        id: "pay_at_pickup",
        label: "Pay at pickup",
        description: "Pay at the counter when you collect your order.",
        enabled: true,
        fulfillment: ["pickup"],
      },
      {
        id: "pay_on_delivery",
        label: "Pay on delivery",
        description: "Pay the driver when your order arrives.",
        enabled: false,
        fulfillment: ["delivery"],
      },
    ],
  },
  reviews: { showDemoReviews: true },
};

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export const fullAddress = (r: RestaurantConfig = restaurant) =>
  `${r.address.street}, ${r.address.city}, ${r.address.region} ${r.address.postalCode}`;
