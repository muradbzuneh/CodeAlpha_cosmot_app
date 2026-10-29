import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { authClient, requestPasswordReset, resetPassword } from "./auth-client";

export type User = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  image?: string | null;
  emailVerified?: boolean;
  createdAt?: string;
};

type AuthCtx = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (newPassword: string, token: string) => Promise<void>;
  setUser: (user: User) => void;
  isAuthenticated: boolean;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: sessionData, isPending } = authClient.useSession();
  const [localUser, setLocalUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem("cosmot-user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Sync session with local state
  useEffect(() => {
    if (sessionData?.user) {
      const u: User = {
        id: sessionData.user.id,
        email: sessionData.user.email,
        name: sessionData.user.name || null,
        role: ((sessionData.user as any).role as string) || "CUSTOMER",
        image: sessionData.user.image || null,
        emailVerified: sessionData.user.emailVerified,
        createdAt: sessionData.user.createdAt ? new Date(sessionData.user.createdAt).toISOString() : undefined,
      };
      setLocalUser(u);
      localStorage.setItem("cosmot-user", JSON.stringify(u));
      if (sessionData.session?.token) {
        localStorage.setItem("cosmot-token", sessionData.session.token);
      }
    } else if (!isPending && !sessionData) {
      setLocalUser(null);
      localStorage.removeItem("cosmot-token");
      localStorage.removeItem("cosmot-user");
    }
  }, [sessionData, isPending]);

  const login = async (email: string, password: string) => {
    const res = await authClient.signIn.email({
      email,
      password,
    });
    if (res.error) {
      throw new Error(res.error.message || "Invalid credentials");
    }
    if (res.data?.user) {
      const u: User = {
        id: res.data.user.id,
        email: res.data.user.email,
        name: res.data.user.name || null,
        role: ((res.data.user as any).role as string) || "CUSTOMER",
      };
      setLocalUser(u);
      localStorage.setItem("cosmot-user", JSON.stringify(u));
    }
    if ((res.data as any)?.token) {
      localStorage.setItem("cosmot-token", (res.data as any).token);
    }
  };

  const register = async (email: string, password: string, name?: string) => {
    const res = await authClient.signUp.email({
      email,
      password,
      name: name || "",
    });
    if (res.error) {
      throw new Error(res.error.message || "Failed to create account");
    }
    if (res.data?.user) {
      const u: User = {
        id: res.data.user.id,
        email: res.data.user.email,
        name: res.data.user.name || null,
        role: ((res.data.user as any).role as string) || "CUSTOMER",
      };
      setLocalUser(u);
      localStorage.setItem("cosmot-user", JSON.stringify(u));
    }
    if ((res.data as any)?.token) {
      localStorage.setItem("cosmot-token", (res.data as any).token);
    }
  };

  const logout = async () => {
    await authClient.signOut();
    localStorage.removeItem("cosmot-token");
    localStorage.removeItem("cosmot-user");
    localStorage.removeItem("cosmot-cart-v1");
    localStorage.removeItem("cosmot-promo-v1");
    setLocalUser(null);
  };

  const handleForgotPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/reset-password`;
    const res = await requestPasswordReset({
      email,
      redirectTo: redirectUrl,
    });
    if (res.error) {
      throw new Error(res.error.message || "Failed to send reset link");
    }
  };

  const handleResetPassword = async (newPassword: string, token: string) => {
    const res = await resetPassword({
      newPassword,
      token,
    });
    if (res.error) {
      throw new Error(res.error.message || "Failed to reset password");
    }
  };

  const activeUser = localUser || (sessionData?.user ? {
    id: sessionData.user.id,
    email: sessionData.user.email,
    name: sessionData.user.name || null,
    role: ((sessionData.user as any).role as string) || "CUSTOMER",
  } : null);

  return (
    <Ctx.Provider
      value={{
        user: activeUser,
        token: localStorage.getItem("cosmot-token"),
        loading: isPending && !localUser,
        login,
        register,
        logout,
        forgotPassword: handleForgotPassword,
        resetPassword: handleResetPassword,
        setUser: (u: User) => {
          setLocalUser(u);
          localStorage.setItem("cosmot-user", JSON.stringify(u));
        },
        isAuthenticated: !!activeUser,
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
