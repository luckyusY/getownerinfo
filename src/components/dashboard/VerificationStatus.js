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
      // The live selfie is a required part of the identity submission, so it
      // shares that submission's state. It used to be pinned to "Not verified",
      // which told a fully approved owner they still had a step outstanding.
      state: kycStatus === "approved" ? "verified" : kycStatus === "none" ? "none" : kycStatus,
      href: "/dashboard/profile#verification",
    },
  ];

  const doneCount = rows.filter((r) => r.state === "verified" || r.state === "completed").length;
  const allDone = doneCount === rows.length;

  return (
    <section className="card !p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold text-ink">Verification Status</h2>
        <Link href="/dashboard/profile#verification" className="inline-flex min-h-11 items-center text-sm font-bold text-brand hover:text-brand-dark">
          {allDone ? "View" : "Continue"}
        </Link>
      </div>

      {/* How far along, before the detail: four rows of badges made the reader
          count them to learn whether they were finished. */}
      <div className="mt-1">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-ink-soft">
            {allDone ? "All steps complete" : `${doneCount} of ${rows.length} steps complete`}
          </span>
          <span className="stat-figure text-ink-faint">{Math.round((doneCount / rows.length) * 100)}%</span>
        </div>
        <div
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-panel"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={rows.length}
          aria-valuenow={doneCount}
          aria-label="Verification progress"
        >
          <div
            className={`h-full rounded-full transition-all duration-500 ${allDone ? "bg-emerald-500" : "bg-brand"}`}
            style={{ width: `${(doneCount / rows.length) * 100}%` }}
          />
        </div>
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
