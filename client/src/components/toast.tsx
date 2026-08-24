import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

type Toast = {
  id: number;
  message: string;
  type: "success" | "error" | "info";
};

type ToastCtx = {
  toast: (message: string, type?: Toast["type"]) => void;
};

const Ctx = createContext<ToastCtx | null>(null);

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`animate-slide-in-right px-5 py-3.5 rounded-2xl shadow-lg backdrop-blur-md text-sm font-medium cursor-pointer transition-opacity hover:opacity-80 ${
              t.type === "success"
                ? "bg-emerald-600/90 text-white"
                : t.type === "error"
                ? "bg-red-600/90 text-white"
                : "bg-foreground/90 text-background"
            }`}
            onClick={() => dismiss(t.id)}
          >
            {t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useToast must be used within ToastProvider");
  return v;
}
