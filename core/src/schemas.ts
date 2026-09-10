import { z } from "zod";

export const orderItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  qty: z.number().int().positive(),
  price: z.number().nonnegative(),
  image_url: z.string(),
});

export const orderCreateSchema = z.object({
  first_name: z.string().trim().min(1),
  last_name: z.string().trim().min(1),
  phone: z.string().trim().min(1),
  address: z.string().trim().min(1),
  items: z.array(orderItemSchema).min(1),
  total: z.number().nonnegative(),
});

export const reviewCreateSchema = z.object({
  product_id: z.string().min(1),
  user_name: z.string().trim().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().optional(),
  body: z.string().trim().min(1),
  image_url: z.string().optional(),
});

export const adminLoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export const productUpsertSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().min(1),
  price: z.number().nonnegative(),
  image_url: z.string().min(1),
  images: z.array(z.string()).nullable().optional(),
  category: z.string().trim().min(1),
  badge: z.string().nullable().optional(),
  tag: z.string().nullable().optional(),
});

export const categoryCreateSchema = z.object({
  name: z.string().trim().min(1),
});

export const orderStatusSchema = z.enum([
  "new",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
]);

export const orderStatusUpdateSchema = z.object({ status: orderStatusSchema });

export const reviewStatusUpdateSchema = z.object({
  status: z.enum(["pending", "approved"]),
});

export const pushRegisterSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(["ios", "android"]),
});

export type OrderCreateInput = z.infer<typeof orderCreateSchema>;
export type ReviewCreateInput = z.infer<typeof reviewCreateSchema>;
export type ProductUpsertInput = z.infer<typeof productUpsertSchema>;
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type PushRegisterInput = z.infer<typeof pushRegisterSchema>;