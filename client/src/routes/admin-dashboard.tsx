import { useEffect, useState } from "react";
import { api, type ApiOrder } from "@/lib/api";
import { fmt } from "@/lib/cart";

type Stats = {
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
  totalRevenue: number;
  ordersByStatus: Record<string, number>;
  recentOrders: ApiOrder[];
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  PROCESSING: "bg-blue-100 text-blue-700",
  SHIPPED: "bg-violet-100 text-violet-700",
  DELIVERED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="py-24 text-center text-muted-foreground text-sm">Loading dashboard...</div>;
  }

  if (!stats) {
    return <div className="py-24 text-center text-destructive text-sm">Failed to load stats</div>;
  }

  const cards = [
    { label: "Total Revenue", value: fmt(stats.totalRevenue), sub: "Excluding cancelled" },
    { label: "Orders", value: stats.totalOrders, sub: `${stats.ordersByStatus.PENDING ?? 0} pending` },
    { label: "Products", value: stats.totalProducts, sub: "In catalogue" },
    { label: "Customers", value: stats.totalUsers, sub: "Registered" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl italic">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Overview of your store performance.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="p-5 rounded-2xl border border-border bg-background">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">{c.label}</p>
            <p className="text-2xl font-medium tabular-nums">{c.value}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Orders by Status */}
      <div className="p-5 rounded-2xl border border-border bg-background">
        <h2 className="font-display text-xl italic mb-4">Orders by Status</h2>
        <div className="grid grid-cols-5 gap-3">
          {["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].map((s) => (
            <div key={s} className="text-center p-3 rounded-xl bg-stone-50">
              <p className={`text-lg font-medium tabular-nums ${STATUS_COLORS[s]?.split(" ")[1] ?? ""}`}>
                {stats.ordersByStatus[s] ?? 0}
              </p>
              <p className="text-[9px] uppercase tracking-widest text-muted-foreground mt-1">{s}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="p-5 rounded-2xl border border-border bg-background">
        <h2 className="font-display text-xl italic mb-4">Recent Orders</h2>
        {stats.recentOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No orders yet.</p>
        ) : (
          <div className="space-y-3">
            {stats.recentOrders.map((o) => (
              <div key={o.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-stone-50 transition">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">
                    {o.customerName || o.user?.name || o.user?.email || "Unknown"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    #{o.id.slice(0, 8)} · {new Date(o.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className={`text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[o.status] ?? "bg-stone-100 text-stone-600"}`}>
                  {o.status}
                </span>
                <span className="text-sm font-medium tabular-nums">{fmt(o.total)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
