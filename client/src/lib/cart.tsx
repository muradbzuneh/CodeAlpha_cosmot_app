import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { products, type Product } from "./products";

export type CartItem = { id: string; qty: number };

type CartCtx = {
  items: CartItem[];
  add: (id: string, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  count: number;
  lines: Array<{ product: Product; qty: number; lineTotal: number }>;
  subtotal: number;
  discount: number;
  vat: number;
  total: number;
  promo: string | null;
  applyPromo: (code: string) => boolean;
  clearPromo: () => void;
};

const Ctx = createContext<CartCtx | null>(null);

const VAT_RATE = 0.15;
const PROMOS: Record<string, number> = { COSMOT10: 0.1, GLOW20: 0.2 };
const STORAGE_KEY = "cosmot-cart-v1";
const PROMO_KEY = "cosmot-promo-v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [promo, setPromo] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
      const p = localStorage.getItem(PROMO_KEY);
      if (p) setPromo(p);
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, ready]);

  useEffect(() => {
    if (!ready) return;
    if (promo) localStorage.setItem(PROMO_KEY, promo);
    else localStorage.removeItem(PROMO_KEY);
  }, [promo, ready]);

  const value = useMemo<CartCtx>(() => {
    const lines = items
      .map((it) => {
        const product = products.find((p) => p.id === it.id);
        if (!product) return null;
        return { product, qty: it.qty, lineTotal: product.price * it.qty };
      })
      .filter(Boolean) as CartCtx["lines"];

    const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
    const discountRate = promo ? PROMOS[promo] ?? 0 : 0;
    const discount = +(subtotal * discountRate).toFixed(2);
    const taxable = subtotal - discount;
    const vat = +(taxable * VAT_RATE).toFixed(2);
    const total = +(taxable + vat).toFixed(2);

    return {
      items,
      add: (id, qty = 1) =>
        setItems((prev) => {
          const ex = prev.find((p) => p.id === id);
          if (ex) return prev.map((p) => (p.id === id ? { ...p, qty: p.qty + qty } : p));
          return [...prev, { id, qty }];
        }),
      remove: (id) => setItems((prev) => prev.filter((p) => p.id !== id)),
      setQty: (id, qty) =>
        setItems((prev) =>
          qty <= 0
            ? prev.filter((p) => p.id !== id)
            : prev.map((p) => (p.id === id ? { ...p, qty } : p)),
        ),
      clear: () => setItems([]),
      count: items.reduce((s, i) => s + i.qty, 0),
      lines,
      subtotal: +subtotal.toFixed(2),
      discount,
      vat,
      total,
      promo,
      applyPromo: (code) => {
        const k = code.trim().toUpperCase();
        if (PROMOS[k] !== undefined) {
          setPromo(k);
          return true;
        }
        return false;
      },
      clearPromo: () => setPromo(null),
    };
  }, [items, promo]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCart must be used within CartProvider");
  return v;
}

export const fmt = (n: number) =>
  new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency: "ETB",
    minimumFractionDigits: 0,
  }).format(n);
