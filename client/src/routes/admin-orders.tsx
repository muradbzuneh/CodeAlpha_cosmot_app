import { useEffect, useState } from "react";
import { api, type ApiOrder } from "@/lib/api";
import { fmt } from "@/lib/cart";
import { useToast } from "@/components/toast";

const STATUSES = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"] as const;

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  PROCESSING: "bg-blue-100 text-blue-700",
  SHIPPED: "bg-violet-100 text-violet-700",
  DELIVERED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export function AdminOrdersPage() {
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const { toast } = useToast();

  const fetchOrders = () => {
    api.getOrders().then(setOrders).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdating(orderId);
    try {
      await api.updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (err: any) {
      toast(err.message || "Failed to update status", "error");
    } finally {
      setUpdating(null);
    }
  };

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  if (loading) {
    return <div className="py-24 text-center text-muted-foreground text-sm">Loading orders...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl italic">Orders</h1>
        <p className="text-sm text-muted-foreground mt-1">{orders.length} total orders</p>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar -mx-4 md:mx-0 px-4 md:px-0">
        <button
          onClick={() => setFilter("all")}
          className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs uppercase tracking-tight transition ${
            filter === "all"
              ? "bg-foreground text-background"
              : "border border-border hover:border-foreground"
          }`}
        >
          All ({orders.length})
        </button>
        {STATUSES.map((s) => {
          const count = orders.filter((o) => o.status === s).length;
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs uppercase tracking-tight transition ${
                filter === s
                  ? "bg-foreground text-background"
                  : "border border-border hover:border-foreground"
              }`}
            >
              {s} ({count})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground text-sm">No orders match this filter.</div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block border border-border rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-stone-50">
                  <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Order</th>
                  <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Customer</th>
                  <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Items</th>
                  <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Total</th>
                  <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Date</th>
                  <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr key={order.id} className="border-b border-border last:border-0 hover:bg-stone-50 transition">
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium tabular-nums">#{order.id.slice(0, 8)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium">{order.customerName || order.user?.name || "—"}</p>
                      <p className="text-[10px] text-muted-foreground">{order.email || order.user?.email || "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-xs">{order.items.length} item(s)</td>
                    <td className="px-4 py-3 text-xs font-medium tabular-nums">{fmt(order.total)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        disabled={updating === order.id}
                        className={`text-[10px] uppercase tracking-widest font-medium px-2 py-1 rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-foreground cursor-pointer disabled:opacity-50 ${STATUS_COLORS[order.status] ?? "bg-stone-100 text-stone-600"}`}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((order) => (
              <div key={order.id} className="border border-border rounded-2xl p-4 space-y-3 bg-background">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-medium tabular-nums">#{order.id.slice(0, 8)}</span>
                    <p className="text-[10px] text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className="text-sm font-medium tabular-nums">{fmt(order.total)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground truncate max-w-[60%]">
                    {order.customerName || order.user?.name || order.email || "—"}
                  </p>
                  <span className="text-[10px] text-muted-foreground">{order.items.length} item(s)</span>
                </div>
                <div className="flex items-center justify-between">
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    disabled={updating === order.id}
                    className={`text-[10px] uppercase tracking-widest font-medium px-2 py-1 rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-foreground cursor-pointer disabled:opacity-50 ${STATUS_COLORS[order.status] ?? "bg-stone-100 text-stone-600"}`}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
