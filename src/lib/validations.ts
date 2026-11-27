import { z } from "zod";

// ─── Sanitize HTML to prevent XSS ───
export function sanitize(input: string): string {
  if (!input) return "";
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/javascript:/gi, "")
    .trim();
}

// ─── Rate Limiter Helper (In-memory token bucket) ───
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, limit: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count += 1;
  return true;
}

// ─── Login Schema ───
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
}).strict();

// ─── Menu Item Schema ───
export const menuItemSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name too long")
    .transform(sanitize),
  description: z
    .string()
    .max(500, "Description too long")
    .default("")
    .transform(sanitize),
  price: z.number().positive("Price must be positive").max(99999),
  imageUrl: z
    .string()
    .url("Invalid URL")
    .optional()
    .nullable()
    .or(z.literal("")),
  dietaryType: z.enum(["veg", "nonveg", "vegan", "egg"]).default("veg"),
  spiceLevel: z.number().int().min(1).max(5).default(1),
  isChefSpecial: z.boolean().default(false),
  isBestseller: z.boolean().default(false),
  isStruckOut: z.boolean().default(false),
  availabilitySlot: z
    .enum(["morning_only", "lunch_dinner", "all_day"])
    .default("all_day"),
  categoryId: z.string().min(1, "Category is required"),
  sortOrder: z.number().int().default(0),
  station: z.enum(["tandoor", "curry", "drinks", "desserts"]).optional(),
}).strict();

export const menuItemUpdateSchema = menuItemSchema.partial().extend({
  isAvailable: z.boolean().optional(),
}).strict();

// ─── Category Schema ───
export const categorySchema = z.object({
  name: z
    .string()
    .min(1, "Category name is required")
    .max(60, "Category name too long")
    .transform(sanitize),
  sortOrder: z.number().int().default(0),
}).strict();

// ─── Toggle Schema ───
export const toggleSchema = z.object({
  isStruckOut: z.boolean(),
}).strict();

// ─── Order Placement Schema ───
export const orderPlacementSchema = z.object({
  tableNumber: z.string().min(1).max(10).transform(sanitize),
  sessionToken: z.string().min(5),
  totalAmount: z.number().positive(),
  items: z.array(
    z.object({
      menuItemId: z.string().min(1),
      name: z.string().transform(sanitize),
      price: z.number().positive(),
      quantity: z.number().int().min(1).max(20),
      customization: z.object({
        spiceLevel: z.enum(["mild", "medium", "spicy"]).default("medium"),
        portionSize: z.enum(["half", "full"]).default("full"),
        selectedDeal: z
          .object({
            name: z.string().transform(sanitize),
            price: z.number().min(0),
          })
          .nullable()
          .optional(),
      }),
    })
  ).min(1, "At least 1 dish required"),
}).strict();

// ─── Payment Schema ───
export const paymentSchema = z.object({
  orderId: z.string().min(1),
  tableNumber: z.string().min(1),
  splitWays: z.number().int().min(1).max(10),
  tipAmount: z.number().min(0),
  totalPaid: z.number().positive(),
  method: z.enum(["upi", "card", "cash", "bank_transfer"]),
}).strict();

// ─── Customer Review Schema ───
export const reviewSchema = z.object({
  orderId: z.string().min(1),
  tableNumber: z.string().min(1),
  rating: z.number().min(1).max(5),
  feedback: z.string().max(500).optional().transform((f) => (f ? sanitize(f) : "")),
}).strict();

// ─── Table OTP Verification Schema ───
export const tableOtpVerificationSchema = z.object({
  tableNumber: z.string().min(1).max(10).transform(sanitize),
  otp: z.string().regex(/^\d{4}$/, "Must be a 4-digit code"),
}).strict();

export type LoginInput = z.infer<typeof loginSchema>;
export type MenuItemInput = z.infer<typeof menuItemSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type OrderPlacementInput = z.infer<typeof orderPlacementSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
