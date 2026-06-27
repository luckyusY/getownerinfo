import Link from "next/link";
import { connectDB } from "@/lib/db";
import TokenUnlock from "@/models/TokenUnlock";
import Listing from "@/models/Listing";
import { guardRole } from "@/lib/guardRole";
import { ROLES } from "@/lib/constants";
import { formatRwf, formatDate } from "@/lib/format";
import { PageHeader, StatCard, SectionHeading, Table, Tr, Td } from "@/components/ui/Dashboard";
import EmptyState from "@/components/ui/EmptyState";

export default async function BuyerDashboard() {
  const session = guardRole(ROLES.BUYER);
  await connectDB();
  const unlocks = await TokenUnlock.find({ user: session.sub })
    .sort({ at: -1 })
    .populate({ path: "listing", model: Listing, select: "title price" })
    .lean();

  const spent = unlocks.reduce((s, u) => s + (u.amountPaid || 0), 0);

  return (
    <div>
      <PageHeader
        title="Your activity"
        subtitle="Unlocked contacts, saved listings and seeker requests."
        actions={
          <>
            <Link href="/seekers/new" className="btn-outline">Post a request</Link>
            <Link href="/listings" className="btn-primary">Browse listings</Link>
          </>
        }
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <StatCard label="Unlocked contacts" value={unlocks.length} tone="brand" />
        <StatCard label="Spent on token fees" value={formatRwf(spent)} />
      </div>

      <div className="mt-8">
        <SectionHeading title="Unlocked contacts" />
        {unlocks.length === 0 ? (
          <EmptyState
            icon="🔓"
            title="No unlocks yet"
            hint="Unlock a listing's verified owner contact to see it here."
            action={<Link href="/listings" className="btn-primary">Browse listings</Link>}
          />
        ) : (
          <Table head={["Listing", "Tier", "Paid", "Unlocked", ""]}>
            {unlocks.map((u) => (
              <Tr key={u._id.toString()}>
                <Td className="font-semibold text-ink">{u.listing?.title || "(removed)"}</Td>
                <Td className="capitalize text-ink-soft">{u.tier}</Td>
                <Td className="text-ink">{formatRwf(u.amountPaid)}</Td>
                <Td className="text-ink-faint">{formatDate(u.at)}</Td>
                <Td>{u.listing && <Link href={`/listings/${u.listing._id.toString()}`} className="font-semibold text-brand hover:underline">View</Link>}</Td>
              </Tr>
            ))}
          </Table>
        )}
      </div>
    </div>
  );
}
