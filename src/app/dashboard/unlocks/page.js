import Link from "next/link";
import { connectDB } from "@/lib/db";
import TokenUnlock from "@/models/TokenUnlock";
import Listing from "@/models/Listing";
import { guardRole } from "@/lib/guardRole";
import { ALL_ROLES } from "@/lib/constants";
import { formatRwf, formatDate } from "@/lib/format";
import { PageHeader, StatCard, SectionHeading, Table, Tr, Td } from "@/components/ui/Dashboard";
import EmptyState from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function ContactUnlocksPage() {
  const session = guardRole(ALL_ROLES);
  await connectDB();

  const unlocks = await TokenUnlock.find({ user: session.sub })
    .sort({ at: -1 })
    .populate({ path: "listing", model: Listing, select: "title price status" })
    .lean();

  const spent = unlocks.reduce((sum, u) => sum + (u.amountPaid || 0), 0);

  return (
    <div>
      <PageHeader
        title="Contact unlocks"
        subtitle="Every owner contact you have paid to reveal. Each unlock is a permanent access record."
        actions={<Link href="/listings" className="btn-primary">Browse listings</Link>}
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Contacts unlocked" value={unlocks.length} tone="brand" />
        <StatCard label="Total token fees paid" value={formatRwf(spent)} />
        <StatCard
          label="Most recent"
          value={unlocks[0] ? formatDate(unlocks[0].at) : "—"}
          hint={unlocks[0]?.listing?.title}
        />
      </div>

      <div className="mt-8">
        <SectionHeading
          title="Access records"
          description="Each row records who unlocked what, when, and which fields were revealed."
        />
        {unlocks.length === 0 ? (
          <EmptyState
            title="No unlocks yet"
            hint="Unlock a listing's verified owner contact to see it here."
            action={<Link href="/listings" className="btn-primary">Browse listings</Link>}
          />
        ) : (
          <Table head={["Listing", "Tier", { label: "Paid", numeric: true }, { label: "Fields revealed", numeric: true }, "Unlocked", ""]}>
            {unlocks.map((u) => (
              <Tr key={u._id.toString()}>
                <Td className="font-semibold text-ink">{u.listing?.title || "(listing removed)"}</Td>
                <Td className="capitalize text-ink-soft">{u.tier}</Td>
                <Td numeric className="text-ink">{formatRwf(u.amountPaid)}</Td>
                <Td numeric className="text-ink-faint">{(u.fieldsUnlocked || []).length} fields</Td>
                <Td className="text-ink-faint">{formatDate(u.at)}</Td>
                <Td>
                  {u.listing && (
                    <Link href={`/listings/${u.listing._id.toString()}`} className="inline-flex min-h-11 items-center font-semibold text-brand hover:underline">
                      View
                    </Link>
                  )}
                </Td>
              </Tr>
            ))}
          </Table>
        )}
      </div>
    </div>
  );
}
