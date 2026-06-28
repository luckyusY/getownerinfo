"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { Mail, Lock } from "lucide-react";
import { FormField, TextInput, SubmitButton } from "@/components/ui/Form";
import GoogleAuthButton from "@/components/GoogleAuthButton";
import GoogleOneTap from "@/components/GoogleOneTap";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      toast(err.message, { type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell flex items-center justify-center py-6 sm:py-10">
      <GoogleOneTap />
      <div className="w-full max-w-md">
        {searchParams.get("error") && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {searchParams.get("error")}
          </div>
        )}
        <Link href="/" className="mb-5 flex items-center justify-center gap-2 sm:mb-6">
          <span className="flex h-16 w-[180px] items-center justify-center overflow-hidden rounded-2xl bg-white px-4 shadow-soft sm:h-20 sm:w-[210px]">
            <img src="/brand/logo-getownerinfo-cropped-white.png" alt="Get Owner Info" className="h-12 w-auto object-contain sm:h-16" />
          </span>
        </Link>
        <form onSubmit={onSubmit} className="card space-y-4 !p-5 sm:!p-7">
          <div>
            <p className="eyebrow">Secure access</p>
            <h1 className="mt-1 font-display text-2xl font-bold text-ink">Welcome back</h1>
            <p className="mt-1 text-sm text-ink-soft">Sign in to manage listings, unlocks, messages, and payments.</p>
          </div>

          <FormField label="Email" required>
            <TextInput
              icon={Mail}
              type="email"
              required
              value={form.email}
              placeholder="you@example.com"
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </FormField>
          <FormField label="Password" required>
            <TextInput
              icon={Lock}
              type="password"
              required
              value={form.password}
              placeholder="Enter your password"
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </FormField>

          <GoogleAuthButton />
          <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wide text-ink-faint">
            <span className="h-px flex-1 bg-line" /> Or use email <span className="h-px flex-1 bg-line" />
          </div>

          <SubmitButton type="submit" loading={loading} className="w-full">
            {loading ? "Signing in..." : "Sign in"}
          </SubmitButton>

          <p className="text-center text-sm text-ink-soft">
            No account?{" "}
            <Link href="/register" className="font-bold text-brand hover:text-brand-dark">
              Create one
            </Link>
          </p>
        </form>
        <p className="mt-4 text-center text-xs text-ink-faint">
          Owner details stay protected until a verified token unlock.
        </p>
      </div>
    </div>
  );
}
