export type Lang = "en" | "fr" | "ar";

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  image_url: string;
  images: string | null;
  category: string;
  badge: string | null;
  tag: string | null;
  created_at: string;
};

export type Category = { id: string; name: string; slug: string };

export type OrderItem = {
  id: string;
  name: string;
  qty: number;
  price: number;
  image_url: string;
};

export type OrderStatus =
  | "new"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type Order = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
  items: string;
  total: number;
  status: OrderStatus;
  created_at: string;
};

export type Review = {
  id: string;
  product_id: string;
  user_id: string | null;
  user_name: string;
  rating: number;
  title: string | null;
  body: string;
  image_url: string | null;
  status: "pending" | "approved";
  created_at: string;
};

export type Section = {
  id: string;
  type: string;
  name: string;
  size: string;
  align: string;
  image_url: string | null;
  title: string | null;
  subtitle: string | null;
  button_text: string | null;
  button_link: string | null;
  grid_items: string | null;
  columns: number | null;
  product_ids: string | null;
  created_at: string;
};