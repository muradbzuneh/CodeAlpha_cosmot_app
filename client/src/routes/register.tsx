import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { useAuth } from "@/lib/auth";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await register(email, password, name || undefined);
      navigate({ to: "/" });
    } catch (err: any) {
      setError(err.message || "Registration failed");
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
            <p className="text-[10px] uppercase tracking-[0.25em] text-accent mb-3">Join Cosmot</p>
            <h1 className="font-display text-4xl md:text-5xl italic">Create account</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                {error}
              </div>
            )}

            <label className="block">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="mt-1 w-full px-4 py-3.5 rounded-xl bg-stone-50 border border-border text-sm focus:outline-none focus:border-foreground transition"
              />
            </label>

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
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="mt-1 w-full px-4 py-3.5 rounded-xl bg-stone-50 border border-border text-sm focus:outline-none focus:border-foreground transition"
              />
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-foreground text-background py-4 rounded-full text-xs font-medium uppercase tracking-[0.2em] hover:opacity-90 transition disabled:opacity-50"
            >
              {submitting ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-foreground font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
