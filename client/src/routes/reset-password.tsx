import { Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/toast";
import { Lock, CheckCircle2 } from "lucide-react";

export function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Read token from query params: ?token=...
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (t) {
      setToken(t);
    } else {
      setError("Missing or invalid password reset token. Please request a new link.");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!token) {
      setError("Missing reset token. Please request a new password reset link.");
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword(newPassword, token);
      setSuccess(true);
      toast("Password reset successfully!", "success");
      setTimeout(() => {
        navigate({ to: "/login" });
      }, 2500);
    } catch (err: any) {
      setError(err.message || "Failed to reset password. The link may have expired.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="px-4 md:px-8 py-16 md:py-24 animate-page-in">
        <div className="mx-auto max-w-md">
          {success ? (
            <div className="text-center p-8 rounded-3xl border border-border bg-stone-50/50">
              <div className="size-14 mx-auto mb-4 rounded-full bg-emerald-50 text-emerald-600 grid place-items-center">
                <CheckCircle2 size={28} />
              </div>
              <h1 className="font-display text-3xl italic mb-3">Password updated</h1>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Your password has been changed successfully. Redirecting you to sign in...
              </p>
              <Link
                to="/login"
                className="inline-flex px-7 py-3.5 bg-foreground text-background rounded-full text-xs uppercase tracking-widest"
              >
                Sign in now
              </Link>
            </div>
          ) : (
            <div>
              <div className="mb-10 text-center">
                <p className="text-[10px] uppercase tracking-[0.25em] text-accent mb-3">Security</p>
                <h1 className="font-display text-4xl md:text-5xl italic">Set new password</h1>
                <p className="text-sm text-muted-foreground mt-3">
                  Create a new secure password for your Cosmot account.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <label className="block">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">New password</span>
                  <div className="relative mt-1">
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full px-4 py-3.5 pr-10 rounded-xl bg-stone-50 border border-border text-sm focus:outline-none focus:border-foreground transition"
                    />
                    <Lock size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </label>

                <label className="block">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Confirm password</span>
                  <div className="relative mt-1">
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full px-4 py-3.5 pr-10 rounded-xl bg-stone-50 border border-border text-sm focus:outline-none focus:border-foreground transition"
                    />
                    <Lock size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={submitting || !token}
                  className="w-full bg-foreground text-background py-4 rounded-full text-xs font-medium uppercase tracking-[0.2em] hover:opacity-90 transition disabled:opacity-50"
                >
                  {submitting ? "Resetting..." : "Save new password"}
                </button>
              </form>

              <p className="mt-8 text-center text-sm text-muted-foreground">
                <Link to="/login" className="text-accent hover:underline">
                  Back to sign in
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
