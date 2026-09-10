import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Category,
  Order,
  Product,
  Review,
  Section,
  Settings,
} from "@petpals/core";
import { adminFetch, apiFetch } from "./api";

export function useProducts(params?: { category?: string; q?: string; ids?: string[]; limit?: number }) {
  const search = new URLSearchParams();
  if (params?.category) search.set("category", params.category);
  if (params?.q) search.set("q", params.q);
  if (params?.ids?.length) search.set("ids", params.ids.join(","));
  if (params?.limit) search.set("limit", String(params.limit));
  const qs = search.toString();
  return useQuery({
    queryKey: ["products", params],
    queryFn: () => apiFetch<Product[]>(`/products${qs ? `?${qs}` : ""}`),
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: () =>
      apiFetch<{ product: Product; related: Product[]; reviews: Review[] }>(
        `/products/${encodeURIComponent(slug)}`,
      ),
    enabled: slug.length > 0,
  });
}

export function useCategories() {
  return useQuery({ queryKey: ["categories"], queryFn: () => apiFetch<Category[]>("/categories") });
}

export function useSettings() {
  return useQuery({ queryKey: ["settings"], queryFn: () => apiFetch<Partial<Settings>>("/settings") });
}

export function useSections() {
  return useQuery({ queryKey: ["sections"], queryFn: () => apiFetch<Section[]>("/sections") });
}

export function useReviews(productId?: string, limit?: number) {
  const search = new URLSearchParams();
  if (productId) search.set("product_id", productId);
  if (limit) search.set("limit", String(limit));
  const qs = search.toString();
  return useQuery({
    queryKey: ["reviews", productId, limit],
    queryFn: () => apiFetch<Review[]>(`/reviews${qs ? `?${qs}` : ""}`),
  });
}

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      product_id: string;
      user_name: string;
      rating: number;
      title?: string;
      body: string;
    }) => apiFetch<{ id: string }>("/reviews", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reviews"] }),
  });
}

export function useTrackOrders(phone: string) {
  return useQuery({
    queryKey: ["track", phone],
    queryFn: () => apiFetch<Order[]>(`/orders/track?phone=${encodeURIComponent(phone)}`),
    enabled: phone.length >= 4,
  });
}

export function useCreateOrder() {
  return useMutation({
    mutationFn: (input: {
      first_name: string;
      last_name: string;
      phone: string;
      address: string;
      items: { id: string; name: string; qty: number; price: number; image_url: string }[];
      total: number;
    }) => apiFetch<{ id: string }>("/orders", { method: "POST", body: JSON.stringify(input) }),
  });
}

export function useAdminOrders(status?: string) {
  return useQuery({
    queryKey: ["admin", "orders", status],
    queryFn: () => adminFetch<Order[]>(`/admin/orders${status ? `?status=${status}` : ""}`),
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminFetch(`/admin/orders/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "orders"] }),
  });
}

export function useDeleteOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminFetch(`/admin/orders/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "orders"] }),
  });
}

export function useAdminProducts() {
  return useQuery({
    queryKey: ["admin", "products"],
    queryFn: () => adminFetch<Product[]>("/admin/products"),
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Record<string, unknown>) =>
      adminFetch<{ id: string }>("/admin/products", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "products"] }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Record<string, unknown> }) =>
      adminFetch(`/admin/products/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "products"] }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminFetch(`/admin/products/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "products"] }),
  });
}

export function useAdminCategories() {
  return useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => adminFetch<Category[]>("/admin/categories"),
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      adminFetch<{ id: string }>("/admin/categories", { method: "POST", body: JSON.stringify({ name }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "categories"] }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminFetch(`/admin/categories/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "categories"] }),
  });
}

export function useAdminReviews() {
  return useQuery({
    queryKey: ["admin", "reviews"],
    queryFn: () => adminFetch<(Review & { product_name?: string })[]>("/admin/reviews"),
  });
}

export function useUpdateReviewStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "pending" | "approved" }) =>
      adminFetch(`/admin/reviews/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "reviews"] }),
  });
}

export function useDeleteReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminFetch(`/admin/reviews/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "reviews"] }),
  });
}
