export type Role = "comprador" | "productor" | "eco";

export type Producer = {
  id: number;
  slug: string;
  name: string;
  kind: string;
  municipality: string;
  region: string;
  rating: number;
  review_count: number;
  verified: number;
  tagline: string;
  about: string;
  avatar: string;
  cover: string;
  phone: string;
  whatsapp: string;
  hours: string;
  delivery: string;
  badge: string;
  category: string;
};

export type Product = {
  id: number;
  slug: string;
  producer_id: number;
  name: string;
  short: string;
  description: string;
  price: number;
  unit: string;
  image: string;
  stock: number;
  stock_label: string;
  category: string;
  tags: string;
  status: string;
  featured: number;
  badge: string;
  rating: number;
  review_count: number;
};

export type CartLine = {
  id: number;
  qty: number;
  note: string;
  product: Product;
  producer: Pick<Producer, "id" | "name" | "slug" | "municipality" | "avatar" | "phone" | "whatsapp">;
};

export type User = {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: Role;
  producer_id: number | null;
};

export type Thread = {
  id: number;
  producer_id: number;
  buyer_name: string;
  subject: string;
  updated_at: string;
  unread: number;
  producer_name: string;
  producer_avatar: string;
  producer_municipality: string;
  producer_kind: string;
  last_body: string;
};

export type Message = {
  id: number;
  thread_id: number;
  sender: "buyer" | "producer";
  body: string;
  created_at: string;
  product_id: number | null;
  product_name?: string | null;
  product_price?: number | null;
  product_image?: string | null;
};

export type OrderRow = {
  id: number;
  code: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  delivery_method: string;
  delivery_cost: number;
  payment_method: string;
  subtotal: number;
  total: number;
  status: string;
  note: string;
  created_at: string;
};
