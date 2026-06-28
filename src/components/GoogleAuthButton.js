import Link from "next/link";

export default function GoogleAuthButton({ role, label = "Continue with Google" }) {
  const href = role ? `/api/auth/google/start?role=${encodeURIComponent(role)}` : "/api/auth/google/start";

  return (
    <Link
      href={href}
      className="flex min-h-11 w-full items-center justify-center gap-3 rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-black text-ink shadow-soft transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lift"
    >
      <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-base font-black text-[#4285f4] shadow-sm ring-1 ring-line">G</span>
      {label}
    </Link>
  );
}
