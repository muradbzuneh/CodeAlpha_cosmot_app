import { Link, useLocation, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" },
  { to: "/admin/orders", label: "Orders", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  { to: "/admin/products", label: "Products", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
];

export function AdminLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "ADMIN") {
      navigate({ to: "/login" });
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  if (!isAuthenticated || user?.role !== "ADMIN") return null;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-56 border-r border-border bg-stone-50 flex flex-col shrink-0 transition-transform duration-200 md:static md:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="px-5 h-14 flex items-center border-b border-border">
          <Link to="/" className="font-display text-xl tracking-tight italic">Cosmot.</Link>
          <span className="ml-2 text-[9px] uppercase tracking-widest text-muted-foreground bg-foreground text-background px-1.5 py-0.5 rounded">Admin</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((item) => {
            const active = item.to === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition ${
                  active
                    ? "bg-foreground text-background font-medium"
                    : "text-muted-foreground hover:bg-stone-100 hover:text-foreground"
                }`}
              >
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border">
          <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-muted-foreground truncate">
            {user?.email}
          </div>
          <button
            onClick={logout}
            className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition rounded-xl hover:bg-stone-100"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {/* Mobile top bar */}
        <div className="sticky top-0 z-30 flex items-center gap-3 h-14 px-4 border-b border-border bg-background/80 backdrop-blur-md md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            className="p-2 -ml-2"
          >
            <div className="w-5 h-px bg-foreground mb-1.5" />
            <div className="w-3 h-px bg-foreground" />
          </button>
          <Link to="/" className="font-display text-lg tracking-tight italic">Cosmot.</Link>
          <span className="text-[9px] uppercase tracking-widest text-muted-foreground bg-foreground text-background px-1.5 py-0.5 rounded">Admin</span>
        </div>
        <div className="p-4 md:p-8 max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
