"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Login failed");
      toast("Welcome back!", { type: "success" });
      // Route to a generic dashboard entry that redirects by role.
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      toast(err.message, { type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-base font-bold text-white">g</span>
          <span className="font-display text-xl font-bold text-ink">getowner<span className="text-brand">info</span></span>
        </Link>
        <form onSubmit={onSubmit} className="card space-y-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">Welcome back</h1>
            <p className="mt-1 text-sm text-ink-soft">Sign in to manage your listings and unlocks.</p>
          </div>

          <div>
            <label className="label">Email</label>
            <input
              type="email"
              required
              className="input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              required
              className="input"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <p className="text-center text-sm text-ink-soft">
            No account?{" "}
            <Link href="/register" className="font-semibold text-brand">
              Create one
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
