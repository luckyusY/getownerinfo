"use client";

import Link from "next/link";

export default function Error({ error, reset }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-2xl text-red-600">⚠</div>
      <h1 className="mt-5 font-display text-3xl font-bold text-ink">Something went wrong</h1>
      <p className="mt-3 max-w-md text-ink-soft">
        An unexpected error occurred. You can try again, or head back to the homepage.
      </p>
      {error?.digest && (
        <p className="mt-2 font-mono text-xs text-ink-faint">Ref: {error.digest}</p>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button onClick={() => reset()} className="btn-primary px-6 py-3 text-base">Try again</button>
        <Link href="/" className="btn-outline px-6 py-3 text-base">Back home</Link>
      </div>
    </div>
  );
}
