import Link from "next/link";
import { connectDB } from "@/lib/db";
import TokenUnlock from "@/models/TokenUnlock";
import Listing from "@/models/Listing";
import Favorite from "@/models/Favorite";
import SeekerRequest from "@/models/SeekerRequest";
import User from "@/models/User";
import { guardRole } from "@/lib/guardRole";
import { ROLES, LISTING_STATUS } from "@/lib/constants";
import { formatRwf, formatDate } from "@/lib/format";
import { PageHeader, StatCard, SectionHeading, Table, Tr, Td } from "@/components/ui/Dashboard";
import EmptyState from "@/components/ui/EmptyState";
import SavedListings from "./SavedListings";
import StartSellingButton from "@/components/StartSellingButton";
import { FileText, Search, Target } from "lucide-react";

export default async function BuyerDashboard() {
  const session = guardRole(ROLES.BUYER);
  await connectDB();
  const [user, unlocks, savedCount, requestCount] = await Promise.all([
    User.findById(session.sub).lean(),
    TokenUnlock.find({ user: session.sub })
      .sort({ at: -1 })
      .populate({ path: "listing", model: Listing, select: "title price status" })
      .lean(),
    Favorite.countDocuments({ user: session.sub }),
    SeekerRequest.countDocuments({ seeker: session.sub }),
  ]);

  const spent = unlocks.reduce((s, u) => s + (u.amountPaid || 0), 0);
  const profileItems = [user?.name, user?.email, user?.phone].filter(Boolean).length;
  const profilePercent = Math.round((profileItems / 3) * 100);

  return (
    <div>
      <PageHeader
        title="Your activity"
        subtitle="Unlocked contacts, saved listings and seeker requests."
        actions={
          <>
            <StartSellingButton className="btn-outline">Start selling</StartSellingButton>
            <Link href="/seekers/new" className="btn-outline">Post a request</Link>
            <Link href="/listings" className="btn-primary">Browse listings</Link>
          </>
        }
      />

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="card dashboard-reveal !p-5">
          <p className="text-xs font-black uppercase tracking-wide text-brand">Account journey</p>
          <h2 className="mt-2 font-display text-xl font-bold text-ink">You can buy and sell with one account.</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Browse listings, unlock owner contact when ready, post what you need, or switch on seller tools when you have a property or asset to list.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <Link href="/listings" className="rounded-lg border border-line bg-panel p-3 text-sm font-bold text-ink transition hover:border-brand/30 hover:bg-brand-50">
              <Search className="mb-2 h-4 w-4 text-brand" /> Browse
            </Link>
            <Link href="/seekers/new" className="rounded-lg border border-line bg-panel p-3 text-sm font-bold text-ink transition hover:border-brand/30 hover:bg-brand-50">
              <Target className="mb-2 h-4 w-4 text-brand" /> Post need
            </Link>
            <StartSellingButton className="flex flex-col items-start rounded-lg border border-line bg-panel p-3 text-left text-sm font-bold text-ink transition hover:border-brand/30 hover:bg-brand-50">
              Start selling
            </StartSellingButton>
          </div>
        </section>

        <section className="card dashboard-reveal !p-5">
          <p className="text-xs font-black uppercase tracking-wide text-ink-faint">Profile readiness</p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <div>
              <p className="font-display text-2xl font-bold text-ink">{profilePercent}%</p>
              <p className="text-sm text-ink-soft">Name, email and phone help owners trust your unlocks.</p>
            </div>
            <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-sm font-black text-brand">{profileItems}/3</span>
          </div>
          {!user?.phone && <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">Add a phone number during checkout or support contact to improve response speed.</p>}
        </section>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Unlocked contacts" value={unlocks.length} tone="brand" />
        <StatCard label="Spent on token fees" value={formatRwf(spent)} />
        <StatCard label="Saved listings" value={savedCount} hint="Shortlist serious options." />
        <StatCard label="Requests posted" value={requestCount} hint="Let owners come to you." />
      </div>

      <div className="mt-8">
        <SectionHeading
          title="Unlocked contacts"
          description="Each unlock keeps its own contact sheet, available whether or not the listing is still live."
          action={<Link href="/dashboard/unlocks" className="btn-outline">See the details</Link>}
        />
        {unlocks.length === 0 ? (
          <EmptyState
            title="No unlocks yet"
            hint="Unlock a listing's owner contact to see it here."
            action={<Link href="/listings" className="btn-primary">Browse listings</Link>}
          />
        ) : (
          <Table head={["Listing", "Tier", { label: "Paid", numeric: true }, "Unlocked", ""]}>
            {unlocks.map((u) => {
              const live = u.listing?.status === LISTING_STATUS.ACTIVE;
              return (
                <Tr key={u._id.toString()}>
                  <Td className="font-semibold text-ink">
                    {u.listing?.title || "(removed)"}
                    {u.listing && !live && (
                      <span className="mt-0.5 block text-xs font-semibold text-ink-faint">
                        No longer listed — your contact sheet still works
                      </span>
                    )}
                  </Td>
                  <Td className="capitalize text-ink-soft">{u.tier}</Td>
                  <Td numeric className="text-ink">{formatRwf(u.amountPaid)}</Td>
                  <Td className="text-ink-faint">{formatDate(u.at)}</Td>
                  <Td>
                    {/* The contact sheet, not the listing: the listing page
                        refuses anything that is not ACTIVE, so "View" was a
                        404 for exactly the unlocks whose details the buyer can
                        no longer get anywhere else. */}
                    <div className="flex flex-wrap items-center gap-3">
                      <Link
                        href={`/documents/unlock/${u._id.toString()}`}
                        className="inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap text-xs font-bold text-brand hover:underline"
                      >
                        <FileText className="h-3.5 w-3.5" /> Contact sheet
                      </Link>
                      {u.listing && live && (
                        <Link
                          href={`/listings/${u.listing._id.toString()}`}
                          className="inline-flex min-h-11 items-center whitespace-nowrap text-xs font-bold text-ink-soft hover:text-ink hover:underline"
                        >
                          Listing
                        </Link>
                      )}
                    </div>
                  </Td>
                </Tr>
              );
            })}
          </Table>
        )}
      </div>

      <div className="mt-10">
        <SectionHeading title="Saved listings" />
        <SavedListings />
      </div>
    </div>
  );
}
