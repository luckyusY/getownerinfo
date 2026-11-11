"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { ArrowRight, Check, Home, Lock, Mail, Phone, Search, User } from "lucide-react";
import { FormField, SegmentedControl, SubmitButton, TextInput } from "@/components/ui/Form";
import GoogleAuthButton from "@/components/GoogleAuthButton";
import GoogleOneTap from "@/components/GoogleOneTap";
import AuthShell, { AuthAlert, AuthDivider } from "@/components/auth/AuthShell";
import { isValidRwandaPhone } from "@/lib/phone";

const PASSWORD_RULES = [
  ["8+ characters", (p) => p.length >= 8],
  ["Uppercase", (p) => /[A-Z]/.test(p)],
  ["Lowercase", (p) => /[a-z]/.test(p)],
  ["Number", (p) => /[0-9]/.test(p)],
  ["Symbol", (p) => /[^A-Za-z0-9]/.test(p)],
];

const STRENGTH = [
  { label: "", bar: "bg-line" },
  { label: "Too weak", bar: "bg-red-500" },
  { label: "Weak", bar: "bg-red-500" },
  { label: "Getting there", bar: "bg-amber-500" },
  { label: "Almost", bar: "bg-amber-500" },
  { label: "Strong", bar: "bg-emerald-600" },
];

/** Field-level problems, in the order the fields appear on the page. */
function validate(form) {
  const errors = {};
  if (form.name.trim().length < 2) errors.name = "Enter your full name.";
  if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = "Enter a valid email address.";
  if (form.phone && !isValidRwandaPhone(form.phone)) {
    errors.phone = "Enter a valid Rwanda mobile number, or leave it empty.";
  }
  const missing = PASSWORD_RULES.filter(([, test]) => !test(form.password)).map(([label]) => label.toLowerCase());
  if (missing.length) errors.password = `Still needed: ${missing.join(", ")}.`;
  if (!form.passwordConfirm) errors.passwordConfirm = "Type your password again.";
  else if (form.password !== form.passwordConfirm) errors.passwordConfirm = "The two passwords do not match.";
  return errors;
}

const FIELD_ORDER = ["name", "phone", "email", "password", "passwordConfirm"];

