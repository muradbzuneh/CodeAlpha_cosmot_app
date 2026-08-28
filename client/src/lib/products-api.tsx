import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, type ApiProduct } from "./api";

export type { ApiProduct };

type ProductCtx = {
  products: ApiProduct[];
  productMap: Map<string, ApiProduct>;
  loading: boolean;
  error: string | null;
};

const Ctx = createContext<ProductCtx>({
  products: [],
  productMap: new Map(),
  loading: true,
  error: null,
});

export function ProductProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getProducts({ limit: 100 })
      .then((res) => setProducts(res.products))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  return (
    <Ctx.Provider value={{ products, productMap, loading, error }}>
      {children}
    </Ctx.Provider>
  );
}

export function useProducts() {
  return useContext(Ctx);
}
