export type ApiProductVariant = {
  id: string;
  title: string;
  sku?: string | null;
  price: number;
  stock: number;
  isDefault: boolean;
};

export type ApiReview = {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  title: string | null;
  comment: string;
  skinType: string | null;
  verified: boolean;
  createdAt: string;
  user?: {
    id: string;
    name: string | null;
    image: string | null;
  };
};

export type ApiProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  imageUrl: string | null;
  category: string | null;
  gender: string | null;
  age: string | null;
  bodyPart: string | null;
  size: string | null;
  isNew: boolean | null;
  ingredients?: string | null;
  keyIngredients?: string | null;
  skinType?: string | null;
  routineStep?: string | null;
  pao?: string | null;
  benefits?: string | null;
  variants?: ApiProductVariant[];
  reviews?: ApiReview[];
  averageRating?: number;
  reviewCount?: number;
  ratingDistribution?: Record<number, number>;
  createdAt?: string;
};

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export function resolveImageUrl(url: string | null | undefined): string {
  if (!url) return "/placeholder.svg";
  if (url.startsWith("http")) return url;
  return url;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("cosmot-token");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (res.status === 401) {
    localStorage.removeItem("cosmot-token");
    localStorage.removeItem("cosmot-user");
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export type ProductFilters = {
  page?: number;
  limit?: number;
  category?: string;
  gender?: string;
  age?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
};

export const api = {
  // Auth
  register: (data: { email: string; password: string; name?: string }) =>
    request<{
      user: { id: string; email: string; name: string | null; role: string };
      accessToken: string;
      refreshToken: string;
    }>("/auth/register", { method: "POST", body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    request<{
      user: { id: string; email: string; name: string | null; role: string };
      accessToken: string;
      refreshToken: string;
    }>("/auth/login", { method: "POST", body: JSON.stringify(data) }),

  me: () =>
    request<{
      id: string;
      email: string;
      name: string | null;
      role: string;
      createdAt: string;
    }>("/user/me"),

  updateProfile: (data: { name?: string; email?: string; currentPassword?: string; newPassword?: string }) =>
    request<{
      id: string;
      email: string;
      name: string | null;
      role: string;
      createdAt: string;
    }>("/user/profile", { method: "PUT", body: JSON.stringify(data) }),

  // Products
  getProducts: (params?: ProductFilters) => {
    const q = new URLSearchParams();
    if (params?.page) q.set("page", String(params.page));
    if (params?.limit) q.set("limit", String(params.limit));
    if (params?.category && params.category !== "all") q.set("category", params.category);
    if (params?.gender && params.gender !== "all") q.set("gender", params.gender);
    if (params?.age && params.age !== "all") q.set("age", params.age);
    if (params?.search) q.set("search", params.search);
    if (params?.minPrice != null) q.set("minPrice", String(params.minPrice));
    if (params?.maxPrice != null) q.set("maxPrice", String(params.maxPrice));
    const qs = q.toString();
    return request<{
      products: ApiProduct[];
      total: number;
      page: number;
      totalPages: number;
    }>(`/products${qs ? `?${qs}` : ""}`);
  },

  getProduct: (id: string) =>
    request<ApiProduct>(`/products/${id}`),

  createReview: (productId: string, data: { rating: number; title?: string; comment: string; skinType?: string }) =>
    request<ApiReview>(`/products/${productId}/reviews`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Orders
  createOrder: (data: {
    address: string;
    city?: string;
    postalCode?: string;
    customerName?: string;
    email?: string;
    phone?: string;
    paymentMethod?: string;
    shipping?: string;
    promoCode?: string | null;
    items: { productId: string; quantity: number }[];
  }) =>
    request<{ order: ApiOrder; checkoutUrl?: string | null; txRef?: string; warning?: string }>("/orders", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  verifyPayment: (txRef: string) =>
    request<{ verified: boolean; order: ApiOrder; message?: string }>(`/orders/verify/${encodeURIComponent(txRef)}`),

  getOrders: () => request<ApiOrder[]>("/orders"),

  updateOrderStatus: (id: string, status: string) =>
    request<{ id: string; status: string }>(`/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  // Admin Stats
  getStats: () =>
    request<{
      totalOrders: number;
      totalProducts: number;
      totalUsers: number;
      totalRevenue: number;
      ordersByStatus: Record<string, number>;
      recentOrders: ApiOrder[];
    }>("/stats"),

  // Admin Products
  createProduct: (data: Partial<ApiProduct>) =>
    request<ApiProduct>("/products", { method: "POST", body: JSON.stringify(data) }),

  updateProduct: (id: string, data: Partial<ApiProduct>) =>
    request<ApiProduct>(`/products/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  deleteProduct: (id: string) =>
    request<void>(`/products/${id}`, { method: "DELETE" }),

  // Upload
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append("image", file);
    const token = localStorage.getItem("cosmot-token");
    return fetch(`${API_BASE}/upload`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then((res) => {
      if (!res.ok) throw new Error("Upload failed");
      return res.json() as Promise<{ url: string; filename: string }>;
    });
  },
};

export type ApiOrder = {
  id: string;
  status: string;
  paymentStatus?: string;
  total: number;
  subtotal?: number;
  discount?: number;
  vat?: number;
  shippingFee?: number;
  promoCode?: string | null;
  txRef?: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  customerName: string | null;
  email: string | null;
  phone: string | null;
  paymentMethod: string | null;
  shipping: string;
  createdAt: string;
  user?: { id: string; email: string; name: string | null } | null;
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    price: number;
    product: { name: string; imageUrl: string | null } | null;
  }>;
};
