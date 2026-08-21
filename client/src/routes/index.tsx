import { useState, useEffect, useCallback } from "react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { ProductCard } from "@/components/product-card";
import { useProducts, type ApiProduct } from "@/lib/products-api";
import { api, type ProductFilters } from "@/lib/api";
import heroImg from "@/assets/hero-cream.jpg";
import ingredientImg from "@/assets/ingredient-oil.jpg";
import journalMorning from "@/assets/journal-morning.jpg";
import journalOil from "@/assets/journal-oil.jpg";
import journalDew from "@/assets/journal-dew.jpg";

const CATEGORIES = [
  { key: "all", label: "All Rituals" },
  { key: "complexion", label: "Complexion" },
  { key: "color", label: "Color" },
  { key: "body", label: "Body Sculpt" },
  { key: "age", label: "Age Logic" },
];

const GENDERS = [
  { key: "all", label: "All" },
  { key: "women", label: "Women" },
  { key: "men", label: "Men" },
  { key: "all", label: "Unisex" },
];

const AGES = [
  { key: "all", label: "All Ages" },
  { key: "teen", label: "Teen" },
  { key: "adult", label: "Adult" },
  { key: "mature", label: "Mature" },
];

const PRICE_RANGES = [
  { key: "all", label: "Any Price", min: undefined, max: undefined },
  { key: "under2000", label: "Under 2,000", min: undefined, max: 2000 },
  { key: "2000-3000", label: "2,000 – 3,000", min: 2000, max: 3000 },
  { key: "3000+", label: "Over 3,000", min: 3000, max: undefined },
];

