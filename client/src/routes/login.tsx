import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { useAuth } from "@/lib/auth";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate({ to: "/" });
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="px-4 md:px-8 py-16 md:py-24">
        <div className="mx-auto max-w-md">
          <div className="mb-10 text-center">
            <p className="text-[10px] uppercase tracking-[0.25em] text-accent mb-3">Welcome back</p>
            <h1 className="font-display text-4xl md:text-5xl italic">Sign in</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                {error}
              </div>
            )}

            <label className="block">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@cosmot.et"
                className="mt-1 w-full px-4 py-3.5 rounded-xl bg-stone-50 border border-border text-sm focus:outline-none focus:border-foreground transition"
              />
            </label>

            <label className="block">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Password</span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="mt-1 w-full px-4 py-3.5 rounded-xl bg-stone-50 border border-border text-sm focus:outline-none focus:border-foreground transition"
              />
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-foreground text-background py-4 rounded-full text-xs font-medium uppercase tracking-[0.2em] hover:opacity-90 transition disabled:opacity-50"
            >
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/register" className="text-foreground font-medium hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
