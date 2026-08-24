import { Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { api, type ApiProduct } from "@/lib/api";
import { fmt } from "@/lib/cart";

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
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ApiProduct[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [cartBounce, setCartBounce] = useState(false);
  const prevCount = useRef(count);

  useEffect(() => {
    if (count > prevCount.current) {
      setCartBounce(true);
      setTimeout(() => setCartBounce(false), 500);
    }
    prevCount.current = count;
  }, [count]);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) {
      setSearchQuery("");
      setSearchResults([]);
    }
  }, [searchOpen]);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await api.getProducts({ search: searchQuery.trim(), limit: 20 });
        setSearchResults(res.products);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [searchQuery]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSearchOpen(false);
    };
    if (searchOpen) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [searchOpen]);

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
            className="font-display text-2xl tracking-tight italic select-none text-center justify-self-center flex items-center gap-2"
          >
            <img src="/cosmot-logo-1.png" alt="Cosmot" className="size-10 grid place-items-center rounded-full 
              border border-stone-700 hover:text-stone-900 transition-colors" />
            Cosmot.
          </Link>

          <div className="flex items-center gap-3">
            <button
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
              className="size-9 grid place-items-center rounded-full border border-foreground hover:bg-foreground hover:text-background transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </button>

            {isAuthenticated ? (
              <>
                {user?.role === "ADMIN" && (
                  <Link
                    to="/admin"
                    className="hidden md:inline-flex text-[10px] uppercase tracking-widest text-accent font-medium hover:text-foreground transition-colors"
                  >
                    Admin
                  </Link>
                )}
                <Link
                  to="/cart"
                  aria-label="Cart"
                  className={`relative size-9 grid place-items-center rounded-full border border-foreground text-[11px] font-medium tabular-nums hover:bg-foreground hover:text-background transition-colors ${cartBounce ? "animate-cart-bounce" : ""}`}
                >
                  {String(count).padStart(2, "0")}
                </Link>

                <div className="hidden md:flex items-center gap-3">
                  <Link
  to="/profile"
  className="group flex items-center gap-2.5 rounded-full px-2 py-1.5 transition-colors hover:bg-muted/60"
>
  {/* Profile avatar */}
  <span
    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full
    bg-black text-sm font-semibold uppercase text-white
    ring-2 ring-emerald-600/10 transition-all
    group-hover:ring-emerald-600/30"
  >
    {(user?.name?.[0] || user?.email?.[0] || "U").toUpperCase()}
  </span>
</Link>
                 

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
                    {user?.role === "ADMIN" && (
                      <Link to="/admin" onClick={() => setOpen(false)} className="py-1 block">
                        Admin Dashboard
                      </Link>
                    )}
                    <Link to="/orders" onClick={() => setOpen(false)} className="py-1 block">
                      My Orders
                    </Link>
                    <Link to="/profile" onClick={() => setOpen(false)} className="py-1 block">
                      Profile
                    </Link>
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

      {searchOpen && (
        <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm animate-fade-up">
          <div className="mx-auto max-w-3xl px-4 pt-6">
            <div className="flex items-center gap-4 mb-8">
              <svg className="w-5 h-5 text-muted-foreground shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="flex-1 bg-transparent text-lg md:text-2xl font-display italic placeholder:text-muted-foreground focus:outline-none"
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="size-9 grid place-items-center rounded-full border border-border hover:border-foreground transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {searchLoading && (
              <p className="text-center text-muted-foreground text-sm py-12">Searching...</p>
            )}

            {!searchLoading && searchQuery.trim() && searchResults.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-12">No products found for &quot;{searchQuery}&quot;</p>
            )}

            {!searchLoading && searchResults.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[70vh] overflow-y-auto pb-8">
                {searchResults.map((p) => (
                  <Link
                    key={p.id}
                    to="/products/$productId"
                    params={{ productId: p.id }}
                    onClick={() => setSearchOpen(false)}
                    className="group"
                  >
                    <div className="relative w-full aspect-[4/5] bg-stone-100 rounded-2xl overflow-hidden mb-3">
                      <img
                        src={p.imageUrl || "/placeholder.svg"}
                        alt={p.name}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                      {p.isNew && (
                        <span className="absolute top-2 left-2 bg-background/90 backdrop-blur px-2 py-0.5 rounded-full text-[9px] uppercase tracking-widest">
                          New
                        </span>
                      )}
                    </div>
                    <h3 className="text-xs font-medium uppercase tracking-tight">{p.name}</h3>
                    <p className="text-sm tabular-nums font-medium mt-1">{fmt(p.price)}</p>
                  </Link>
                ))}
              </div>
            )}

            {!searchQuery.trim() && (
              <div className="py-12 text-center">
                <p className="text-muted-foreground text-sm">Type to search across all products</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
