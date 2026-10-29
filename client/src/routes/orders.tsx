import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { useAuth } from "@/lib/auth";
import { api, type ApiOrder, resolveImageUrl } from "@/lib/api";
import { fmt } from "@/lib/cart";
import { useToast } from "@/components/toast";
import { OrderCardSkeleton } from "@/components/skeleton";

const STEPS = [
  { key: "PENDING",    label: "Pending",    sub: "Order placed" },
  { key: "PROCESSING", label: "Processing", sub: "Being prepared" },
  { key: "SHIPPED",    label: "Shipped",    sub: "On the way" },
  { key: "DELIVERED",  label: "Delivered",  sub: "Arrived" },
];

function getStepIndex(status: string) {
  const idx = STEPS.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : 0;
}

function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function TrackingBar({ status, compact }: { status: string; compact?: boolean }) {
  const active = getStepIndex(status);
  const isCancelled = status === "CANCELLED";

  if (compact) {
    return (
      <div className="w-full max-w-[180px]">
        <div className="flex items-center gap-1">
          {STEPS.map((step, i) => (
            <div key={step.key} className="flex-1 flex flex-col items-center">
              <div
                className={`w-full h-1.5 rounded-full transition-all ${
                  isCancelled
                    ? "bg-red-200"
                    : i <= active
                    ? "bg-foreground"
                    : "bg-border"
                }`}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-muted-foreground">Placed</span>
          <span className="text-[9px] text-muted-foreground">Arrived</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {isCancelled && (
        <p className="text-xs text-destructive font-medium mb-4">This order has been cancelled.</p>
      )}

      <div className="relative">
        <div className="absolute top-[10px] left-0 right-0 h-[2px] bg-border" />
        <div
          className={`absolute top-[10px] left-0 h-[2px] transition-all duration-500 ${
            isCancelled ? "bg-red-400" : "bg-foreground"
          }`}
          style={{ width: `${(active / (STEPS.length - 1)) * 100}%` }}
        />

        <div className="relative flex justify-between">
          {STEPS.map((step, i) => {
            const reached = isCancelled ? i <= 0 : i <= active;
            return (
              <div key={step.key} className="flex flex-col items-center w-0 flex-1">
                <div
                  className={`w-[21px] h-[21px] rounded-full border-2 flex items-center justify-center transition-all z-10 ${
                    isCancelled && i > 0
                      ? "border-border bg-background"
                      : reached
                      ? "border-foreground bg-foreground"
                      : "border-border bg-background"
                  }`}
                >
                  {reached && !isCancelled && (
                    <svg
                      className="w-3 h-3 text-background"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={3}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                  )}
                  {isCancelled && i === 0 && (
                    <svg
                      className="w-3 h-3 text-red-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={3}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  )}
                </div>

                <p
                  className={`mt-2.5 text-[10px] uppercase tracking-widest font-medium text-center transition-colors ${
                    reached && !isCancelled
                      ? "text-foreground"
                      : isCancelled && i > 0
                      ? "text-muted-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </p>
                <p
                  className={`text-[9px] text-center mt-0.5 ${
                    reached && !isCancelled ? "text-foreground/70" : "text-muted-foreground/60"
                  }`}
                >
                  {step.sub}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function OrdersPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  // If redirected to production with env=local, bounce back to localhost
  useEffect(() => {
    if (typeof window !== "undefined") {
      const search = window.location.search;
      if (search.includes("env=local") && window.location.hostname !== "localhost") {
        window.location.href = `http://localhost:5173/orders${search}`;
      }
    }
  }, []);

  const fetchOrders = () => {
    setLoading(true);
    api
      .getOrders()
      .then(setOrders)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      navigate({ to: "/login" });
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const txRef = params.get("tx_ref");

    if (txRef) {
      api
        .verifyPayment(txRef)
        .then((res) => {
          if (res.verified) {
            toast("Payment confirmed! Your order is being processed.", "success");
          }
        })
        .catch(() => {})
        .finally(() => {
          fetchOrders();
          window.history.replaceState({}, "", "/orders");
        });
    } else {
      fetchOrders();
    }
  }, [authLoading, isAuthenticated, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="size-8 rounded-full border-2 border-foreground border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const toggle = (id: string) => setExpanded((prev) => (prev === id ? null : id));

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="px-4 md:px-8 py-12 md:py-16 animate-page-in">
        <div className="mx-auto max-w-3xl">
          <header className="mb-12">
            <p className="text-[10px] uppercase tracking-[0.25em] text-accent mb-3">Your account</p>
            <h1 className="font-display text-4xl md:text-6xl italic">Orders</h1>
          </header>

          {loading && (
            <div className="space-y-6">
              <OrderCardSkeleton />
              <OrderCardSkeleton />
              <OrderCardSkeleton />
            </div>
          )}

          {error && (
            <div className="py-24 text-center text-destructive text-sm">{error}</div>
          )}

          {!loading && !error && orders.length === 0 && (
            <div className="py-24 text-center">
              <h2 className="font-display text-3xl italic mb-4">No orders yet</h2>
              <p className="text-muted-foreground text-sm mb-8">Your order history will appear here.</p>
              <Link
                to="/"
                className="inline-flex px-7 py-3.5 bg-foreground text-background rounded-full text-xs uppercase tracking-widest"
              >
                Browse
              </Link>
            </div>
          )}

          {!loading && !error && orders.length > 0 && (
            <div className="space-y-6">
              {orders.map((order) => {
                const isOpen = expanded === order.id;
                return (
                  <div
                    key={order.id}
                    className="border border-border rounded-2xl overflow-hidden bg-background"
                  >
                    <button
                      onClick={() => toggle(order.id)}
                      className="w-full px-6 py-5 text-left hover:bg-stone-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-medium tabular-nums">
                            #{order.id.slice(0, 8)}
                          </span>
                          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                            {relativeTime(order.createdAt)}
                          </span>
                          {order.paymentStatus === "PAID" && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-medium bg-emerald-100 text-emerald-800">
                              Paid
                            </span>
                          )}
                          {order.paymentStatus === "PENDING_ON_DELIVERY" && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-medium bg-blue-100 text-blue-800">
                              Pay on Delivery
                            </span>
                          )}
                          {(!order.paymentStatus || order.paymentStatus === "UNPAID") && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-medium bg-amber-100 text-amber-800">
                              Unpaid
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-medium tabular-nums">{fmt(order.total)}</span>
                      </div>

                      <TrackingBar status={order.status} compact />

                      <div className="flex justify-end mt-2">
                        <svg
                          className={`size-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="border-t border-border px-6 py-5 space-y-6 bg-stone-50">
                        <TrackingBar status={order.status} />

                        <div className="grid sm:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Contact</p>
                            <p className="font-medium">{order.customerName || "—"}</p>
                            <p className="text-muted-foreground">{order.email || "—"}</p>
                            <p className="text-muted-foreground">{order.phone || "—"}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Delivery</p>
                            <p className="font-medium">{order.address || "—"}</p>
                            <p className="text-muted-foreground">
                              {[order.city, order.postalCode].filter(Boolean).join(", ") || "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Payment</p>
                            <p className="font-medium capitalize">{order.paymentMethod?.replace("-", " ") || "—"}</p>
                            <p className="text-xs text-muted-foreground">Status: {order.paymentStatus || "UNPAID"}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Shipping</p>
                            <p className="font-medium capitalize">{order.shipping}</p>
                          </div>
                        </div>

                        {/* Financial breakdown */}
                        {(order.subtotal || order.discount || order.vat) ? (
                          <div className="border-t border-border pt-4 text-xs space-y-1.5 text-muted-foreground">
                            {order.subtotal != null && (
                              <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span className="tabular-nums font-medium text-foreground">{fmt(order.subtotal)}</span>
                              </div>
                            )}
                            {order.discount ? (
                              <div className="flex justify-between text-emerald-700 font-medium">
                                <span>Discount {order.promoCode ? `(${order.promoCode})` : ""}</span>
                                <span className="tabular-nums">- {fmt(order.discount)}</span>
                              </div>
                            ) : null}
                            {order.vat != null && (
                              <div className="flex justify-between">
                                <span>VAT (15%)</span>
                                <span className="tabular-nums">{fmt(order.vat)}</span>
                              </div>
                            )}
                            {order.shippingFee != null && (
                              <div className="flex justify-between">
                                <span>Shipping</span>
                                <span className="tabular-nums">{order.shippingFee === 0 ? "Free" : fmt(order.shippingFee)}</span>
                              </div>
                            )}
                            <div className="flex justify-between pt-2 border-t border-border text-sm font-semibold text-foreground">
                              <span>Total Paid</span>
                              <span className="tabular-nums">{fmt(order.total)}</span>
                            </div>
                          </div>
                        ) : null}

                        {/* Items */}
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Items</p>
                          <div className="space-y-3">
                            {order.items.map((item) => (
                              <div key={item.id} className="flex gap-3">
                                <div className="relative size-14 rounded-lg overflow-hidden bg-stone-100 shrink-0">
                                  <img
                                    src={resolveImageUrl(item.product?.imageUrl)}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                  <span className="absolute -top-1 -right-1 size-5 rounded-full bg-foreground text-background text-[10px] grid place-items-center">
                                    {item.quantity}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="text-xs font-medium truncate">{item.product?.name || "Product"}</p>
                                  </div>
                                  <span className="text-xs tabular-nums">{fmt(item.price * item.quantity)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
