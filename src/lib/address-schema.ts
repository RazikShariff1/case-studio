import { z } from "zod";
import { INDIAN_STATES, PHONE_RE, PIN_RE } from "./india";

/** A saved address, as the account page sends it. Same rules as checkout. */
export const addressSchema = z.object({
  label: z.string().trim().max(40).default(""),
  recipient: z.string().trim().min(2, "Enter the recipient name").max(80),
  phone: z.string().trim().regex(PHONE_RE, "Enter a valid 10-digit mobile number"),
  line1: z.string().trim().min(3, "Enter your address").max(120),
  line2: z.string().trim().max(120).default(""),
  city: z.string().trim().min(2, "Enter your city").max(60),
  state: z.enum(INDIAN_STATES, { error: "Select your state" }),
  postalCode: z.string().trim().regex(PIN_RE, "Enter a valid 6-digit PIN code"),
  country: z.literal("India").default("India"),
  isDefault: z.boolean().default(false),
});
