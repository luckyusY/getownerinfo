"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "buyer",
  });
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.success) {
        const detail = json.issues
          ? Object.values(json.issues).flat().join(", ")
          : json.error;
        throw new Error(detail || "Registration failed");
      }
      toast("Account created — welcome!", { type: "success" });
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
          <h1 className="font-display text-2xl font-bold text-ink">Create your account</h1>

          <div>
            <label className="label">Full name</label>
            <input
              required
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
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
            <label className="label">Phone</label>
            <input
              className="input"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              required
              minLength={8}
              className="input"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <p className="mt-1 text-xs text-ink-faint">At least 8 characters.</p>
          </div>
          <div>
            <label className="label">I want to</label>
            <select
              className="input"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="buyer">Find / rent / buy (Buyer)</option>
              <option value="owner">List my property or assets (Owner)</option>
            </select>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Creating account…" : "Create account"}
          </button>

          <p className="text-center text-sm text-ink-soft">
            Already registered?{" "}
            <Link href="/login" className="font-medium text-brand">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
