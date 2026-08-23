import { useEffect, useState } from "react";
import { api, type ApiProduct } from "@/lib/api";
import { fmt } from "@/lib/cart";

const EMPTY: Partial<ApiProduct> = {
  name: "",
  description: "",
  price: 0,
  stock: 0,
  category: "complexion",
  gender: "all",
  age: "adult",
  bodyPart: "face",
  size: "",
  isNew: false,
};

export function AdminProductsPage() {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<ApiProduct> | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchProducts = () => {
    api.getProducts({ limit: 100 }).then((res) => setProducts(res.products)).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleImageUpload = async (file: File): Promise<string | null> => {
    setUploading(true);
    try {
      const result = await api.uploadImage(file);
      return result.url;
    } catch {
      alert("Image upload failed");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!editing?.name) return;
    setSaving(true);
    try {
      if (editing.id) {
        const updated = await api.updateProduct(editing.id, editing);
        setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      } else {
        const created = await api.createProduct(editing);
        setProducts((prev) => [created, ...prev]);
      }
      setEditing(null);
    } catch (err: any) {
      alert(err.message || "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await api.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      alert(err.message || "Failed to delete");
    }
  };

  if (loading) {
    return <div className="py-24 text-center text-muted-foreground text-sm">Loading products...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl italic">Products</h1>
          <p className="text-sm text-muted-foreground mt-1">{products.length} products in catalogue</p>
        </div>
        <button
          onClick={() => setEditing({ ...EMPTY })}
          className="px-5 py-2.5 rounded-full bg-foreground text-background text-xs uppercase tracking-widest font-medium hover:opacity-90 transition"
        >
          Add Product
        </button>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div
            className="bg-background rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl italic">{editing.id ? "Edit" : "Add"} Product</h2>
              <button onClick={() => setEditing(null)} className="text-muted-foreground hover:text-foreground">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              <Field label="Name" value={editing.name ?? ""} onChange={(v) => setEditing({ ...editing, name: v })} />
              <Field label="Description" value={editing.description ?? ""} onChange={(v) => setEditing({ ...editing, description: v })} textarea />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Price (ETB)" type="number" value={editing.price ?? 0} onChange={(v) => setEditing({ ...editing, price: Number(v) })} />
                <Field label="Stock" type="number" value={editing.stock ?? 0} onChange={(v) => setEditing({ ...editing, stock: Number(v) })} />
              </div>
              <Field label="Size" value={editing.size ?? ""} onChange={(v) => setEditing({ ...editing, size: v })} />
              <div className="grid grid-cols-3 gap-3">
                <SelectField label="Category" value={editing.category ?? ""} options={["complexion", "color", "body", "age"]} onChange={(v) => setEditing({ ...editing, category: v })} />
                <SelectField label="Gender" value={editing.gender ?? ""} options={["all", "women", "men"]} onChange={(v) => setEditing({ ...editing, gender: v })} />
                <SelectField label="Age" value={editing.age ?? ""} options={["teen", "adult", "mature"]} onChange={(v) => setEditing({ ...editing, age: v })} />
              </div>
              <SelectField label="Body Part" value={editing.bodyPart ?? ""} options={["face", "lips", "eyes", "body"]} onChange={(v) => setEditing({ ...editing, bodyPart: v })} />

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editing.isNew ?? false}
                  onChange={(e) => setEditing({ ...editing, isNew: e.target.checked })}
                  className="rounded border-border"
                />
                <span className="text-xs uppercase tracking-widest text-muted-foreground">New arrival</span>
              </label>

              {/* Image */}
              <div>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">Image</span>
                {editing.imageUrl && (
                  <img src={editing.imageUrl} alt="" className="w-24 h-30 object-cover rounded-xl mb-2" />
                )}
                <label className="block">
                  <span className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition">
                    {uploading ? "Uploading..." : "Choose image"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = await handleImageUpload(file);
                        if (url) setEditing({ ...editing, imageUrl: url });
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setEditing(null)}
                className="flex-1 py-3 rounded-full border border-border text-xs uppercase tracking-widest hover:bg-stone-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || uploading || !editing.name}
                className="flex-1 py-3 rounded-full bg-foreground text-background text-xs uppercase tracking-widest font-medium hover:opacity-90 transition disabled:opacity-50"
              >
                {saving ? "Saving..." : editing.id ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((p) => (
          <div key={p.id} className="border border-border rounded-2xl overflow-hidden bg-background group">
            <div className="relative aspect-[4/5] bg-stone-100 overflow-hidden">
              <img src={p.imageUrl || "/placeholder.jpg"} alt={p.name} className="w-full h-full object-cover" />
              {p.isNew && (
                <span className="absolute top-2 left-2 bg-background/90 backdrop-blur px-2 py-0.5 rounded-full text-[9px] uppercase tracking-widest">
                  New
                </span>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setEditing({ ...p })}
                  className="px-3 py-1.5 rounded-full bg-background text-xs font-medium hover:bg-white transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(p.id, p.name)}
                  className="px-3 py-1.5 rounded-full bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition"
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="p-3">
              <h3 className="text-xs font-medium truncate">{p.name}</h3>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs tabular-nums">{fmt(p.price)}</span>
                <span className="text-[10px] text-muted-foreground">Stock: {p.stock}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  textarea = false,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  textarea?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">{label}</span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-foreground transition resize-none"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-foreground transition"
        />
      )}
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-foreground transition capitalize"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}
