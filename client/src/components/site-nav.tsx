import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";

const links = [
  { to: "/", label: "Home" },
  { to: "/#new", label: "New" },
  { to: "/#categories", label: "Categories" },
  { to: "/#ritual", label: "Ritual" },
];

export function SiteNav() {
  const { count } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="mx-auto max-w-6xl px-4 h-14 grid grid-cols-[auto_1fr_auto] items-center gap-4">
          <button
            aria-label="Menu"
            className="p-2 -ml-2 md:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            <div className="w-5 h-px bg-foreground mb-1.5" />
            <div className={`h-px bg-foreground transition-all ${open ? "w-5" : "w-3"}`} />
          </button>

          <div className="hidden md:flex items-center gap-8 text-xs uppercase tracking-widest">
            <Link to="/" className="hover:text-accent transition-colors">Shop</Link>
            <a href="/#new" className="hover:text-accent transition-colors">New</a>
            <a href="/#categories" className="hover:text-accent transition-colors">Categories</a>
            <a href="/#ritual" className="hover:text-accent transition-colors">Ritual</a>
          </div>

          <Link
            to="/"
            className="font-display text-2xl tracking-tight italic select-none text-center justify-self-center"
          >
            Cosmot.
          </Link>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link
                  to="/cart"
                  aria-label="Cart"
                  className="relative size-9 grid place-items-center rounded-full border border-foreground text-[11px] font-medium tabular-nums hover:bg-foreground hover:text-background transition-colors"
                >
                  {String(count).padStart(2, "0")}
                </Link>
                <div className="hidden md:flex items-center gap-3">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground max-w-[120px] truncate">
                    {user?.name || user?.email}
                  </span>
                  <button
                    onClick={logout}
                    className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="hidden md:flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-full bg-foreground text-background text-[10px] uppercase tracking-widest font-medium hover:opacity-90 transition"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>

        {open && (
          <div className="md:hidden border-t border-border bg-background animate-fade-up">
            <div className="px-4 py-6 flex flex-col gap-4 text-sm uppercase tracking-widest">
              {links.map((l) => (
                <a
                  key={l.to}
                  href={l.to}
                  onClick={() => setOpen(false)}
                  className="py-1"
                >
                  {l.label}
                </a>
              ))}
              <div className="border-t border-border pt-4 mt-2">
                {isAuthenticated ? (
                  <>
                    <Link to="/cart" onClick={() => setOpen(false)} className="py-1 block">
                      Cart ({count})
                    </Link>
                    <p className="py-1 text-muted-foreground text-xs">{user?.name || user?.email}</p>
                    <button
                      onClick={() => { logout(); setOpen(false); }}
                      className="py-1 text-muted-foreground hover:text-foreground"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setOpen(false)} className="py-1 block">Sign in</Link>
                    <Link to="/register" onClick={() => setOpen(false)} className="py-1 block">Sign up</Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