export function Home() {
  const { products: allProducts } = useProducts();
  const newReleases = allProducts.filter((p) => p.isNew);

  const [category, setCategory] = useState("all");
  const [gender, setGender] = useState("all");
  const [age, setAge] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const price = PRICE_RANGES.find((r) => r.key === priceRange);
      const filters: ProductFilters = {
        page,
        limit: 12,
        category: category !== "all" ? category : undefined,
        gender: gender !== "all" ? gender : undefined,
        age: age !== "all" ? age : undefined,
        minPrice: price?.min,
        maxPrice: price?.max,
      };
      const res = await api.getProducts(filters);
      setProducts(res.products);
      setTotalPages(res.totalPages);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [category, gender, age, priceRange, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    setPage(1);
  }, [category, gender, age, priceRange]);

  const COLLECTIONS = [
    { label: "For Her", sub: "Women", cat: "all", gen: "women" },
    { label: "For Him", sub: "Men", cat: "all", gen: "men" },
    { label: "Teen Skin", sub: "Age 13–19", cat: "all", gen: "all", ageVal: "teen" },
    { label: "Mature", sub: "Age 40+", cat: "all", gen: "all", ageVal: "mature" },
    { label: "Face", sub: "Body part", cat: "complexion", gen: "all" },
    { label: "Lips", sub: "Body part", cat: "color", gen: "all" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />

      {/* Hero */}
      <header className="px-4 md:px-8 pt-8 md:pt-16 pb-12 animate-fade-up">
        <div className="mx-auto max-w-6xl grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div className="md:order-2">
            <div className="relative w-full aspect-[4/5] bg-stone-100 rounded-[2rem] overflow-hidden">
              <img
                src={heroImg}
                alt="Cosmot Dew Concentrate — frosted glass jar of luxury face cream"
                width={1024}
                height={1280}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-4 left-4 bg-background/90 backdrop-blur px-3 py-1.5 rounded-full text-[10px] uppercase tracking-widest">
                The Dew Concentrate · New
              </span>
            </div>
          </div>
          <div className="md:order-1">
            <p className="text-[10px] uppercase tracking-[0.25em] text-accent mb-6">
              Atelier 04 · Spring formulary
            </p>
            <h1 className="font-display text-5xl md:text-7xl leading-[0.9] text-balance mb-6">
              Suspended in <br />
              <span className="italic">luminous hydration.</span>
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-md leading-relaxed mb-8">
              Cellular-grade cosmetics formulated in small batches. Each ritual is a quiet act of
              reconstruction — for skin, for lips, for the slow architecture of self.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="#new"
                className="px-7 py-3.5 bg-foreground text-background rounded-full text-xs font-medium uppercase tracking-widest hover:opacity-90 active:scale-95 transition"
              >
                Shop New
              </a>
              <a
                href="#ritual"
                className="px-7 py-3.5 border border-foreground rounded-full text-xs font-medium uppercase tracking-widest hover:bg-foreground hover:text-background transition"
              >
                The Ritual
              </a>
            </div>
            <div className="mt-12 grid grid-cols-3 gap-6 max-w-md">
              {[
                ["Cruelty", "Free"],
                ["Small", "Batch"],
                ["Free", "Shipping ETB 4,500+"],
              ].map(([a, b]) => (
                <div key={a} className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  <div className="text-foreground">{a}</div>
                  <div>{b}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* New Releases */}
      <section id="new" className="px-4 md:px-8 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="flex justify-between items-end mb-10">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-accent mb-2">Just landed</p>
              <h2 className="font-display text-3xl md:text-5xl italic">New Releases</h2>
            </div>
            <a
              href="#categories"
              className="text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border pb-1 hover:text-foreground"
            >
              View all
            </a>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 md:gap-x-6 gap-y-10">
            {newReleases.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="px-4 md:px-8 py-16 md:py-24 bg-stone-50">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <p className="text-[10px] uppercase tracking-[0.25em] text-accent mb-2">Curated by intention</p>
            <h2 className="font-display text-3xl md:text-5xl italic">Shop the catalogue</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-10">
            {COLLECTIONS.map((c) => (
              <button
                key={c.label}
                onClick={() => {
                  setCategory(c.cat);
                  setGender(c.gen);
                  if (c.ageVal) setAge(c.ageVal);
                  else setAge("all");
                  setPriceRange("all");
                  const el = document.getElementById("catalogue");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                className="group text-left p-5 rounded-2xl bg-background border border-border hover:border-foreground transition"
              >
                <div className="font-display text-2xl italic group-hover:text-accent transition">{c.label}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
                  {c.sub}
                </div>
              </button>
            ))}
          </div>

          <div id="catalogue" className="space-y-4 mb-8">
            {/* Category pills */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar -mx-4 md:mx-0 px-4 md:px-0">
              {CATEGORIES.map((f) => {
                const active = category === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={() => setCategory(f.key)}
                    className={`whitespace-nowrap px-5 py-2 rounded-full text-xs uppercase tracking-tight transition ${
                      active
                        ? "bg-foreground text-background border border-foreground"
                        : "border border-border hover:border-foreground"
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>

            {/* Gender + Age + Price row */}
            <div className="flex flex-wrap gap-2">
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="px-4 py-2 rounded-full border border-border bg-background text-xs uppercase tracking-tight focus:outline-none focus:border-foreground"
              >
                {GENDERS.map((g, i) => (
                  <option key={`${g.key}-${i}`} value={g.key}>{g.label}</option>
                ))}
              </select>

              <select
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="px-4 py-2 rounded-full border border-border bg-background text-xs uppercase tracking-tight focus:outline-none focus:border-foreground"
              >
                {AGES.map((a) => (
                  <option key={a.key} value={a.key}>{a.label}</option>
                ))}
              </select>

              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="px-4 py-2 rounded-full border border-border bg-background text-xs uppercase tracking-tight focus:outline-none focus:border-foreground"
              >
                {PRICE_RANGES.map((r) => (
                  <option key={r.key} value={r.key}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-muted-foreground text-sm">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground text-sm">No products match your filters.</div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 md:gap-x-6 gap-y-10">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-12">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 rounded-full border border-border text-xs uppercase tracking-tight hover:border-foreground transition disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Prev
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`size-9 rounded-full text-xs font-medium transition ${
                        p === page
                          ? "bg-foreground text-background"
                          : "border border-border hover:border-foreground"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 rounded-full border border-border text-xs uppercase tracking-tight hover:border-foreground transition disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Ingredient Spotlight + Ritual */}
      <section id="ritual" className="px-4 md:px-8 py-16 md:py-24">
        <div className="mx-auto max-w-6xl grid md:grid-cols-2 gap-10 items-center">
          <div className="bg-accent/5 rounded-[2.5rem] border border-accent/10 p-8 md:p-12 order-2 md:order-1">
            <p className="text-[10px] uppercase tracking-[0.25em] text-accent mb-4">
              The Core · Cold-Pressed Squalane
            </p>
            <h3 className="font-display text-3xl md:text-4xl italic leading-tight mb-5">
              Mimicking the sebum your skin produces naturally.
            </h3>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-6">
              Ethically sourced from fermented sugar cane, our lipid complex provides instant
              weightless barrier repair without occlusion.
            </p>
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-accent/15">
              {[
                ["99.9%", "Pure lipid"],
                ["18 hr", "Hydration"],
                ["0", "Synthetics"],
              ].map(([n, l]) => (
                <div key={l}>
                  <div className="font-display text-2xl italic">{n}</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{l}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="order-1 md:order-2 rounded-[2.5rem] overflow-hidden aspect-[4/3] md:aspect-square">
            <img
              src={ingredientImg}
              alt="Macro drop of clear oil falling into water"
              loading="lazy"
              width={1024}
              height={512}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Editorial — Ritual journal */}
      <section className="px-4 md:px-8 py-16 md:py-24 bg-foreground text-background rounded-t-[3rem]">
        <div className="mx-auto max-w-6xl grid md:grid-cols-[1fr_2fr] gap-10">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-background/60 mb-3">Journal</p>
            <h3 className="font-display text-4xl md:text-5xl italic">From the atelier.</h3>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { tag: "Ritual", title: "The three-minute morning protocol.", img: journalMorning, alt: "Morning skincare ritual with cream jar and herbal tea" },
              { tag: "Ingredient", title: "Why fermented oils outperform virgin pressings.", img: journalOil, alt: "Golden amber oil pouring from a dropper bottle" },
              { tag: "Field notes", title: "A week on the Dew Concentrate.", img: journalDew, alt: "Frosted glass cream jar on wet stone with dew drops" },
            ].map((post) => (
              <article key={post.title} className="group cursor-pointer">
                <div className="aspect-square rounded-2xl overflow-hidden mb-4">
                  <img
                    src={post.img}
                    alt={post.alt}
                    loading="lazy"
                    width={1024}
                    height={1024}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                </div>
                <p className="text-[10px] uppercase tracking-widest text-background/60 mb-2">{post.tag}</p>
                <h4 className="font-display text-xl italic leading-snug">{post.title}</h4>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="px-4 md:px-8 py-16 md:py-24 text-center">
        <div className="mx-auto max-w-xl">
          <p className="text-[10px] uppercase tracking-[0.25em] text-accent mb-3">The Letter</p>
          <h3 className="font-display text-3xl md:text-4xl italic mb-4">
            Slow notes from the laboratory.
          </h3>
          <p className="text-sm text-muted-foreground mb-8">
            New formulations, ritual studies, and quiet announcements. No filler.
          </p>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto"
          >
            <input
              type="email"
              required
              placeholder="your@email"
              className="flex-1 px-5 py-3.5 rounded-full bg-stone-50 border border-border text-sm focus:outline-none focus:border-foreground"
            />
            <button className="px-6 py-3.5 rounded-full bg-foreground text-background text-xs uppercase tracking-widest">
              Subscribe
            </button>
          </form>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
