import { z } from "zod";
import { restaurant } from "@/config/restaurant";

const o = restaurant.ordering;

export const phoneSchema = z
  .string()
  .trim()
  .min(1, "Enter a phone number")
  .refine((v) => /^[+()\-.\s\d]{7,22}$/.test(v) && v.replace(/\D/g, "").length >= 7 && v.replace(/\D/g, "").length <= 15, {
    message: "Enter a valid phone number",
  });

export const customerSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80, "Name is too long"),
  phone: phoneSchema,
  email: z.union([z.literal(""), z.string().trim().email("Enter a valid email")]).optional(),
});

export const addressSchema = z.object({
  street: z.string().trim().min(3, "Enter a street address").max(120),
  unit: z.string().trim().max(40).optional(),
  city: z.string().trim().min(2, "Enter a city").max(80),
  postalCode: z
    .string()
    .trim()
    .min(3, "Enter a postal code")
    .max(10)
    .regex(/^[A-Za-z0-9\- ]+$/, "Enter a valid postal code"),
  instructions: z.string().trim().max(240).optional(),
});

export const cartLineSchema = z.object({
  productId: z.string().min(1).max(64),
  quantity: z.number().int().min(1).max(o.maxItemQuantity),
  selections: z.record(z.string().max(64), z.array(z.string().max(64)).max(20)),
  note: z.string().max(140).optional(),
});

export const requestedTimeSchema = z.union([z.literal("asap"), z.string().datetime({ offset: true })]);

export const checkoutSchema = z
  .object({
    idempotencyKey: z.string().uuid("Missing submission key"),
    fulfillment: z.enum(["pickup", "delivery"]),
    requestedTime: requestedTimeSchema,
    customer: customerSchema,
    address: addressSchema.optional(),
    notes: z.string().trim().max(500).optional(),
    paymentMethod: z.enum(["online", "pay_at_pickup", "pay_on_delivery"]),
    items: z.array(cartLineSchema).min(1, "Your cart is empty").max(o.maxLinesPerOrder),
    acceptTerms: z.literal(true, { message: "Please accept the terms to continue" }),
  })
  .superRefine((v, ctx) => {
    if (v.fulfillment === "delivery" && !v.address) {
      ctx.addIssue({ code: "custom", path: ["address"], message: "A delivery address is required" });
    }
  });

export type CheckoutInput = z.infer<typeof checkoutSchema>;

/** Shape used by the client form (before cart items / keys are attached). */
export const checkoutFormSchema = z
  .object({
    fulfillment: z.enum(["pickup", "delivery"]),
    requestedTime: z.string().min(1, "Choose a time"),
    name: customerSchema.shape.name,
    phone: phoneSchema,
    email: z.union([z.literal(""), z.string().trim().email("Enter a valid email")]),
    street: z.string(),
    unit: z.string(),
    city: z.string(),
    postalCode: z.string(),
    instructions: z.string().max(240, "Keep instructions under 240 characters"),
    notes: z.string().max(500, "Keep notes under 500 characters"),
    paymentMethod: z.enum(["online", "pay_at_pickup", "pay_on_delivery"]),
    acceptTerms: z.boolean().refine((v) => v, "Please accept the terms to continue"),
  })
  .superRefine((v, ctx) => {
    if (v.fulfillment !== "delivery") return;
    const r = addressSchema.safeParse({ street: v.street, unit: v.unit, city: v.city, postalCode: v.postalCode, instructions: v.instructions });
    if (!r.success) {
      for (const issue of r.error.issues) ctx.addIssue({ code: "custom", path: issue.path, message: issue.message });
    }
  });

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;
