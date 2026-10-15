import type { Cents, ModifierSelection } from "./product";
import type { FulfillmentType, PaymentMethodId } from "./restaurant";

export const ORDER_STATUSES = [
  "pending_payment",
  "received",
  "confirmed",
  "preparing",
  "ready_for_pickup",
  "out_for_delivery",
  "completed",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type PaymentStatus = "unpaid" | "pending" | "paid" | "failed" | "refunded" | "not_required";

export interface CartLineInput {
  productId: string;
  quantity: number;
  selections: ModifierSelection;
  note?: string;
}

export interface PricedModifier {
  groupId: string;
  groupName: string;
  optionId: string;
  name: string;
  priceDelta: Cents;
}

export interface PricedLine {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: Cents;
  lineTotal: Cents;
  modifiers: PricedModifier[];
  note?: string;
}

export interface OrderTotals {
  subtotal: Cents;
  serviceFee: Cents;
  deliveryFee: Cents;
  discount: Cents;
  tax: Cents;
  total: Cents;
}

export interface DeliveryAddress {
  street: string;
  unit?: string;
  city: string;
  postalCode: string;
  instructions?: string;
}

export interface Order {
  /** Unguessable public identifier (UUID v4). */
  id: string;
  /** Short human-friendly reference e.g. SH-4F7K2. Not an access token. */
  number: string;
  idempotencyKey: string;
  /** Hash of the submitted payload; a reused idempotency key with a different payload is rejected. */
  fingerprint: string;
  createdAt: string;
  updatedAt: string;
  customer: { name: string; phone: string; email?: string };
  fulfillment: {
    type: FulfillmentType;
    /** "asap" or ISO instant */
    requestedTime: "asap" | string;
    estimatedReadyAt: string;
    address?: DeliveryAddress;
    zoneId?: string;
  };
  notes?: string;
  lines: PricedLine[];
  totals: OrderTotals;
  currency: string;
  payment: {
    method: PaymentMethodId;
    status: PaymentStatus;
    /** "demo" = development mode, no money was taken. "none" = pay in person. */
    provider: "stripe" | "demo" | "none";
    providerReference?: string;
  };
  status: OrderStatus;
  statusHistory: { status: OrderStatus; at: string }[];
  /** True when the order was only stored by the development file store. */
  demo: boolean;
}
