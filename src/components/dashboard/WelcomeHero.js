import Link from "next/link";
import { ArrowRight, BadgeCheck, ShieldAlert } from "lucide-react";

/** Masthead for the dashboard: who you are and whether you are verified. */
export default function WelcomeHero({ user }) {
  const verified = Boolean(user.isVerified);
  // "Verification pending" used to show for everyone unverified, including
  // people who had never submitted anything. It read as "we are on it" when in
  // fact nothing would happen until they acted.
  const inReview = !verified && user.kyc?.status === "pending";
  const rejected = !verified && user.kyc?.status === "rejected";
  const statusLabel = verified
    ? "Verified Owner"
    : inReview
      ? "Verification in review"
      : rejected
        ? "Verification needs attention"
        : "Not verified yet";
  const needsAction = !verified && !inReview;

  return (
    <section className="relative isolate overflow-hidden rounded-2xl border border-line shadow-soft">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {/* Same reasoning as the public hero: this is the LCP element of the
          dashboard's first screen. */}
      <img
        src="/hero-slides/kigali-owner-secure.webp"
        alt=""
        aria-hidden="true"
        fetchPriority="high"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/90 to-navy/35" />

      <div className="relative px-5 py-7 sm:px-8 sm:py-10">
        <p className="text-sm font-bold text-white/80">Welcome back,</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-white sm:text-4xl">{user.name}</h1>
        <p className="mt-2 max-w-md text-sm font-semibold text-white/80">
          Manage your listings, requests, messages and more.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold ${
              verified ? "bg-emerald-700 text-white" : "bg-amber-400 text-amber-950"
            }`}
          >
            {verified ? <BadgeCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
            {statusLabel}
          </span>
          <Link
            href={needsAction ? "/dashboard/profile#verification" : "/dashboard/profile"}
            className="inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-white underline-offset-4 transition hover:text-sky-light hover:underline"
          >
            {needsAction ? "Get verified" : "View Profile"} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
