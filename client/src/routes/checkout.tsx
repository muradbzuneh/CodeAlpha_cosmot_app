import { Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, type ReactNode } from "react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { useCart, fmt } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/toast";
import { api, resolveImageUrl } from "@/lib/api";
import { Lock, ShieldCheck, CheckCircle2 } from "lucide-react";

type Payment = "chapa" | "cod";

export function CheckoutPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const { lines, subtotal, discount, vat, total, promo, clear, clearPromo } = useCart();
  const [payment, setPayment] = useState<Payment>("chapa");
  const [shippingType, setShippingType] = useState<"standard" | "express">("standard");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderResult, setOrderResult] = useState<{ id: string; total: number } | null>(null);
  const { toast } = useToast();

  const [customerName, setCustomerName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Addis Ababa");
  const [postalCode, setPostalCode] = useState("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (user) {
      if (!customerName && user.name) setCustomerName(user.name);
      if (!email && user.email) setEmail(user.email);
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="size-8 rounded-full border-2 border-foreground border-t-transparent animate-spin" />
      </div>
    );
  }

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
            <div className="mb-6 size-16 mx-auto rounded-full bg-emerald-50 text-emerald-600 grid place-items-center">
              <CheckCircle2 size={36} />
            </div>
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
      const res = await api.createOrder({
        address,
        city: city || undefined,
        postalCode: postalCode || undefined,
        customerName: customerName || undefined,
        email: email || undefined,
        phone: phone || undefined,
        paymentMethod: payment,
        shipping: shippingType,
        promoCode: promo,
        items: lines.map((l) => ({
          productId: l.product.id,
          quantity: l.qty,
        })),
      });

      clear();
      clearPromo();

      if (res.checkoutUrl) {
        toast("Redirecting to secure Chapa payment portal...", "info");
        window.location.href = res.checkoutUrl;
        return;
      }

      setOrderResult({ id: res.order.id, total: res.order.total });
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
                  <div className="sm:col-span-2">
                    <Input label="Street address" required placeholder="Bole Sub-city, Woreda 03" value={address} onChange={(e) => setAddress(e.target.value)} />
                  </div>
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

              <Section title="Payment Method">
                <div className="grid gap-4">
                  {/* Option 1: Chapa */}
                  <PayOption
                    id="chapa"
                    current={payment}
                    onSelect={setPayment}
                    title="Chapa Payment Gateway"
                    sub="Telebirr · CBE Birr · Awash · Visa · Mastercard"
                    badge="Instant"
                  >
                    {payment === "chapa" && (
                      <div className="pt-4 border-t border-border mt-4 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Telebirr
                          </span>
                          <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-violet-50 text-violet-800 border border-violet-200">
                            CBE Birr
                          </span>
                          <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                            Awash Birr
                          </span>
                          <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-stone-100 text-stone-800 border border-stone-200">
                            Visa / Mastercard
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed flex items-center gap-1.5">
                          <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                          You will be securely redirected to Chapa's official hosted portal to complete payment with your mobile wallet or bank card.
                        </p>
                      </div>
                    )}
                  </PayOption>

                  {/* Option 2: Cash on Delivery */}
                  <PayOption
                    id="cod"
                    current={payment}
                    onSelect={setPayment}
                    title="Cash on Delivery (COD)"
                    sub="Pay cash when parcel arrives at your door"
                    badge="Addis &amp; Kombolcha"
                  >
                    {payment === "cod" && (
                      <div className="pt-4 border-t border-border mt-4">
                        <p className="text-xs text-muted-foreground">
                          Please have exact cash of <strong className="text-foreground">{fmt(grand)}</strong> ready upon courier delivery.
                        </p>
                      </div>
                    )}
                  </PayOption>
                </div>
              </Section>
            </div>

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="bg-stone-50 rounded-3xl p-6 md:p-8 space-y-5">
                <h2 className="font-display text-2xl italic">Order Summary</h2>
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
                  <div className="text-xs text-destructive bg-destructive/10 p-3.5 rounded-xl border border-destructive/20 leading-relaxed">
                    <strong>Payment notice:</strong> {error}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center justify-center gap-2 w-full text-center bg-foreground text-background py-4 rounded-full text-xs font-medium uppercase tracking-[0.2em] hover:opacity-90 transition disabled:opacity-50"
                >
                  <Lock size={14} />
                  {submitting
                    ? "Processing..."
                    : payment === "chapa"
                    ? `Pay with Chapa · ${fmt(grand)}`
                    : `Confirm COD · ${fmt(grand)}`}
                </button>
                <p className="text-[10px] text-center text-muted-foreground leading-relaxed">
                  Secured by 256-bit TLS &amp; Chapa PCI-DSS. By placing this order you agree to our{" "}
                  <Link to="/terms" className="underline hover:text-foreground">Terms</Link> &amp;{" "}
                  <Link to="/privacy" className="underline hover:text-foreground">Privacy</Link>.
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
      <h2 className="font-display text-2xl italic mb-4">{title}</h2>
      {children}
    </section>
  );
}

function Input({
  label,
  required,
  type = "text",
  placeholder,
  value,
  onChange,
}: {
  label: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="block text-xs">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
        {label} {required && <span className="text-accent">*</span>}
      </span>
      <input
        type={type}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="mt-1 w-full px-4 py-3 rounded-xl bg-stone-50 border border-border text-sm focus:outline-none focus:border-foreground transition"
      />
    </label>
  );
}

function ShippingOption({
  label,
  sub,
  price,
  selected,
  onSelect,
}: {
  label: string;
  sub: string;
  price: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`p-4 rounded-2xl border text-left transition ${
        selected ? "border-foreground bg-stone-50" : "border-border hover:border-foreground/40"
      }`}
    >
      <div className="flex justify-between items-baseline mb-1">
        <span className="font-medium text-sm">{label}</span>
        <span className="text-xs tabular-nums font-medium">{price}</span>
      </div>
      <p className="text-[11px] text-muted-foreground">{sub}</p>
    </button>
  );
}

function PayOption({
  id,
  current,
  onSelect,
  title,
  sub,
  badge,
  children,
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
      onClick={() => onSelect(id)}
      className={`p-5 rounded-2xl border transition cursor-pointer ${
        active ? "border-foreground bg-stone-50/70 ring-1 ring-foreground/10" : "border-border hover:border-foreground/40"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`size-4 rounded-full border-2 grid place-items-center ${
              active ? "border-foreground" : "border-muted-foreground/40"
            }`}
          >
            {active && <div className="size-2 rounded-full bg-foreground" />}
          </div>
          <div>
            <span className="font-medium text-sm text-foreground">{title}</span>
            <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
          </div>
        </div>
        {badge && (
          <span className="text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-stone-200/60 text-stone-700">
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function Row({
  label,
  value,
  accent,
  muted,
}: {
  label: string;
  value: string;
  accent?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={`flex justify-between ${
        accent ? "text-emerald-700 font-medium" : muted ? "text-muted-foreground" : ""
      }`}
    >
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
