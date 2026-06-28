import Link from "next/link";

function GoogleMark() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M21.6 12.23c0-.76-.07-1.49-.19-2.19H12v4.14h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.48Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.43l-3.24-2.51c-.9.6-2.04.96-3.38.96-2.6 0-4.8-1.75-5.59-4.11H3.06v2.59A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.41 13.91A6 6 0 0 1 6.09 12c0-.66.11-1.3.32-1.91V7.5H3.06A10 10 0 0 0 2 12c0 1.61.39 3.13 1.06 4.5l3.35-2.59Z" />
      <path fill="#EA4335" d="M12 5.98c1.47 0 2.79.51 3.83 1.5l2.87-2.87C16.96 2.99 14.7 2 12 2a10 10 0 0 0-8.94 5.5l3.35 2.59C7.2 7.73 9.4 5.98 12 5.98Z" />
    </svg>
  );
}

export default function GoogleAuthButton({ role, label = "Continue with Google" }) {
  const href = role ? `/api/auth/google/start?role=${encodeURIComponent(role)}` : "/api/auth/google/start";

  return (
    <Link
      href={href}
      className="flex min-h-11 w-full items-center justify-center gap-3 rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-black text-ink shadow-soft transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lift"
    >
      <span className="grid h-7 w-7 place-items-center rounded-full bg-white shadow-sm ring-1 ring-line">
        <GoogleMark />
      </span>
      {label}
    </Link>
  );
}
