import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api } from "./api";

export type ApiProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  imageUrl: string | null;
  category: string | null;
  gender: string | null;
  age: string | null;
  bodyPart: string | null;
  size: string | null;
  isNew: boolean | null;
};

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
      .getProducts()
      .then(setProducts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const productMap = new Map(products.map((p) => [p.id, p]));

  return (
    <Ctx.Provider value={{ products, productMap, loading, error }}>
      {children}
    </Ctx.Provider>
  );
}

export function useProducts() {
  return useContext(Ctx);
}
