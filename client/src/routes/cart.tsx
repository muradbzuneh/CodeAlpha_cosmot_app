import { Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { useCart, fmt } from "@/lib/cart";
import { useAuth } from "@/lib/auth";

export function CartPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { lines, subtotal, discount, vat, total, setQty, remove, promo, applyPromo, clearPromo } = useCart();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;

  const isEmpty = lines.length === 0;

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="px-4 md:px-8 py-12 md:py-16">
        <div className="mx-auto max-w-6xl">
          <header className="mb-12">
            <p className="text-[10px] uppercase tracking-[0.25em] text-accent mb-3">Step 1 of 2</p>
            <h1 className="font-display text-4xl md:text-6xl italic">Your Selection</h1>
            <p className="text-muted-foreground text-sm mt-3">
              {lines.length} {lines.length === 1 ? "item" : "items"} · subject to VAT 15%
            </p>
          </header>

          {isEmpty ? (
            <div className="border border-border rounded-3xl p-8 md:p-12 text-center max-w-xl mx-auto">
              <p className="font-display text-2xl italic mb-4">Your basket is empty.</p>
              <p className="text-sm text-muted-foreground mb-8">
                Begin the ritual — browse the latest formulations.
              </p>
              <Link
                to="/"
                className="inline-flex px-7 py-3.5 bg-foreground text-background rounded-full text-xs uppercase tracking-widest"
              >
                Explore
              </Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-[1fr_400px] gap-12">
              <div className="space-y-2">
                {lines.map((l) => (
                  <div
                    key={l.product.id}
                    className="grid grid-cols-[100px_1fr] md:grid-cols-[120px_1fr_auto] gap-4 md:gap-6 p-4 rounded-2xl hover:bg-stone-50 transition"
                  >
                    <div className="aspect-square rounded-xl overflow-hidden bg-stone-100">
                      <img
                        src={l.product.imageUrl || "/placeholder.svg"}
                        alt={l.product.name}
                        loading="lazy"
                        width={200}
                        height={200}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex flex-col justify-between">
                      <div>
                        <h3 className="font-medium text-sm md:text-base truncate">{l.product.name}</h3>
                        <p className="text-[10px] md:text-xs text-muted-foreground italic font-display">
                          {l.product.description}
                        </p>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
                          {fmt(l.product.price)} each
                        </p>
                      </div>
                      <div className="flex items-center gap-3 mt-3 md:hidden">
                        <QtyStepper qty={l.qty} onChange={(q) => setQty(l.product.id, q)} />
                        <button
                          onClick={() => remove(l.product.id)}
                          className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-destructive ml-auto"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <div className="hidden md:flex flex-col items-end justify-between">
                      <span className="text-sm tabular-nums font-medium">{fmt(l.lineTotal)}</span>
                      <QtyStepper qty={l.qty} onChange={(q) => setQty(l.product.id, q)} />
                      <button
                        onClick={() => remove(l.product.id)}
                        className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-destructive"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="md:hidden col-span-2 flex justify-between border-t border-border pt-2 text-sm">
                      <span className="text-muted-foreground">Line total</span>
                      <span className="tabular-nums font-medium">{fmt(l.lineTotal)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <aside className="lg:sticky lg:top-24 lg:self-start">
                <div className="bg-stone-50 rounded-3xl p-6 md:p-8 space-y-5">
                  <h2 className="font-display text-2xl italic">Order Summary</h2>

                  <div className="space-y-2 text-sm">
                    <Row label="Subtotal" value={fmt(subtotal)} />
                    {discount > 0 && (
                      <Row label={`Discount (${promo})`} value={`− ${fmt(discount)}`} accent />
                    )}
                    <Row label="VAT (15%)" value={fmt(vat)} muted />
                    <Row label="Shipping" value={subtotal >= 4500 ? "Free" : fmt(450)} muted />
                  </div>

                  <div className="border-t border-border pt-4 flex justify-between items-baseline">
                    <span className="font-display text-xl italic">Total</span>
                    <span className="text-xl font-medium tabular-nums">
                      {fmt(total + (subtotal >= 4500 ? 0 : 450))}
                    </span>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Promo code
                    </label>
                    {promo ? (
                      <div className="mt-2 flex items-center justify-between p-3 rounded-xl bg-background border border-border">
                        <span className="text-xs">
                          <span className="font-medium">{promo}</span> applied
                        </span>
                        <button
                          onClick={clearPromo}
                          className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-destructive"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (applyPromo(code)) {
                            setCode("");
                            setError(null);
                          } else {
                            setError("Invalid code. Try COSMOT10 or GLOW20.");
                          }
                        }}
                        className="mt-2 flex gap-2"
                      >
                        <input
                          value={code}
                          onChange={(e) => setCode(e.target.value)}
                          placeholder="COSMOT10"
                          className="flex-1 px-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:border-foreground"
                        />
                        <button className="px-4 py-3 rounded-xl bg-foreground text-background text-xs uppercase tracking-widest">
                          Apply
                        </button>
                      </form>
                    )}
                    {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
                  </div>

                  <Link
                    to="/checkout"
                    className="block w-full text-center bg-foreground text-background py-4 rounded-full text-xs font-medium uppercase tracking-[0.2em] hover:opacity-90 transition"
                  >
                    Proceed to Checkout
                  </Link>
                  <Link
                    to="/"
                    className="block w-full text-center text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
                  >
                    ← Continue shopping
                  </Link>
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Row({ label, value, muted, accent }: { label: string; value: string; muted?: boolean; accent?: boolean }) {
  return (
    <div className={`flex justify-between ${muted ? "text-muted-foreground" : ""} ${accent ? "text-accent" : ""}`}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

function QtyStepper({ qty, onChange }: { qty: number; onChange: (n: number) => void }) {
  return (
    <div className="inline-flex items-center border border-border rounded-full bg-background">
      <button
        aria-label="Decrease"
        onClick={() => onChange(qty - 1)}
        className="size-8 grid place-items-center text-lg hover:bg-stone-100 rounded-l-full"
      >
        −
      </button>
      <span className="w-8 text-center text-xs tabular-nums">{String(qty).padStart(2, "0")}</span>
      <button
        aria-label="Increase"
        onClick={() => onChange(qty + 1)}
        className="size-8 grid place-items-center text-lg hover:bg-stone-100 rounded-r-full"
      >
        +
      </button>
    </div>
  );
}
