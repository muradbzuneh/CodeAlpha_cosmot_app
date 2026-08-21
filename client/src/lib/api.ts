const API_BASE = "/api";

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

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem("cosmot-token");
    localStorage.removeItem("cosmot-user");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

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
    }>("/auth/me"),

  // Products
  getProducts: () =>
    request<Array<{
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
      createdAt: string;
    }>>("/products"),

  // Orders
  createOrder: (data: { address: string; items: { productId: string; quantity: number }[] }) =>
    request<{
      id: string;
      total: number;
      status: string;
      items: Array<{ id: string; productId: string; quantity: number; price: number }>;
    }>("/orders", { method: "POST", body: JSON.stringify(data) }),

  getOrders: () =>
    request<Array<{
      id: string;
      status: string;
      total: number;
      address: string | null;
      createdAt: string;
      items: Array<{ id: string; productId: string; quantity: number; price: number }>;
    }>>("/orders"),
};
