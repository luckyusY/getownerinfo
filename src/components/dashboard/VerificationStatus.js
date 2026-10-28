import Link from "next/link";
import { ChevronRight, Fingerprint, Mail, Phone, ScanFace } from "lucide-react";

const DOC_LABEL = {
  national_id: "National ID",
  passport: "Passport",
  driving_licence: "Driving licence",
};

const STATE = {
  verified: { label: "Verified", className: "bg-emerald-50 text-emerald-700" },
  completed: { label: "Completed", className: "bg-emerald-50 text-emerald-700" },
  pending: { label: "In review", className: "bg-amber-50 text-amber-700" },
  rejected: { label: "Rejected", className: "bg-red-50 text-red-700" },
  none: { label: "Not verified", className: "bg-panel text-ink-soft" },
};

export default function VerificationStatus({ user }) {
  const kycStatus = user.kyc?.status || "none";

  const rows = [
    {
      key: "email",
      icon: Mail,
      title: "Email Address",
      detail: user.email,
      state: user.emailVerifiedAt ? "verified" : "none",
      href: "/dashboard/profile#verification",
    },
    {
      key: "phone",
      icon: Phone,
      title: "Phone Number",
      detail: user.phone || "No phone number yet",
      state: user.phoneVerifiedAt ? "verified" : "none",
      href: "/dashboard/profile#verification",
    },
    {
      key: "identity",
      icon: Fingerprint,
      title: "Identity Document",
      detail: DOC_LABEL[user.kyc?.docType] || "Not submitted",
      state: kycStatus === "approved" ? "verified" : kycStatus === "none" ? "none" : kycStatus,
      href: "/dashboard/profile#verification",
    },
    {
      key: "face",
      icon: ScanFace,
      title: "Face Verification",
      detail: "Live selfie check",
      // No capture flow exists yet, so this never reports as done.
      state: "none",
      href: "/dashboard/profile#verification",
    },
  ];

  return (
    <section className="rounded-2xl border border-line bg-surface p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold text-ink">Verification Status</h2>
        <Link href="/dashboard/profile#verification" className="text-sm font-bold text-brand hover:text-brand-dark">
          View
        </Link>
      </div>

      <ul className="mt-3 divide-y divide-line">
        {rows.map(({ key, icon: Icon, title, detail, state, href }) => {
          const badge = STATE[state] || STATE.none;
          const done = state === "verified" || state === "completed";
          return (
            <li key={key}>
              <Link href={href} className="flex items-center gap-3 py-3 transition hover:bg-paper">
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                    done ? "bg-emerald-50 text-emerald-600" : "bg-panel text-ink-soft"
                  }`}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-ink">{title}</span>
                  <span className="block truncate text-xs font-semibold text-ink-faint">{detail}</span>
                </span>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black ${badge.className}`}>
                  {badge.label}
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-ink-faint" />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
