import type { FulfillmentType } from "@/types/restaurant";
import type { OrderStatus } from "@/types/order";

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ["received", "cancelled"],
  received: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["ready_for_pickup", "out_for_delivery", "cancelled"],
  ready_for_pickup: ["completed"],
  out_for_delivery: ["completed"],
  completed: [],
  cancelled: [],
};

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: "Pending payment",
  received: "Received",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready_for_pickup: "Ready for pickup",
  out_for_delivery: "Out for delivery",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function canTransition(from: OrderStatus, to: OrderStatus, fulfillment: FulfillmentType): boolean {
  if (!TRANSITIONS[from].includes(to)) return false;
  if (to === "ready_for_pickup" && fulfillment !== "pickup") return false;
  if (to === "out_for_delivery" && fulfillment !== "delivery") return false;
  return true;
}

export class InvalidTransitionError extends Error {
  constructor(from: OrderStatus, to: OrderStatus) {
    super(`Cannot move order from ${from} to ${to}`);
  }
}
