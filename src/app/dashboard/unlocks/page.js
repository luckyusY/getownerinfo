import Link from "next/link";
import { connectDB } from "@/lib/db";
import TokenUnlock from "@/models/TokenUnlock";
import Listing from "@/models/Listing";
import { guardRole } from "@/lib/guardRole";
import { ALL_ROLES, LISTING_STATUS } from "@/lib/constants";
import { formatRwf, formatDate } from "@/lib/format";
import { PageHeader, StatCard, SectionHeading, Table, Tr, Td } from "@/components/ui/Dashboard";
import EmptyState from "@/components/ui/EmptyState";
import { FileText, Flag } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ContactUnlocksPage() {
  const session = guardRole(ALL_ROLES);
  await connectDB();

  // `contact` comes along deliberately. This page used to show only a count of
  // the fields revealed, so the number the buyer paid for lived nowhere but the
  // listing page — which 404s the moment the listing stops being ACTIVE.
  const unlocks = await TokenUnlock.find({ user: session.sub })
    .sort({ at: -1 })
    .populate({ path: "listing", model: Listing, select: "title price status contact" })
    .lean();

  const spent = unlocks.reduce((sum, u) => sum + (u.amountPaid || 0), 0);

  return (
    <div>
      <PageHeader
        title="Contact unlocks"
        subtitle="Every owner contact you have paid to reveal, with the details themselves. Each unlock is a permanent access record."
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
          title="Contacts you have unlocked"
          description="Yours to keep. A contact sheet stays available even after the listing comes down."
        />
        {unlocks.length === 0 ? (
          <EmptyState
            title="No unlocks yet"
            hint="Unlock a listing's owner contact to see it here."
            action={<Link href="/listings" className="btn-primary">Browse listings</Link>}
          />
        ) : (
          <Table
            minWidth={980}
            head={["Listing", "Owner contact", { label: "Paid", numeric: true }, "Unlocked", ""]}
          >
            {unlocks.map((u) => {
              const live = u.listing?.status === LISTING_STATUS.ACTIVE;
              const name = u.listing?.contact?.ownerName;
              const phone = u.listing?.contact?.ownerPhone;
              return (
                <Tr key={u._id.toString()}>
                  <Td className="font-semibold text-ink">
                    {u.listing?.title || "(listing removed)"}
                    {u.listing && !live && (
                      // Said plainly rather than by a link that 404s: the sheet
                      // is still there, the listing is not.
                      <span className="mt-0.5 block text-xs font-semibold text-ink-faint">
                        No longer listed — your contact sheet still works
                      </span>
                    )}
                  </Td>
                  <Td>
                    {phone || name ? (
                      <>
                        <span className="block font-semibold text-ink">{name || "—"}</span>
                        {phone && (
                          <a
                            href={`tel:${phone}`}
                            className="inline-flex min-h-11 items-center font-bold text-brand hover:underline"
                          >
                            {phone}
                          </a>
                        )}
                      </>
                    ) : (
                      <span className="text-xs font-semibold text-ink-faint">Not stored</span>
                    )}
                  </Td>
                  <Td numeric className="text-ink">{formatRwf(u.amountPaid)}</Td>
                  <Td className="text-ink-faint">{formatDate(u.at)}</Td>
                  <Td>
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
                      {/* Reporting used to live only on the listing page, which
                          404s for exactly the listings most likely to need
                          reporting. The form itself is on the contact sheet,
                          where there is room for it; this is the way in from
                          the list of what was bought. */}
                      {u.listing && (
                        <Link
                          href={`/documents/unlock/${u._id.toString()}#report`}
                          className="inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap text-xs font-bold text-ink-faint transition hover:text-red-600"
                        >
                          <Flag className="h-3.5 w-3.5" /> Report a problem
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
    </div>
  );
}
