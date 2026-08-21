import { Link, useParams, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { useCart, fmt } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { api, type ApiProduct } from "@/lib/api";

export function ProductDetailPage() {
  const { productId } = useParams({ from: "/products/$productId" });
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { add } = useCart();
  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .getProduct(productId)
      .then(setProduct)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [productId]);

  const handleAdd = () => {
    if (!isAuthenticated || !product) return;
    add(product.id, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="px-4 md:px-8 py-12 md:py-16">
        <div className="mx-auto max-w-5xl">
          {loading && (
            <div className="py-24 text-center text-muted-foreground text-sm">Loading product...</div>
          )}

          {error && (
            <div className="py-24 text-center text-destructive text-sm">{error}</div>
          )}

          {!loading && !error && !product && (
            <div className="py-24 text-center">
              <h1 className="font-display text-3xl italic mb-4">Product not found</h1>
              <Link to="/" className="text-sm text-accent hover:underline">Back to shop</Link>
            </div>
          )}

          {!loading && !error && product && (
            <div className="grid md:grid-cols-2 gap-10 md:gap-16">
              {/* Image */}
              <div className="relative w-full aspect-[4/5] bg-stone-100 rounded-[2rem] overflow-hidden">
                <img
                  src={product.imageUrl || "/placeholder.jpg"}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {product.isNew && (
                  <span className="absolute top-4 left-4 bg-background/90 backdrop-blur px-3 py-1.5 rounded-full text-[10px] uppercase tracking-widest">
                    New
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="flex flex-col">
                <p className="text-[10px] uppercase tracking-[0.25em] text-accent mb-3">
                  {product.category || "Product"}
                </p>
                <h1 className="font-display text-4xl md:text-5xl italic mb-2">{product.name}</h1>
                <p className="text-2xl font-medium tabular-nums mb-6">{fmt(product.price)}</p>

                <p className="text-muted-foreground leading-relaxed mb-8">
                  {product.description || "No description available."}
                </p>

                {/* Details */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  {product.size && (
                    <div className="p-4 rounded-2xl border border-border">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Size</p>
                      <p className="text-sm font-medium">{product.size}</p>
                    </div>
                  )}
                  {product.gender && product.gender !== "all" && (
                    <div className="p-4 rounded-2xl border border-border">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">For</p>
                      <p className="text-sm font-medium capitalize">{product.gender}</p>
                    </div>
                  )}
                  {product.age && (
                    <div className="p-4 rounded-2xl border border-border">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Age</p>
                      <p className="text-sm font-medium capitalize">{product.age}</p>
                    </div>
                  )}
                  {product.bodyPart && (
                    <div className="p-4 rounded-2xl border border-border">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Area</p>
                      <p className="text-sm font-medium capitalize">{product.bodyPart}</p>
                    </div>
                  )}
                </div>

                {/* Stock */}
                <p className={`text-xs mb-6 ${product.stock > 0 ? "text-emerald-600" : "text-destructive"}`}>
                  {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                </p>

                {/* Quantity + Add to Cart */}
                {isAuthenticated ? (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border border-border rounded-full">
                      <button
                        onClick={() => setQty((q) => Math.max(1, q - 1))}
                        className="size-10 grid place-items-center text-lg hover:bg-stone-50 transition"
                      >
                        -
                      </button>
                      <span className="w-10 text-center text-sm font-medium tabular-nums">{qty}</span>
                      <button
                        onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                        className="size-10 grid place-items-center text-lg hover:bg-stone-50 transition"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={handleAdd}
                      disabled={product.stock === 0}
                      className="flex-1 py-4 rounded-full bg-foreground text-background text-xs font-medium uppercase tracking-[0.2em] hover:opacity-90 active:scale-[0.98] transition disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      {added ? "Added to Cart" : "Add to Cart"}
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    className="block w-full text-center py-4 rounded-full border border-foreground text-xs font-medium uppercase tracking-[0.2em] hover:bg-foreground hover:text-background transition"
                  >
                    Sign in to shop
                  </Link>
                )}

                <Link
                  to="/"
                  className="mt-6 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors text-center"
                >
                  Continue shopping
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
