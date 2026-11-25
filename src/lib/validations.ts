import { z } from "zod";

// ─── Sanitize HTML to prevent XSS ───
export function sanitize(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

// ─── Login Schema ───
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

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
});

export const menuItemUpdateSchema = menuItemSchema.partial().extend({
  isAvailable: z.boolean().optional(),
});

// ─── Category Schema ───
export const categorySchema = z.object({
  name: z
    .string()
    .min(1, "Category name is required")
    .max(60, "Category name too long")
    .transform(sanitize),
  sortOrder: z.number().int().default(0),
});

// ─── Toggle Schema ───
export const toggleSchema = z.object({
  isStruckOut: z.boolean(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type MenuItemInput = z.infer<typeof menuItemSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