// The API reports problems per field; show them on the field they belong to.
const SERVER_FIELD_LABEL = { name: "Name", email: "Email", phone: "Phone", password: "Password", passwordConfirm: "Password" };

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const formRef = useRef(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    passwordConfirm: "",
    role: searchParams.get("role") === "owner" ? "owner" : "buyer",
  });
  const [loading, setLoading] = useState(false);
  // Errors are held back until the first attempt to submit. Before that the
  // form is quiet; after it, every field reports as you fix it.
  const [attempted, setAttempted] = useState(false);
  const [serverError, setServerError] = useState("");
  const [serverFields, setServerFields] = useState({});

  const clientErrors = validate(form);
  const errors = attempted ? { ...serverFields, ...clientErrors } : {};
  const passed = PASSWORD_RULES.map(([, test]) => test(form.password));
  const score = form.password ? passed.filter(Boolean).length : 0;
  const passwordsMatch = form.passwordConfirm.length > 0 && form.password === form.passwordConfirm;

  useEffect(() => {
    router.prefetch("/dashboard");
  }, [router]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    if (serverFields[field]) setServerFields((s) => ({ ...s, [field]: undefined }));
  }

  function focusFirst(problems) {
    const first = FIELD_ORDER.find((name) => problems[name]);
    if (first) formRef.current?.querySelector(`[name="${first}"]`)?.focus();
  }

  async function onSubmit(e) {
    e.preventDefault();
    setAttempted(true);
    setServerError("");

    // The button is never disabled. It used to stay grey until every password
    // rule passed and both passwords matched, with nothing on the page saying
    // so — pressing it did nothing at all, which read as "sign-up is broken".
    // Now a press always answers: either the account is created, or the first
    // field with a problem takes focus and says what it needs.
    if (Object.keys(clientErrors).length) {
      focusFirst(clientErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, name: form.name.trim(), email: form.email.trim() }),
      });
      const json = await res.json().catch(() => null);

      if (!json?.success) {
        if (json?.issues) {
          const fields = {};
          for (const [key, messages] of Object.entries(json.issues)) {
            if (messages?.length) fields[key] = `${SERVER_FIELD_LABEL[key] || key}: ${messages[0]}`;
          }
          setServerFields(fields);
          focusFirst(fields);
          throw new Error("Please check the highlighted fields.");
        }
        if (res.status === 409) {
          setServerFields({ email: "An account with this email already exists." });
          focusFirst({ email: true });
          throw new Error("That email already has an account. Sign in instead, or use a different email.");
        }
        throw new Error(json?.error || "We could not create your account right now. Please try again in a moment.");
      }

      toast("Account created. Welcome!", { type: "success" });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      wide
      title="One account to find it, list it, and reach the owner."
    >
      <GoogleOneTap role={form.role} />

      <div className="rise space-y-5">
        <div>
          <p className="eyebrow">Join the marketplace</p>
          <h1 className="mt-2 font-display text-[2rem] font-extrabold text-ink">Create your account</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            It takes about a minute. Already registered?{" "}
            <Link href="/login" className="font-bold text-brand underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        <AuthAlert>{serverError || searchParams.get("error")}</AuthAlert>

        <GoogleAuthButton role={form.role} label="Sign up with Google" />
        <AuthDivider>or with email</AuthDivider>

        {/* noValidate: the browser's own bubbles would pre-empt the inline
            messages and only ever show one problem at a time. */}
        <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-1">
          <div className="grid gap-x-4 sm:grid-cols-2">
            <FormField label="Full name" required error={errors.name}>
              <TextInput
                icon={User}
                name="name"
                autoComplete="name"
                placeholder="Your full name"
                error={errors.name}
                aria-invalid={Boolean(errors.name)}
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
              />
            </FormField>
            <FormField label="Phone" hint="Optional. +250 7XX XXX XXX" error={errors.phone}>
              <TextInput
                icon={Phone}
                name="phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                placeholder="+250 7XX XXX XXX"
                error={errors.phone}
                aria-invalid={Boolean(errors.phone)}
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
              />
            </FormField>
          </div>

          <FormField label="Email" required error={errors.email}>
            <TextInput
              icon={Mail}
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="you@example.com"
              error={errors.email}
              aria-invalid={Boolean(errors.email)}
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />
          </FormField>

          <FormField label="Password" required error={errors.password}>
            <TextInput
              icon={Lock}
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="Create a strong password"
              error={errors.password}
              aria-invalid={Boolean(errors.password)}
              aria-describedby="password-rules"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
            />

            {/* Strength at a glance, then the rules as chips that tick off. */}
            <div id="password-rules" className="mt-2.5">
              <div className="flex items-center gap-3">
                <div className="grid flex-1 grid-cols-5 gap-1" aria-hidden="true">
                  {PASSWORD_RULES.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 rounded-full transition-colors duration-300 ${i < score ? STRENGTH[score].bar : "bg-line"}`}
                    />
                  ))}
                </div>
                <span className="w-24 text-right text-xs font-bold text-ink-soft" aria-live="polite">
                  {STRENGTH[score].label}
                </span>
              </div>
              <ul className="mt-2.5 flex flex-wrap gap-1.5" aria-label="Password requirements">
                {PASSWORD_RULES.map(([label], i) => (
                  <li
                    key={label}
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold transition-colors ${
                      passed[i]
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-line bg-surface text-ink-faint"
                    }`}
                  >
                    {passed[i] && <Check className="h-3 w-3" aria-hidden="true" />}
                    {label}
                    <span className="sr-only">{passed[i] ? " met" : " not met yet"}</span>
                  </li>
                ))}
              </ul>
            </div>
          </FormField>

          <FormField
            label="Confirm password"
            required
            error={errors.passwordConfirm}
            hint={passwordsMatch ? "Passwords match." : undefined}
          >
            <TextInput
              icon={Lock}
              name="passwordConfirm"
              type="password"
              autoComplete="new-password"
              placeholder="Enter your password again"
              error={errors.passwordConfirm}
              aria-invalid={Boolean(errors.passwordConfirm)}
              value={form.passwordConfirm}
              onChange={(e) => update("passwordConfirm", e.target.value)}
            />
          </FormField>

          {/* After the fields, not before them: at the top it pushed the first
              input to the bottom of a phone's first screen. */}
          <div className="pb-4 pt-1">
            <p className="label">I mainly want to</p>
            <SegmentedControl
              value={form.role}
              onChange={(role) => update("role", role)}
              // Side by side even on a phone: stacked, the two options pushed
              // the first field off the first screen.
              columns="grid-cols-2"
              options={[
                { value: "buyer", label: "Find", description: "Browse and unlock owners.", icon: Search },
                { value: "owner", label: "List", description: "Publish property or assets.", icon: Home },
              ]}
            />
            <p className="mt-2 text-xs text-ink-faint">Either way you get both. This only sets which workspace opens first.</p>
          </div>

          <SubmitButton type="submit" loading={loading} className="!mt-2 w-full !min-h-12 !text-base">
            {loading ? "Creating account..." : (<>Create account <ArrowRight className="h-4 w-4" /></>)}
          </SubmitButton>
        </form>

        <p className="text-center text-xs leading-relaxed text-ink-faint">
          By creating an account you agree to our{" "}
          <Link href="/terms" className="font-bold text-ink-soft underline-offset-4 hover:underline">Terms</Link>{" "}
          and{" "}
          <Link href="/privacy" className="font-bold text-ink-soft underline-offset-4 hover:underline">Privacy Policy</Link>.
        </p>
      </div>
    </AuthShell>
  );
}
