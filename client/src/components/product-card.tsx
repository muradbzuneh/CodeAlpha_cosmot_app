import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import type { ApiProduct } from "@/lib/products-api";

export function ProductCard({ product }: { product: ApiProduct }) {
  const { add } = useCart();
  const { isAuthenticated } = useAuth();
  const [added, setAdded] = useState(false);

  const img = product.imageUrl || "/placeholder.jpg";

  const handleAdd = () => {
    if (!isAuthenticated) return;
    add(product.id);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  if (!isAuthenticated) {
    return (
      <article className="group">
        <div className="relative w-full aspect-[4/5] bg-stone-100 rounded-2xl overflow-hidden mb-4">
          <img
            src={img}
            alt={product.name}
            loading="lazy"
            width={640}
            height={800}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
          {product.isNew && (
            <span className="absolute top-3 left-3 bg-background/90 backdrop-blur px-2 py-1 rounded-full text-[9px] uppercase tracking-widest">
              New
            </span>
          )}
        </div>
        <h3 className="text-xs font-medium uppercase tracking-tight font-body">{product.name}</h3>
        <p className="text-[11px] text-muted-foreground mt-1 leading-snug line-clamp-2">
          {product.description}
        </p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="text-sm tabular-nums font-medium">{fmt(product.price)}</p>
          <Link
            to="/login"
            className="px-4 py-2 rounded-full border border-foreground text-foreground text-[10px] uppercase tracking-widest font-medium hover:bg-foreground hover:text-background transition"
          >
            Sign in to shop
          </Link>
        </div>
      </article>
    );
  }

  return (
    <article className="group">
      <div className="relative w-full aspect-[4/5] bg-stone-100 rounded-2xl overflow-hidden mb-4">
        <img
          src={img}
          alt={product.name}
          loading="lazy"
          width={640}
          height={800}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
        {product.isNew && (
          <span className="absolute top-3 left-3 bg-background/90 backdrop-blur px-2 py-1 rounded-full text-[9px] uppercase tracking-widest">
            New
          </span>
        )}
      </div>
      <h3 className="text-xs font-medium uppercase tracking-tight font-body">{product.name}</h3>
      <p className="text-[11px] text-muted-foreground mt-1 leading-snug line-clamp-2">
        {product.description}
      </p>
      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="text-sm tabular-nums font-medium">{fmt(product.price)}</p>
        <button
          onClick={handleAdd}
          className="px-4 py-2 rounded-full bg-foreground text-background text-[10px] uppercase tracking-widest font-medium hover:opacity-90 active:scale-95 transition"
        >
          {added ? "Added ✓" : "Add to Cart"}
        </button>
      </div>
    </article>
  );
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency: "ETB",
    minimumFractionDigits: 0,
  }).format(n);
