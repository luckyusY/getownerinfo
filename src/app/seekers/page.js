import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SeekersBrowse from "./SeekersBrowse";

export const metadata = {
  title: "Seeker requests",
  description: "Buyers and tenants looking for property and assets. Unlock seeker contact with a view token.",
};

export default function SeekersPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink">Requests from seekers</h1>
            <p className="mt-1 text-sm text-ink-soft">
              Buyers and tenants looking for property and assets. Unlock contact with a view token.
            </p>
          </div>
          <Link href="/seekers/new" className="btn-primary">Post a request</Link>
        </div>
        <SeekersBrowse />
      </main>
      <SiteFooter />
    </div>
  );
}
