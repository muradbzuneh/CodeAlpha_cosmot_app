import { Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, type ReactNode } from "react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { useCart, fmt } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/toast";
import { api, resolveImageUrl } from "@/lib/api";

type Payment = "telebirr" | "bank" | "card" | "cod";

export function CheckoutPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { lines, subtotal, discount, vat, total, promo, clear, clearPromo } = useCart();
  const [payment, setPayment] = useState<Payment>("telebirr");
  const [shippingType, setShippingType] = useState<"standard" | "express">("standard");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderResult, setOrderResult] = useState<{ id: string; total: number } | null>(null);
  const { toast } = useToast();

  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;

  const freeShipping = subtotal >= 4500;
  const shipping = shippingType === "express" ? 850 : (freeShipping ? 0 : 450);
  const grand = total + shipping;

  if (orderResult) {
    return (
      <div className="min-h-screen bg-background">
        <SiteNav />
        <main className="px-4 md:px-8 py-16 md:py-24">
          <div className="mx-auto max-w-lg text-center">
            <div className="mb-6 text-5xl">✓</div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-accent mb-3">Order confirmed</p>
            <h1 className="font-display text-4xl md:text-5xl italic mb-4">Thank you</h1>
            <p className="text-muted-foreground text-sm mb-2">
              Your order <span className="font-medium text-foreground">{orderResult.id.slice(0, 8)}...</span> has been placed.
            </p>
            <p className="text-muted-foreground text-sm mb-8">
              Total: <span className="font-medium text-foreground">{fmt(orderResult.total)}</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/orders"
                className="inline-flex px-7 py-3.5 bg-foreground text-background rounded-full text-xs uppercase tracking-widest"
              >
                Track order
              </Link>
              <Link
                to="/"
                className="inline-flex px-7 py-3.5 border border-foreground rounded-full text-xs uppercase tracking-widest hover:bg-stone-50 transition"
              >
                Continue shopping
              </Link>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <SiteNav />
        <main className="px-4 py-24 text-center max-w-md mx-auto">
          <h1 className="font-display text-3xl italic mb-4">Nothing to checkout.</h1>
          <p className="text-muted-foreground text-sm mb-8">
            Add something to your selection first.
          </p>
          <Link
            to="/"
            className="inline-flex px-7 py-3.5 bg-foreground text-background rounded-full text-xs uppercase tracking-widest"
          >
            Browse
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const order = await api.createOrder({
        address,
        city: city || undefined,
        postalCode: postalCode || undefined,
        customerName: customerName || undefined,
        email: email || undefined,
        phone: phone || undefined,
        paymentMethod: payment,
        shipping: shippingType,
        items: lines.map((l) => ({
          productId: l.product.id,
          quantity: l.qty,
        })),
      });
      clear();
      clearPromo();
      setOrderResult({ id: order.id, total: order.total });
      toast("Order placed successfully!", "success");
    } catch (err: any) {
      setError(err.message || "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="px-4 md:px-8 py-12 md:py-16 animate-page-in">
        <div className="mx-auto max-w-6xl">
          <header className="mb-12">
            <p className="text-[10px] uppercase tracking-[0.25em] text-accent mb-3">Step 2 of 2</p>
            <h1 className="font-display text-4xl md:text-6xl italic">Checkout</h1>
          </header>

          <form onSubmit={handleSubmit} className="grid lg:grid-cols-[1fr_420px] gap-12">
            <div className="space-y-10">
              <Section title="Contact">
                <div className="grid sm:grid-cols-2 gap-3">
                  <Input label="Full name" required placeholder="Selam Tadesse" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                  <Input label="Email" type="email" required placeholder="you@cosmot.et" value={email} onChange={(e) => setEmail(e.target.value)} />
                  <Input label="Phone" type="tel" required placeholder="+251 911 000 000" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </Section>

              <Section title="Delivery">
                <div className="grid sm:grid-cols-2 gap-3">
                  <Input label="Address" required placeholder="Bole, Sub-city 03" className="sm:col-span-2" value={address} onChange={(e) => setAddress(e.target.value)} />
                  <Input label="City" required placeholder="Addis Ababa" value={city} onChange={(e) => setCity(e.target.value)} />
                  <Input label="Postal code" placeholder="1000" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
                </div>
                <div className="mt-4 grid sm:grid-cols-2 gap-3">
                  <ShippingOption
                    label="Standard"
                    sub="3–5 business days"
                    price={freeShipping ? "Free" : fmt(450)}
                    selected={shippingType === "standard"}
                    onSelect={() => setShippingType("standard")}
                  />
                  <ShippingOption
                    label="Express"
                    sub="Next day · Addis"
                    price={fmt(850)}
                    selected={shippingType === "express"}
                    onSelect={() => setShippingType("express")}
                  />
                </div>
              </Section>

              <Section title="Payment">
                <div className="grid gap-3">
                  <PayOption
                    id="telebirr"
                    current={payment}
                    onSelect={setPayment}
                    title="Telebirr"
                    sub="Mobile wallet · instant"
                    badge="ET"
                  >
                    {payment === "telebirr" && (
                      <div className="pt-4 border-t border-border mt-4 grid gap-3">
                        <Input label="Telebirr number" required placeholder="+251 9XX XXX XXX" />
                        <p className="text-xs text-muted-foreground">
                          You'll receive a USSD prompt on your phone to confirm the {fmt(grand)} payment.
                        </p>
                      </div>
                    )}
                  </PayOption>

                  <PayOption
                    id="bank"
                    current={payment}
                    onSelect={setPayment}
                    title="Bank Transfer"
                    sub="CBE · Awash · Dashen"
                  >
                    {payment === "bank" && (
                      <div className="pt-4 border-t border-border mt-4 grid gap-3 text-sm">
                        <div className="bg-stone-50 rounded-xl p-4">
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                            Transfer to
                          </p>
                          <p className="font-medium">Cosmot Cosmetics PLC</p>
                          <p className="tabular-nums">CBE · 1000 2345 6789 012</p>
                        </div>
                        <Input label="Transfer reference" required placeholder="TRX-..." />
                      </div>
                    )}
                  </PayOption>

                  <PayOption
                    id="card"
                    current={payment}
                    onSelect={setPayment}
                    title="Credit / Debit Card"
                    sub="Visa · Mastercard · Amex"
                  >
                    {payment === "card" && (
                      <div className="pt-4 border-t border-border mt-4 grid gap-3">
                        <Input label="Card number" required placeholder="4242 4242 4242 4242" />
                        <div className="grid grid-cols-2 gap-3">
                          <Input label="Expiry" required placeholder="MM / YY" />
                          <Input label="CVC" required placeholder="123" />
                        </div>
                        <Input label="Name on card" required placeholder="Selam Tadesse" />
                      </div>
                    )}
                  </PayOption>

                  <PayOption
                    id="cod"
                    current={payment}
                    onSelect={setPayment}
                    title="Cash on Delivery"
                    sub="Addis only · +ETB 450 fee"
                  />
                </div>
              </Section>
            </div>

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="bg-stone-50 rounded-3xl p-6 md:p-8 space-y-5">
                <h2 className="font-display text-2xl italic">Order</h2>
                <div className="space-y-3 max-h-64 overflow-y-auto no-scrollbar pr-1">
                  {lines.map((l) => (
                    <div key={l.product.id} className="flex gap-3">
                      <div className="relative size-14 rounded-lg overflow-hidden bg-stone-100 shrink-0">
                        <img src={resolveImageUrl(l.product.imageUrl)} alt="" className="w-full h-full object-cover" />
                        <span className="absolute -top-1 -right-1 size-5 rounded-full bg-foreground text-background text-[10px] grid place-items-center">
                          {l.qty}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{l.product.name}</p>
                          <p className="text-[10px] text-muted-foreground">{l.product.size || ""}</p>
                        </div>
                        <span className="text-xs tabular-nums">{fmt(l.lineTotal)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-4 space-y-2 text-sm">
                  <Row label="Subtotal" value={fmt(subtotal)} />
                  {discount > 0 && <Row label={`Discount (${promo})`} value={`− ${fmt(discount)}`} accent />}
                  <Row label="VAT (15%)" value={fmt(vat)} muted />
                  <Row label="Shipping" value={shipping === 0 ? "Free" : fmt(shipping)} muted />
                </div>
                <div className="border-t border-border pt-4 flex justify-between items-baseline">
                  <span className="font-display text-xl italic">Total</span>
                  <span className="text-xl font-medium tabular-nums">{fmt(grand)}</span>
                </div>

                {error && (
                  <p className="text-sm text-destructive bg-destructive/10 px-4 py-2.5 rounded-xl">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="block w-full text-center bg-foreground text-background py-4 rounded-full text-xs font-medium uppercase tracking-[0.2em] hover:opacity-90 transition disabled:opacity-50"
                >
                  {submitting ? "Placing order..." : `Pay ${fmt(grand)}`}
                </button>
                <p className="text-[10px] text-center text-muted-foreground leading-relaxed">
                  Secured by 256-bit TLS. By placing this order you agree to our
                  Terms &amp; Privacy.
                </p>
              </div>
            </aside>
          </form>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-2xl italic mb-5">{title}</h2>
      {children}
    </section>
  );
}

function Input({
  label,
  className = "",
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <input
        {...rest}
        className="mt-1 w-full px-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:border-foreground transition"
      />
    </label>
  );
}

function ShippingOption({
  label, sub, price, selected, onSelect,
}: { label: string; sub: string; price: string; selected?: boolean; onSelect?: () => void }) {
  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-2xl border cursor-pointer transition ${
        selected ? "border-foreground bg-background" : "border-border"
      }`}
    >
      <div className="flex justify-between items-baseline">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm tabular-nums">{price}</span>
      </div>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{sub}</p>
    </div>
  );
}

function PayOption({
  id, current, onSelect, title, sub, badge, children,
}: {
  id: Payment;
  current: Payment;
  onSelect: (p: Payment) => void;
  title: string;
  sub: string;
  badge?: string;
  children?: ReactNode;
}) {
  const active = current === id;
  return (
    <div
      className={`rounded-2xl border p-4 md:p-5 transition cursor-pointer ${
        active ? "border-foreground bg-stone-50" : "border-border hover:border-foreground/40"
      }`}
      onClick={() => onSelect(id)}
    >
      <div className="flex items-center gap-4">
        <div className={`size-4 rounded-full border ${active ? "border-foreground" : "border-border"} grid place-items-center`}>
          {active && <div className="size-2 rounded-full bg-foreground" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{title}</span>
            {badge && (
              <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-accent/15 text-accent">
                {badge}
              </span>
            )}
          </div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">{sub}</p>
        </div>
      </div>
      {children}
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
