import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata = { title: "Page not found — getownerinfo" };

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 py-20 text-center">
        <p className="font-display text-7xl font-bold text-brand">404</p>
        <h1 className="mt-4 font-display text-3xl font-bold text-ink">This page wandered off</h1>
        <p className="mt-3 max-w-md text-ink-soft">
          The page you&apos;re looking for doesn&apos;t exist or may have been moved. Let&apos;s get you
          back to verified listings.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-primary px-6 py-3 text-base">Back home</Link>
          <Link href="/listings" className="btn-outline px-6 py-3 text-base">Browse listings</Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
