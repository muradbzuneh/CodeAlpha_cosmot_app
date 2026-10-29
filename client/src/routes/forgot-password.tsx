import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { useAuth } from "@/lib/auth";
import { Mail, CheckCircle2 } from "lucide-react";

export function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await forgotPassword(email);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Failed to send reset email. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="px-4 md:px-8 py-16 md:py-24 animate-page-in">
        <div className="mx-auto max-w-md">
          {submitted ? (
            <div className="text-center p-8 rounded-3xl border border-border bg-stone-50/50">
              <div className="size-14 mx-auto mb-4 rounded-full bg-emerald-50 text-emerald-600 grid place-items-center">
                <CheckCircle2 size={28} />
              </div>
              <h1 className="font-display text-3xl italic mb-3">Check your inbox</h1>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                If an account exists for <span className="text-foreground font-medium">{email}</span>, we've sent instructions to reset your password.
              </p>
              <div className="space-y-3">
                <Link
                  to="/login"
                  className="block w-full py-3.5 rounded-full bg-foreground text-background text-xs font-medium uppercase tracking-[0.2em] hover:opacity-90 transition text-center"
                >
                  Return to sign in
                </Link>
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-xs text-muted-foreground hover:text-foreground transition underline"
                >
                  Didn't receive it? Try another email
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-10 text-center">
                <p className="text-[10px] uppercase tracking-[0.25em] text-accent mb-3">Security</p>
                <h1 className="font-display text-4xl md:text-5xl italic">Forgot password?</h1>
                <p className="text-sm text-muted-foreground mt-3">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <label className="block">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Email address</span>
                  <div className="relative mt-1">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@cosmot.et"
                      className="w-full px-4 py-3.5 pr-10 rounded-xl bg-stone-50 border border-border text-sm focus:outline-none focus:border-foreground transition"
                    />
                    <Mail size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-foreground text-background py-4 rounded-full text-xs font-medium uppercase tracking-[0.2em] hover:opacity-90 transition disabled:opacity-50"
                >
                  {submitting ? "Sending link..." : "Send reset link"}
                </button>
              </form>

              <p className="mt-8 text-center text-sm text-muted-foreground">
                Remember your password?{" "}
                <Link to="/login" className="text-foreground font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
