import Link from "next/link";
import { Check } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { connectDB } from "@/lib/db";
import Category from "@/models/Category";
import PlatformSettings, { getSettings } from "@/models/PlatformSettings";
import { DEFAULT_SETTINGS } from "@/data/catalog";
import { formatRwf } from "@/lib/format";
import { Table, Td, Tr } from "@/components/ui/Dashboard";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Pricing",
  description: "Transparent listing fees, token fees and commissions by category. No hidden costs.",
};

export default async function PricingPage() {
  await connectDB();
  const [categories, settings] = await Promise.all([
    Category.find({ isActive: true }).sort({ sortOrder: 1 }).lean(),
    getSettings(PlatformSettings, DEFAULT_SETTINGS),
  ]);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-12">
        <div className="max-w-2xl">
          <p className="eyebrow">Pricing</p>
          <h1 className="mt-2 font-display text-4xl font-bold text-ink">Transparent, pay-as-you-go</h1>
          <p className="mt-3 text-ink-soft">
            Listing is free for eligible exclusive (Model A) owners — you only pay a commission when
            a deal closes. Everything else is a simple paid listing. Buyers pay a small token fee to
            unlock owner contact. All amounts include 18% VAT.
          </p>
        </div>

        {/* Two models */}
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <div className="card premium-hover">
            <span className="badge bg-brand-50 text-brand">Model A · Exclusive</span>
            <h2 className="mt-3 font-display text-xl font-bold text-ink">List free, pay on success</h2>
            <p className="mt-2 text-sm text-ink-soft">For eligible high-value, single-unit listings. No upfront fee — a commission applies only when you sell or rent.</p>
            <ul className="mt-4 space-y-2 text-sm text-ink-soft">
              {["No listing fee", "Commission only on a closed deal", "Priority verification"].map((f) => (
                <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4 text-brand" /> {f}</li>
              ))}
            </ul>
          </div>
          <div className="card premium-hover">
            <span className="badge bg-gold-50 text-gold-700">Model B · Standard</span>
            <h2 className="mt-3 font-display text-xl font-bold text-ink">Simple paid listing</h2>
            <p className="mt-2 text-sm text-ink-soft">For multi-unit, resellers, and items below the exclusive threshold. Pay a flat fee per listing period.</p>
            <ul className="mt-4 space-y-2 text-sm text-ink-soft">
              {["Flat monthly listing fee", "Duration discounts up to 50%", "No commission on sale"].map((f) => (
                <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4 text-brand" /> {f}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Per-category table */}
        <h2 className="mt-12 font-display text-2xl font-bold text-ink">Fees by category</h2>
        {/* Three money columns read as a comparison, so they are right-aligned
            with lined-up digits rather than ragged against the category name. */}
        <div className="mt-4">
          <Table
            minWidth={640}
            head={[
              "Category",
              { label: "Listing fee (Model B / mo)", numeric: true },
              { label: "Buyer token", numeric: true },
              { label: "Commission (Model A)", numeric: true },
            ]}
          >
            {categories.map((c) => (
              <Tr key={c._id.toString()}>
                <Td className="font-semibold text-ink">{c.name}</Td>
                <Td numeric className="text-ink-soft">{formatRwf(c.listingFeeMonthly)}</Td>
                <Td numeric className="text-ink-soft">{formatRwf(c.tokenFee?.buyer)}</Td>
                <Td numeric className="text-ink-soft">{Math.round((c.commissionPercent || 0) * 100)}%</Td>
              </Tr>
            ))}
          </Table>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-line bg-surface p-4 text-sm shadow-soft">
            <p className="font-semibold text-ink">Duration discounts</p>
            <p className="mt-1 text-ink-soft">2 months 20% · 3 months 30% · 6 months 40% · 12 months 50%.</p>
          </div>
          <div className="rounded-xl border border-line bg-surface p-4 text-sm shadow-soft">
            <p className="font-semibold text-ink">Seeker requests</p>
            <p className="mt-1 text-ink-soft">Post a request for {formatRwf(settings.seeker?.postFee)}. Owners unlock seeker contact for {formatRwf(settings.seeker?.viewToken)}.</p>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/register" className="btn-primary px-6 py-3 text-base">List your property</Link>
          <Link href="/listings" className="btn-outline px-6 py-3 text-base">Browse listings</Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
