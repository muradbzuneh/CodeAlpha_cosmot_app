import { Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, setUser } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/login" });
      return;
    }
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
    }
  }, [isAuthenticated, user, navigate]);

  if (!isAuthenticated) return null;

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setSaving(true);
    try {
      const updated = await api.updateProfile({ name, email });
      setUser(updated);
      setMsg({ type: "ok", text: "Profile updated." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setMsg({ type: "err", text: err.message || "Failed to update profile" });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (newPassword !== confirmPassword) {
      setMsg({ type: "err", text: "New passwords do not match." });
      return;
    }
    if (newPassword.length < 6) {
      setMsg({ type: "err", text: "Password must be at least 6 characters." });
      return;
    }
    setSaving(true);
    try {
      await api.updateProfile({ currentPassword, newPassword });
      setMsg({ type: "ok", text: "Password changed." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setMsg({ type: "err", text: err.message || "Failed to change password" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="px-4 md:px-8 py-12 md:py-16">
        <div className="mx-auto max-w-xl">
          <header className="mb-10">
            <p className="text-[10px] uppercase tracking-[0.25em] text-accent mb-3">Your account</p>
            <h1 className="font-display text-4xl md:text-5xl italic">Profile</h1>
          </header>

          {msg && (
            <div className={`mb-6 px-4 py-3 rounded-xl text-sm ${
              msg.type === "ok"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}>
              {msg.text}
            </div>
          )}

          {/* Profile Info */}
          <section className="mb-10">
            <h2 className="font-display text-2xl italic mb-5">Personal Info</h2>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <label className="block">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Name</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full px-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:border-foreground transition"
                  placeholder="Your name"
                />
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 w-full px-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:border-foreground transition"
                  placeholder="you@cosmot.et"
                />
              </label>
              <p className="text-[10px] text-muted-foreground">
                Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
              </p>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 rounded-full bg-foreground text-background text-xs uppercase tracking-widest font-medium hover:opacity-90 transition disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </form>
          </section>

          {/* Password */}
          <section className="mb-10">
            <h2 className="font-display text-2xl italic mb-5">Change Password</h2>
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <label className="block">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Current password</span>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="mt-1 w-full px-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:border-foreground transition"
                  placeholder="Enter current password"
                />
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">New password</span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 w-full px-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:border-foreground transition"
                  placeholder="Min. 6 characters"
                />
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Confirm new password</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 w-full px-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:border-foreground transition"
                  placeholder="Repeat new password"
                />
              </label>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 rounded-full border border-foreground text-xs uppercase tracking-widest font-medium hover:bg-foreground hover:text-background transition disabled:opacity-50"
              >
                {saving ? "Updating..." : "Change password"}
              </button>
            </form>
          </section>

          <Link
            to="/"
            className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            Back to shop
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
