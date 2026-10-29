import { Link, useParams } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { useCart, fmt } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/toast";
import { api, type ApiProduct, type ApiProductVariant, resolveImageUrl } from "@/lib/api";
import { Skeleton } from "@/components/skeleton";
import { Star, ChevronDown, CheckCircle2, Sparkles, AlertTriangle, ShieldCheck } from "lucide-react";

function StarRating({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={
            star <= Math.round(rating)
              ? "fill-amber-400 text-amber-400"
              : "fill-stone-200 text-stone-200"
          }
        />
      ))}
    </div>
  );
}

function AccordionItem({
  title,
  isOpen,
  onToggle,
  badge,
  children,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-border/70 py-4.5">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between text-left group transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-widest font-medium text-foreground group-hover:text-accent transition">
            {title}
          </span>
          {badge && (
            <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium">
              {badge}
            </span>
          )}
        </div>
        <ChevronDown
          size={16}
          className={`text-muted-foreground transition-transform duration-300 ${
            isOpen ? "rotate-180 text-foreground" : ""
          }`}
        />
      </button>
      {isOpen && <div className="mt-3.5 animate-fade-in text-muted-foreground">{children}</div>}
    </div>
  );
}

export function ProductDetailPage() {
  const { productId } = useParams({ from: "/products/$productId" });
  const { isAuthenticated } = useAuth();
  const { add } = useCart();
  const { toast } = useToast();

  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ApiProductVariant | null>(null);
  const [activeImage, setActiveImage] = useState<string>("");
  const [zoomPos, setZoomPos] = useState<{ x: number; y: number } | null>(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>("ingredients");

  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSkinType, setReviewSkinType] = useState("Combination");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .getProduct(productId)
      .then((data) => {
        setProduct(data);
        setActiveImage(data.imageUrl || data.images?.[0] || "");
        if (data.variants && data.variants.length > 0) {
          const defaultVar = data.variants.find((v) => v.isDefault) || data.variants[0];
          setSelectedVariant(defaultVar);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [productId]);

  const activePrice = selectedVariant?.price ?? product?.price ?? 0;
  const activeStock = selectedVariant?.stock ?? product?.stock ?? 0;

  // Combine product.imageUrl and product.images into unique list
  const galleryImages = product
    ? Array.from(new Set([product.imageUrl, ...(product.images || [])].filter(Boolean))) as string[]
    : [];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  const handleMouseLeave = () => setZoomPos(null);

  const handleAdd = () => {
    if (!isAuthenticated || !product) return;
    add(product.id, qty);
    setAdded(true);
    toast(`${product.name} (${selectedVariant?.title || product.size || "Standard"}) added to selection`, "success");
    setTimeout(() => setAdded(false), 1500);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) {
      toast("Please share a few words about your experience", "error");
      return;
    }
    setSubmittingReview(true);
    try {
      const created = await api.createReview(productId, {
        rating: reviewRating,
        title: reviewTitle.trim() || undefined,
        comment: reviewComment.trim(),
        skinType: reviewSkinType || undefined,
      });

      setProduct((prev) => {
        if (!prev) return prev;
        const updatedReviews = [created, ...(prev.reviews || [])];
        const count = updatedReviews.length;
        const avg = updatedReviews.reduce((sum, r) => sum + r.rating, 0) / count;
        return {
          ...prev,
          reviews: updatedReviews,
          reviewCount: count,
          averageRating: +avg.toFixed(1),
        };
      });

      toast("Thank you! Your verified review has been published.", "success");
      setReviewTitle("");
      setReviewComment("");
      setShowReviewForm(false);
    } catch (err: any) {
      toast(err.message || "Failed to submit review", "error");
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="px-4 md:px-8 py-12 md:py-16 animate-page-in">
        <div className="mx-auto max-w-5xl">
          {loading && (
            <div className="grid md:grid-cols-2 gap-10 md:gap-16">
              <Skeleton className="w-full aspect-[4/5] rounded-[2rem]" />
              <div className="space-y-4">
                <Skeleton className="h-3 w-24 rounded" />
                <Skeleton className="h-10 w-3/4 rounded" />
                <Skeleton className="h-7 w-20 rounded" />
                <Skeleton className="h-20 w-full rounded" />
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-16 rounded-2xl" />
                  <Skeleton className="h-16 rounded-2xl" />
                </div>
                <Skeleton className="h-12 w-full rounded-full" />
              </div>
            </div>
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
            <>
              {/* Product Showcase Section */}
              <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-start">
                {/* Left: Multi-Image Gallery with Interactive Zoom */}
                <div className="space-y-4">
                  {/* Main Image with Zoom on Hover */}
                  <div
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    className="relative w-full aspect-[4/5] bg-stone-100 rounded-[2rem] overflow-hidden border border-border/40 cursor-crosshair group select-none shadow-sm"
                  >
                    <img
                      src={resolveImageUrl(activeImage || product.imageUrl)}
                      alt={product.name}
                      style={{
                        transformOrigin: zoomPos ? `${zoomPos.x}% ${zoomPos.y}%` : "center center",
                        transform: zoomPos ? "scale(1.85)" : "scale(1)",
                      }}
                      className="w-full h-full object-cover transition-transform duration-150 pointer-events-none"
                    />

                    {/* Floating Badges */}
                    {product.isNew && (
                      <span className="absolute top-4 left-4 bg-background/90 backdrop-blur px-3 py-1.5 rounded-full text-[10px] uppercase tracking-widest shadow-sm">
                        New Formula
                      </span>
                    )}
                    {product.pao && (
                      <span className="absolute top-4 right-4 bg-background/85 backdrop-blur px-2.5 py-1 rounded-full text-[10px] font-mono tracking-wider border border-border">
                        PAO {product.pao}
                      </span>
                    )}

                    {/* Zoom Hint Indicator */}
                    <div className="absolute bottom-4 left-4 bg-background/85 backdrop-blur px-3 py-1 rounded-full text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 opacity-90 group-hover:opacity-0 transition-opacity">
                      <Sparkles size={11} className="text-accent" />
                      <span>Hover image to zoom texture</span>
                    </div>
                  </div>

                  {/* Multi-Image Thumbnails Carousel */}
                  {galleryImages.length > 1 && (
                    <div className="flex gap-2.5 overflow-x-auto pb-1.5 no-scrollbar">
                      {galleryImages.map((img, idx) => {
                        const isCurrent = (activeImage || product.imageUrl) === img;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActiveImage(img)}
                            className={`relative size-16 sm:size-20 rounded-2xl overflow-hidden border transition-all shrink-0 ${
                              isCurrent
                                ? "border-foreground ring-1 ring-foreground scale-[1.03] shadow-sm"
                                : "border-border/70 opacity-60 hover:opacity-100"
                            }`}
                          >
                            <img
                              src={resolveImageUrl(img)}
                              alt={`${product.name} photo ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Clean Cosmetic Assurances */}
                  <div className="grid grid-cols-3 gap-2 text-center pt-2">
                    <div className="py-2.5 px-2 rounded-xl bg-stone-50/80 border border-border/60">
                      <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-medium">Clean Formula</p>
                      <p className="text-[11px] font-medium text-foreground mt-0.5">Paraben-Free</p>
                    </div>
                    <div className="py-2.5 px-2 rounded-xl bg-stone-50/80 border border-border/60">
                      <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-medium">Ethics</p>
                      <p className="text-[11px] font-medium text-foreground mt-0.5">Cruelty-Free</p>
                    </div>
                    <div className="py-2.5 px-2 rounded-xl bg-stone-50/80 border border-border/60">
                      <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-medium">Safety</p>
                      <p className="text-[11px] font-medium text-foreground mt-0.5">Derm Tested</p>
                    </div>
                  </div>
                </div>

                {/* Right: Info & Actions */}
                <div className="flex flex-col">
                  {/* Category & Star Rating */}
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <p className="text-[10px] uppercase tracking-[0.25em] text-accent">
                      {product.category || "Cosmetics"}
                    </p>
                    {product.reviewCount && product.reviewCount > 0 ? (
                      <a
                        href="#reviews"
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition group"
                      >
                        <StarRating rating={product.averageRating || 5} size={12} />
                        <span className="font-medium text-foreground text-xs">{product.averageRating?.toFixed(1)}</span>
                        <span className="text-[11px]">({product.reviewCount})</span>
                      </a>
                    ) : null}
                  </div>

                  <h1 className="font-display text-4xl md:text-5xl italic mb-3 leading-tight">{product.name}</h1>

                  {/* Price & Stock */}
                  <div className="flex items-baseline gap-3 mb-6">
                    <p className="text-2xl font-medium tabular-nums text-foreground">{fmt(activePrice)}</p>
                    {selectedVariant && (
                      <span className="text-xs text-muted-foreground font-medium">
                        for {selectedVariant.title}
                      </span>
                    )}
                  </div>

                  <p className="text-muted-foreground leading-relaxed text-sm mb-6">
                    {product.description || "Botanical skincare formulation crafted with active botanical extracts."}
                  </p>

                  {/* Key Active Ingredients Banner */}
                  {product.keyIngredients && (
                    <div className="mb-6 p-4 rounded-2xl bg-stone-50/90 border border-border/80">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Sparkles size={13} className="text-accent" />
                        <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-accent">Key Active Ingredients</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {product.keyIngredients.split(",").map((ing, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-full text-[11px] bg-background border border-border text-foreground font-medium"
                          >
                            {ing.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Format & Size Variant Selector (with Color Swatches & Format Details) */}
                  {product.variants && product.variants.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                          {product.variants.some((v) => v.shadeColor) ? "Select Shade / Color" : "Select Format"}
                        </span>
                        <span className="text-xs font-medium text-foreground">{selectedVariant?.title}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {product.variants.map((v) => {
                          const isSelected = selectedVariant?.id === v.id;
                          return (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() => setSelectedVariant(v)}
                              className={`px-4 py-2.5 rounded-full text-xs transition border flex items-center gap-2.5 ${
                                isSelected
                                  ? "bg-foreground text-background border-foreground font-medium shadow-sm"
                                  : "bg-background text-foreground border-border hover:border-foreground/30 hover:bg-stone-50"
                              }`}
                            >
                              {/* Visual Shade Color Swatch if cosmetic color */}
                              {v.shadeColor && (
                                <span
                                  className="size-3.5 rounded-full border border-black/15 shrink-0 shadow-inner"
                                  style={{ backgroundColor: v.shadeColor }}
                                  aria-hidden="true"
                                />
                              )}
                              <span>{v.title}</span>
                              <span className={`text-[10px] ${isSelected ? "text-background/80" : "text-muted-foreground"}`}>
                                {fmt(v.price)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Detail Attributes */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {product.size && (
                      <div className="p-3.5 rounded-2xl border border-border/80">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Standard Volume</p>
                        <p className="text-sm font-medium">{product.size}</p>
                      </div>
                    )}
                    {product.skinType && (
                      <div className="p-3.5 rounded-2xl border border-border/80">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Ideal For</p>
                        <p className="text-sm font-medium line-clamp-1">{product.skinType.split(",")[0]}</p>
                      </div>
                    )}
                    {product.gender && product.gender !== "all" && (
                      <div className="p-3.5 rounded-2xl border border-border/80">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Gender</p>
                        <p className="text-sm font-medium capitalize">{product.gender}</p>
                      </div>
                    )}
                    {product.bodyPart && (
                      <div className="p-3.5 rounded-2xl border border-border/80">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Application Area</p>
                        <p className="text-sm font-medium capitalize">{product.bodyPart}</p>
                      </div>
                    )}
                  </div>

                  {/* Stock Indicator */}
                  <p className={`text-xs mb-6 font-medium ${activeStock > 0 ? "text-emerald-600" : "text-destructive"}`}>
                    {activeStock > 0 ? `In stock (${activeStock} units available)` : "Temporarily out of stock"}
                  </p>

                  {/* Quantity + Add to Cart */}
                  {isAuthenticated ? (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <div className="flex items-center border border-border rounded-full justify-center sm:justify-start bg-background">
                        <button
                          onClick={() => setQty((q) => Math.max(1, q - 1))}
                          className="size-11 grid place-items-center text-lg hover:bg-stone-50 transition rounded-full"
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <span className="w-10 text-center text-sm font-medium tabular-nums">{qty}</span>
                        <button
                          onClick={() => setQty((q) => Math.min(activeStock, q + 1))}
                          className="size-11 grid place-items-center text-lg hover:bg-stone-50 transition rounded-full"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={handleAdd}
                        disabled={activeStock === 0}
                        className="flex-1 py-4 rounded-full bg-foreground text-background text-xs font-medium uppercase tracking-[0.2em] hover:opacity-90 active:scale-[0.98] transition disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                      >
                        {added ? "Added to Selection ✓" : `Add to Cart · ${fmt(activePrice * qty)}`}
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

                  {/* Cosmetics Regulatory & Transparency Accordion Disclosures */}
                  <div className="mt-8 border-t border-border pt-2">
                    {/* 1. How to Apply & Routine Guidance */}
                    {product.routineStep && (
                      <AccordionItem
                        title="How to Apply & Routine"
                        isOpen={openSection === "routine"}
                        onToggle={() => setOpenSection(openSection === "routine" ? null : "routine")}
                      >
                        <p className="text-xs leading-relaxed text-muted-foreground">{product.routineStep}</p>
                        {product.pao && (
                          <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
                            <span className="px-2 py-0.5 rounded border border-border font-mono text-[10px] text-foreground font-medium">
                              PAO {product.pao}
                            </span>
                            <span>Recommended period of use after opening.</span>
                          </div>
                        )}
                      </AccordionItem>
                    )}

                    {/* 2. Full INCI Ingredients & Allergens Disclosure */}
                    {product.ingredients && (
                      <AccordionItem
                        title="Full Ingredients (INCI Transparency)"
                        badge="EU / EFDA"
                        isOpen={openSection === "ingredients"}
                        onToggle={() => setOpenSection(openSection === "ingredients" ? null : "ingredients")}
                      >
                        <p className="text-[11px] leading-relaxed text-muted-foreground/90 font-mono mb-3">
                          {product.ingredients}
                        </p>

                        {/* Declared Allergens */}
                        {product.allergens && (
                          <div className="p-3 rounded-xl bg-stone-50 border border-border/80 mb-3">
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">
                              Allergen Declaration
                            </p>
                            <p className="text-[11px] leading-relaxed text-muted-foreground">
                              {product.allergens}
                            </p>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-3 text-[10px] uppercase tracking-widest text-accent">
                          <span>✓ Botanical Extracts</span>
                          <span>✓ Cruelty-Free</span>
                          <span>✓ Clean Formula</span>
                        </div>
                      </AccordionItem>
                    )}

                    {/* 3. Safety, Warnings & Patch Test (Mandatory EFDA / Regulatory) */}
                    {(product.warnings || product.patchTest || product.efdaNumber) && (
                      <AccordionItem
                        title="Safety, Warnings & Patch Test"
                        isOpen={openSection === "safety"}
                        onToggle={() => setOpenSection(openSection === "safety" ? null : "safety")}
                      >
                        {product.warnings && (
                          <div className="mb-3.5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-foreground">
                            <div className="flex items-center gap-1.5 text-amber-900 font-semibold text-[10px] uppercase tracking-wider mb-1">
                              <AlertTriangle size={13} className="text-amber-700" />
                              Precautions & Contraindications
                            </div>
                            <p className="text-xs leading-relaxed text-amber-950/90">{product.warnings}</p>
                          </div>
                        )}

                        {product.patchTest && (
                          <div className="mb-3.5">
                            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">
                              <ShieldCheck size={13} className="text-emerald-700" />
                              Patch Test Instructions
                            </div>
                            <p className="text-xs leading-relaxed text-muted-foreground">{product.patchTest}</p>
                          </div>
                        )}

                        {product.efdaNumber && (
                          <div className="pt-2.5 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
                            <span className="uppercase text-[9px] tracking-widest">EFDA Notification No.</span>
                            <span className="font-mono font-medium text-foreground">{product.efdaNumber}</span>
                          </div>
                        )}
                      </AccordionItem>
                    )}

                    {/* 4. Skin Compatibility & Benefits */}
                    {product.benefits && (
                      <AccordionItem
                        title="Skin Compatibility & Benefits"
                        isOpen={openSection === "benefits"}
                        onToggle={() => setOpenSection(openSection === "benefits" ? null : "benefits")}
                      >
                        <p className="text-xs leading-relaxed text-muted-foreground mb-3">{product.benefits}</p>
                        {product.skinType && (
                          <div className="flex flex-wrap gap-1.5">
                            {product.skinType.split(",").map((s, i) => (
                              <span
                                key={i}
                                className="px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider bg-secondary text-secondary-foreground"
                              >
                                {s.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </AccordionItem>
                    )}
                  </div>
                </div>
              </div>

              {/* Customer Reviews & Feedback Section */}
              <section id="reviews" className="mt-20 md:mt-28 border-t border-border pt-12 md:pt-16">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.25em] text-accent mb-2">Community Feedback</p>
                    <h2 className="font-display text-3xl md:text-5xl italic">Customer Reviews</h2>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex items-baseline gap-2">
                      <span className="font-display text-4xl italic font-medium">{product.averageRating?.toFixed(1) || "5.0"}</span>
                      <div className="flex flex-col">
                        <StarRating rating={product.averageRating || 5} size={14} />
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
                          {product.reviewCount || 0} {product.reviewCount === 1 ? "Review" : "Reviews"}
                        </span>
                      </div>
                    </div>

                    {isAuthenticated && (
                      <button
                        onClick={() => setShowReviewForm((prev) => !prev)}
                        className="px-5 py-2.5 rounded-full border border-foreground text-xs uppercase tracking-widest hover:bg-foreground hover:text-background transition"
                      >
                        {showReviewForm ? "Close Form" : "Write a Review"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline Review Submission Form */}
                {showReviewForm && (
                  <form
                    onSubmit={handleReviewSubmit}
                    className="mb-12 p-6 md:p-8 rounded-3xl bg-stone-50/90 border border-border max-w-2xl animate-fade-in shadow-sm"
                  >
                    <h3 className="font-display text-2xl italic mb-1">Share your experience</h3>
                    <p className="text-xs text-muted-foreground mb-6">
                      Your feedback helps others choose the right routine for their skin type.
                    </p>

                    <div className="space-y-5">
                      {/* Rating selection */}
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                          Rating
                        </label>
                        <div className="flex items-center gap-1.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewRating(star)}
                              onMouseEnter={() => setHoverRating(star)}
                              onMouseLeave={() => setHoverRating(0)}
                              className="p-1 hover:scale-110 transition"
                              aria-label={`${star} star rating`}
                            >
                              <Star
                                size={22}
                                className={
                                  star <= (hoverRating || reviewRating)
                                    ? "fill-amber-400 text-amber-400"
                                    : "fill-stone-200 text-stone-200"
                                }
                              />
                            </button>
                          ))}
                          <span className="text-xs text-muted-foreground ml-3 font-medium">
                            {reviewRating === 5 ? "Exceptional" : reviewRating === 4 ? "Great" : reviewRating === 3 ? "Good" : "Fair"}
                          </span>
                        </div>
                      </div>

                      {/* Skin Type selector */}
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                          Your Skin Type
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {["Dry", "Combination", "Oily", "Sensitive", "Mature", "Normal"].map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => setReviewSkinType(st)}
                              className={`px-3 py-1.5 rounded-full text-xs transition border ${
                                reviewSkinType === st
                                  ? "bg-foreground text-background border-foreground font-medium"
                                  : "bg-background text-foreground border-border hover:border-foreground/40"
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Review Title */}
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                          Review Headline (optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Instantly absorbed and very soothing"
                          value={reviewTitle}
                          onChange={(e) => setReviewTitle(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-foreground"
                        />
                      </div>

                      {/* Review Comment */}
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                          Your Review
                        </label>
                        <textarea
                          rows={4}
                          required
                          placeholder="How did this product feel on your skin? How did it integrate into your routine?"
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-foreground"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowReviewForm(false)}
                          className="px-5 py-2.5 rounded-full text-xs uppercase tracking-widest hover:underline"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={submittingReview}
                          className="px-6 py-2.5 rounded-full bg-foreground text-background text-xs uppercase tracking-widest font-medium hover:opacity-90 disabled:opacity-40 transition"
                        >
                          {submittingReview ? "Submitting..." : "Post Review"}
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {/* Reviews List */}
                <div className="space-y-4">
                  {product.reviews && product.reviews.length > 0 ? (
                    product.reviews.map((rev) => (
                      <article
                        key={rev.id}
                        className="p-6 md:p-7 rounded-2xl bg-stone-50/70 border border-border/80 transition-all hover:border-border"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-3">
                            <StarRating rating={rev.rating} size={13} />
                            {rev.title && (
                              <h4 className="font-display text-lg italic text-foreground">{rev.title}</h4>
                            )}
                          </div>
                          <span className="text-[11px] text-muted-foreground">
                            {new Date(rev.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                          {rev.comment}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-border/40 text-[11px]">
                          <span className="font-medium text-foreground">
                            {rev.user?.name || "Cosmot Customer"}
                          </span>
                          {rev.verified && (
                            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                              <CheckCircle2 size={11} />
                              Verified Buyer
                            </span>
                          )}
                          {rev.skinType && (
                            <span className="text-[10px] text-muted-foreground tracking-wider uppercase">
                              Skin: {rev.skinType}
                            </span>
                          )}
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="py-12 text-center text-muted-foreground text-xs">
                      No reviews yet. Be the first to share your experience with {product.name}.
                    </div>
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
