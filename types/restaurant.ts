import type { Cents } from "./product";

/** 24h "HH:mm" string in the restaurant's time zone. "24:00" is allowed as a close time. */
export type ClockTime = string;

export interface ServiceWindow {
  open: ClockTime;
  /** If close <= open the window runs past midnight into the next day. */
  close: ClockTime;
}

export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type WeeklyHours = Record<Weekday, ServiceWindow[]>;

export interface HolidayException {
  /** Local calendar date, YYYY-MM-DD. */
  date: string;
  label: string;
  /** Empty array = closed all day. */
  windows: ServiceWindow[];
}

export interface TemporaryClosure {
  active: boolean;
  message: string;
  /** Optional ISO instant when the closure ends (shown to customers). */
  until?: string;
}

export interface DeliveryZone {
  id: string;
  name: string;
  postalCodes: string[];
  /** Overrides the global delivery fee for this zone. */
  fee?: Cents;
  minimumOrder?: Cents;
}

export type FulfillmentType = "pickup" | "delivery";

export type PaymentMethodId = "online" | "pay_at_pickup" | "pay_on_delivery";

export interface PaymentMethodConfig {
  id: PaymentMethodId;
  label: string;
  description: string;
  enabled: boolean;
  /** Which fulfillment types this method is offered for. */
  fulfillment: FulfillmentType[];
}

export interface RestaurantConfig {
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  logoText: { line1: string; line2: string };
  theme: {
    ivory: string;
    ink: string;
    tomato: string;
    mustard: string;
    stone: string;
    white: string;
  };
  currency: string;
  locale: string;
  timeZone: string;
  priceRange: string;
  address: {
    street: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
  };
  /** Only set if verified — used for structured data & map embed. */
  geo: { latitude: number; longitude: number } | null;
  phone: { display: string; e164: string };
  email: string;
  socialLinks: { label: string; href: string }[];
  location: {
    parking?: string;
    pickupInstructions: string;
    accessibility?: string;
    mapUrl: string;
  };
  hours: WeeklyHours;
  holidays: HolidayException[];
  temporaryClosure: TemporaryClosure;
  ordering: {
    pickupEnabled: boolean;
    deliveryEnabled: boolean;
    scheduledOrdersEnabled: boolean;
    /** Allow scheduling a future order while the restaurant is closed. */
    scheduleWhileClosed: boolean;
    /** How many days ahead customers can schedule (0 = today only). */
    scheduleDaysAhead: number;
    slotIntervalMinutes: number;
    /** Kitchen preparation estimate. */
    preparationMinutes: number;
    /** Additional estimate for delivery transit. */
    deliveryMinutes: number;
    /** Stop accepting orders this many minutes before a window closes. */
    cutoffMinutesBeforeClose: number;
    maxItemQuantity: number;
    maxLinesPerOrder: number;
  };
  delivery: {
    fee: Cents;
    minimumOrder: Cents;
    zones: DeliveryZone[];
  };
  fees: {
    /** Optional service fee in basis points of subtotal (100 = 1%). 0 disables. */
    serviceFeeBps: number;
    serviceFeeLabel: string;
  };
  tax: {
    /** Basis points: 875 = 8.75%. */
    rateBps: number;
    label: string;
    taxDeliveryFee: boolean;
    taxServiceFee: boolean;
  };
  payments: {
    methods: PaymentMethodConfig[];
    onlineProvider: "stripe" | "none";
  };
  reviews: {
    /** Demo reviews are always labelled as sample content. Set false to hide the section. */
    showDemoReviews: boolean;
  };
}
