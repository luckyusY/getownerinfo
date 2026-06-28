"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { Home, Mail, Phone, Search, Lock, User } from "lucide-react";
import { FormField, SegmentedControl, SelectInput, SubmitButton, TextInput } from "@/components/ui/Form";
import GoogleAuthButton from "@/components/GoogleAuthButton";
import GoogleOneTap from "@/components/GoogleOneTap";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: searchParams.get("role") === "owner" ? "owner" : "buyer",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    router.prefetch("/dashboard");
  }, [router]);

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
      toast("Account created - welcome!", { type: "success" });
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
      <GoogleOneTap role={form.role} />
      <div className="w-full max-w-xl">
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
            <p className="eyebrow">Join the marketplace</p>
            <h1 className="mt-1 font-display text-2xl font-bold text-ink">Create your account</h1>
            <p className="mt-1 text-sm text-ink-soft">Start as a buyer or list verified property and assets directly.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Full name" required>
              <TextInput
                icon={User}
                required
                placeholder="Your full name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </FormField>
            <FormField label="Phone">
              <TextInput
                icon={Phone}
                placeholder="+250 ..."
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </FormField>
          </div>
          <FormField label="Email" required>
            <TextInput
              icon={Mail}
              type="email"
              required
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </FormField>
          <FormField label="Password" hint="At least 8 characters." required>
            <TextInput
              icon={Lock}
              type="password"
              required
              minLength={8}
              placeholder="Create a strong password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </FormField>
          <FormField label="I want to">
            <SegmentedControl
              value={form.role}
              onChange={(role) => setForm({ ...form, role })}
              options={[
                { value: "buyer", label: "Find, rent, or buy", description: "Unlock verified owner contacts.", icon: Search },
                { value: "owner", label: "List property or assets", description: "Publish and manage listings.", icon: Home },
              ]}
            />
          </FormField>

          <GoogleAuthButton role={form.role} label="Sign up with Google" />
          <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wide text-ink-faint">
            <span className="h-px flex-1 bg-line" /> Or use email <span className="h-px flex-1 bg-line" />
          </div>

          <SubmitButton type="submit" loading={loading} className="w-full">
            {loading ? "Creating account..." : "Create account"}
          </SubmitButton>

          <p className="text-center text-sm text-ink-soft">
            Already registered?{" "}
            <Link href="/login" className="font-bold text-brand hover:text-brand-dark">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
