"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { FormField, TextInput, SubmitButton } from "@/components/ui/Form";
import GoogleAuthButton from "@/components/GoogleAuthButton";
import GoogleOneTap from "@/components/GoogleOneTap";
import AuthShell, { AuthAlert, AuthDivider } from "@/components/auth/AuthShell";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  // Kept on the page as well as toasted: a toast is gone in a few seconds,
  // and "why did that not work" should still be readable when you look back.
  const [error, setError] = useState("");

  // Where to land after signing in. The bottom tab bar sends signed-out
  // visitors here with ?next=, so they end up where they tapped. Only
  // same-site paths are accepted: anything else (a full URL, or "//evil.com",
  // which new URL() would read as another origin) falls back to the dashboard.
  const next = searchParams.get("next");
  const destination = next && /^\/(?!\/)/.test(next) ? next : "/dashboard";

  useEffect(() => {
    router.prefetch(destination);
  }, [router, destination]);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json().catch(() => null);
      if (!json?.success) {
        throw new Error(json?.error || "We could not sign you in right now. Please try again.");
      }
      toast("Welcome back!", { type: "success" });
      router.push(destination);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back to the people who actually own it."
      lead="Sign in to manage your listings, unlocked contacts, messages and payments in one place."
    >
      <GoogleOneTap />

      <div className="rise space-y-5">
        <div>
          <p className="eyebrow">Secure access</p>
          <h1 className="mt-1 font-display text-3xl font-bold text-ink">Sign in</h1>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
            New here?{" "}
            <Link href="/register" className="font-bold text-brand underline-offset-4 hover:underline">
              Create an account
            </Link>
          </p>
        </div>

        <AuthAlert>{error || searchParams.get("error")}</AuthAlert>

        <GoogleAuthButton />
        <AuthDivider>or with email</AuthDivider>

        <form onSubmit={onSubmit} className="space-y-1" noValidate={false}>
          <FormField label="Email" required>
            <TextInput
              icon={Mail}
              type="email"
              required
              autoComplete="email"
              inputMode="email"
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
              autoComplete="current-password"
              value={form.password}
              placeholder="Enter your password"
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </FormField>

          <SubmitButton type="submit" loading={loading} className="!mt-2 w-full !min-h-12 !text-base">
            {loading ? "Signing in..." : (<>Sign in <ArrowRight className="h-4 w-4" /></>)}
          </SubmitButton>
        </form>

        <p className="flex items-center justify-center gap-2 text-center text-xs font-semibold text-ink-faint">
          <Lock className="h-3.5 w-3.5" /> Owner details stay protected until you pay the token fee.
        </p>
      </div>
    </AuthShell>
  );
}
