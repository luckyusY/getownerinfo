import Link from "next/link";
import { connectDB } from "@/lib/db";
import Payment from "@/models/Payment";
import Listing from "@/models/Listing";
import { guardRole } from "@/lib/guardRole";
import { ALL_ROLES, PAYMENT_STATUS } from "@/lib/constants";
import { formatRwf, formatDate } from "@/lib/format";
import { PageHeader, StatCard, SectionHeading, Table, Tr, Td } from "@/components/ui/Dashboard";
import { StatusBadge } from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { FileText } from "lucide-react";

export const dynamic = "force-dynamic";

const TYPE_LABEL = {
  listing_fee: "Listing fee",
  token_fee: "Contact unlock",
  commission: "Commission",
  penalty: "Penalty",
  seeker_post: "Request posting fee",
  seeker_view: "Request view token",
};

export default async function PaymentHistoryPage() {
  const session = guardRole(ALL_ROLES);
  await connectDB();

  const payments = await Payment.find({ user: session.sub })
    .sort({ createdAt: -1 })
    .limit(100)
    .populate({ path: "listing", model: Listing, select: "title" })
    .lean();

  const paid = payments.filter((p) => p.status === PAYMENT_STATUS.PAID);
  const totalPaid = paid.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalVat = paid.reduce((sum, p) => sum + (p.vatPortion || 0), 0);

  return (
    <div>
      <PageHeader
        title="Payment history"
        subtitle="Every listing fee, contact unlock, commission and penalty charged to this account."
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total paid" value={formatRwf(totalPaid)} tone="brand" />
        <StatCard label="VAT included" value={formatRwf(totalVat)} hint="18%, VAT-inclusive pricing" />
        <StatCard label="Transactions" value={payments.length} />
      </div>

      <div className="mt-8">
        <SectionHeading title="Transactions" />
        {payments.length === 0 ? (
          <EmptyState
            title="No payments yet"
            hint="Listing fees and contact unlocks will appear here once you make one."
            action={<Link href="/listings" className="btn-primary">Browse listings</Link>}
          />
        ) : (
          <>
            {/* Eight columns at 1020px inside a phone's ~360px of room left
                two thirds of every row, the Receipt link included, behind a
                sideways scroll. Below md each payment is a card instead. */}
            <ul className="grid gap-3 md:hidden">
              {payments.map((p) => (
                <li key={p._id.toString()} className="card !p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">{TYPE_LABEL[p.type] || p.type}</p>
                      <p className="mt-0.5 text-xs font-semibold text-ink-faint">
                        {formatDate(p.createdAt)}
                        {p.provider ? ` · ${p.provider}` : ""}
                      </p>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>

                  {p.listing?.title && (
                    <p className="mt-2 truncate text-sm text-ink-soft">{p.listing.title}</p>
                  )}

                  <p className="mt-3 font-display text-xl font-bold text-ink">
                    {formatRwf(p.amount)}
                  </p>
                  {p.vatPortion != null && (
                    <p className="text-xs font-semibold text-ink-faint">
                      includes {formatRwf(p.vatPortion)} VAT
                    </p>
                  )}

                  {p.status === PAYMENT_STATUS.PAID && (
                    <Link
                      href={`/documents/receipt/${p._id.toString()}`}
                      className="mt-2 inline-flex min-h-11 items-center gap-1.5 text-xs font-bold text-brand hover:underline"
                    >
                      <FileText className="h-3.5 w-3.5" /> Receipt
                    </Link>
                  )}
                </li>
              ))}
            </ul>

            <div className="hidden md:block">
          <Table
            minWidth={900}
            head={["Date", "Type", "Listing", { label: "Amount", numeric: true }, { label: "VAT", numeric: true }, "Method", "Status", "Receipt"]}
          >
            {payments.map((p) => (
              <Tr key={p._id.toString()}>
                <Td className="whitespace-nowrap text-ink-faint">{formatDate(p.createdAt)}</Td>
                <Td className="font-semibold text-ink">{TYPE_LABEL[p.type] || p.type}</Td>
                <Td className="text-ink-soft">{p.listing?.title || "—"}</Td>
                <Td numeric className="font-semibold text-ink">{formatRwf(p.amount)}</Td>
                <Td numeric className="text-ink-faint">{formatRwf(p.vatPortion)}</Td>
                <Td className="capitalize text-ink-soft">{p.provider || "—"}</Td>
                <Td><StatusBadge status={p.status} /></Td>
                <Td>
                  {/* Only a settled payment has a receipt to show, which is
                      also what the document route enforces. */}
                  {p.status === PAYMENT_STATUS.PAID ? (
                    <Link
                      href={`/documents/receipt/${p._id.toString()}`}
                      className="inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap text-xs font-bold text-brand hover:underline"
                    >
                      <FileText className="h-3.5 w-3.5" /> Receipt
                    </Link>
                  ) : (
                    <span className="text-xs font-semibold text-ink-faint">—</span>
                  )}
                </Td>
              </Tr>
            ))}
          </Table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
