"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, Mail, Phone, User as UserIcon, Calendar, ShieldAlert } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import Link from "next/link";
import { isValidRwandaPhone } from "@/lib/phone";

const ROLE_LABELS = {
  admin: "Administrator",
  platform_listing_manager: "Listing Manager",
  owner: "Owner",
  agent: "Agent",
  buyer: "Buyer / Tenant",
};

export default function ProfilePage() {
  const { toast } = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  async function load() {
    try {
      const res = await fetch("/api/profile");
      const j = await res.json();
      if (j.success) {
        setProfile(j.data);
        setName(j.data.name || "");
        setPhone(j.data.phone || "");
        setLoadError(false);
      } else setLoadError(true);
    } catch { setLoadError(true); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.error);
      toast("Profile updated", { type: "success" });
      setProfile((p) => ({ ...p, name: j.data.name, phone: j.data.phone }));
    } catch (err) {
      toast(err.message || "Update failed", { type: "error" });
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="mt-10 flex items-center justify-center">
        <p className="text-sm font-semibold text-ink-soft">Loading profile…</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="card !p-6">
        <h1 className="font-display text-xl font-bold text-ink">Profile unavailable</h1>
        <p className="mt-2 text-sm text-ink-soft">
          {loadError ? "We couldn’t load your profile. Check your connection and try again." : "Your profile could not be found."}
        </p>
        <button type="button" onClick={() => { setLoading(true); load(); }} className="btn-outline mt-4">Try again</button>
      </div>
    );
  }

  const initials = profile.name?.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "?";
  const profileItems = [profile.name, profile.email, profile.phone].filter(Boolean).length;
  const profilePercent = Math.round((profileItems / 3) * 100);
  const memberSince = profile.createdAt ? new Date(profile.createdAt).toLocaleDateString("en-GB", { year: "numeric", month: "long" }) : "—";
  const isOwnerOrAgent = ["owner", "agent"].includes(profile.role);
  const invalidPhone = Boolean(phone && !isValidRwandaPhone(phone));

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-ink">My Profile</h1>
        <p className="mt-1 text-sm text-ink-soft">Manage your account information.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Left column — avatar + meta */}
        <div className="space-y-4">
          {/* Avatar card */}
          <section className="card !p-6 flex flex-col items-center text-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-50 text-2xl font-black text-brand">
              {initials}
            </span>
            <p className="mt-3 font-display text-lg font-bold text-ink">{profile.name}</p>
            <p className="text-xs font-semibold text-ink-faint">{ROLE_LABELS[profile.role] || profile.role}</p>
            {profile.isVerified && (
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                <BadgeCheck className="h-3.5 w-3.5" /> Verified
              </span>
            )}
          </section>

          {/* Profile completeness */}
          <section className="card !p-4">
            <p className="text-xs font-black uppercase tracking-wide text-ink-faint">Profile completeness</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="font-display text-xl font-bold text-ink">{profilePercent}%</span>
              <span className="text-xs font-semibold text-ink-faint">{profileItems} / 3 fields</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-panel">
              <span className="block h-full rounded-full bg-brand transition-all" style={{ width: `${profilePercent}%` }} />
            </div>
            {!profile.phone && (
              <p className="mt-3 text-xs text-ink-soft">Add a phone number to reach 100%.</p>
            )}
          </section>

          {/* Meta info */}
          <section className="card !p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm text-ink-soft">
              <Calendar className="h-4 w-4 text-ink-faint" />
              <span>Member since {memberSince}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-ink-soft">
              <Mail className="h-4 w-4 text-ink-faint" />
              <span className="truncate">{profile.email}</span>
            </div>
            {profile.phone && (
              <div className="flex items-center gap-2 text-sm text-ink-soft">
                <Phone className="h-4 w-4 text-ink-faint" />
                <span>{profile.phone}</span>
              </div>
            )}
          </section>
        </div>

        {/* Right column — edit form + verification */}
        <div className="space-y-6">
          {/* Edit form */}
          <section className="card !p-6">
            <h2 className="font-display text-base font-bold text-ink">Personal information</h2>
            <p className="mt-1 text-sm text-ink-soft">Update your name and contact number.</p>

            <form onSubmit={save} className="mt-6 grid gap-5">
              <label className="grid gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wide text-ink-faint">Full name</span>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
                  <input
                    required
                    minLength={2}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-line bg-surface py-2.5 pl-9 pr-3 text-sm font-semibold text-ink outline-none focus:border-brand"
                    placeholder="Your full name"
                  />
                </div>
              </label>

              <label className="grid gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wide text-ink-faint">Email address</span>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
                  <input
                    readOnly
                    value={profile.email}
                    className="w-full cursor-not-allowed rounded-lg border border-line bg-panel py-2.5 pl-9 pr-3 text-sm font-semibold text-ink-faint outline-none"
                  />
                </div>
                <p className="text-[11px] text-ink-faint">Email cannot be changed.</p>
              </label>

              <label className="grid gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wide text-ink-faint">Phone number</span>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
                  <input
                    type="tel"
                    value={phone}
                    aria-invalid={invalidPhone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-lg border border-line bg-surface py-2.5 pl-9 pr-3 text-sm font-semibold text-ink outline-none focus:border-brand"
                    placeholder="+250 7XX XXX XXX"
                  />
                </div>
                <p className="text-[11px] text-ink-faint">Rwanda format: +250 7XX XXX XXX or 07XX XXX XXX.</p>
                {invalidPhone && <p role="alert" className="text-xs font-semibold text-red-700">Enter a valid Rwanda mobile number.</p>}
              </label>

              <div className="flex items-center gap-3 pt-1">
                <button type="submit" disabled={busy || invalidPhone} className="btn-primary">
                  {busy ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </section>

          {/* Verification section — only for owners/agents */}
          {isOwnerOrAgent && (
            <section className="card !p-6">
              <h2 className="font-display text-base font-bold text-ink">Identity verification</h2>
              {profile.isVerified ? (
                <div className="mt-3 flex items-center gap-3 rounded-lg bg-emerald-50 px-4 py-3">
                  <BadgeCheck className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="text-sm font-bold text-emerald-800">Your identity is verified</p>
                    <p className="text-xs text-emerald-700">Your listings display a verified badge to buyers.</p>
                  </div>
                </div>
              ) : (
                <div className="mt-3">
                  <div className="flex items-start gap-3 rounded-lg bg-amber-50 px-4 py-3">
                    <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                    <div>
                      <p className="text-sm font-bold text-amber-800">
                        {profile.kycStatus === "pending" ? "Verification under review" : "Not yet verified"}
                      </p>
                      <p className="text-xs text-amber-700">
                        {profile.kycStatus === "pending"
                          ? "Your documents have been submitted and are being reviewed."
                          : "Verified owners get significantly more unlocks from buyers."}
                      </p>
                    </div>
                  </div>
                  {profile.kycStatus !== "pending" && (
                    <Link href="/dashboard/owner" className="btn-outline mt-4 inline-flex">
                      Submit verification documents →
                    </Link>
                  )}
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
