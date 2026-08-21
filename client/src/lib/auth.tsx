import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api } from "./api";

type User = {
  id: string;
  email: string;
  name: string | null;
  role: string;
};

type AuthCtx = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("cosmot-token");
    const savedUser = localStorage.getItem("cosmot-user");

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    localStorage.setItem("cosmot-token", res.accessToken);
    localStorage.setItem("cosmot-user", JSON.stringify(res.user));
    setToken(res.accessToken);
    setUser(res.user);
  };

  const register = async (email: string, password: string, name?: string) => {
    const res = await api.register({ email, password, name });
    localStorage.setItem("cosmot-token", res.accessToken);
    localStorage.setItem("cosmot-user", JSON.stringify(res.user));
    setToken(res.accessToken);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem("cosmot-token");
    localStorage.removeItem("cosmot-user");
    setToken(null);
    setUser(null);
  };

  return (
    <Ctx.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}
