import { notFound, redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import Payment from "@/models/Payment";
import Commission from "@/models/Commission";
import Listing from "@/models/Listing";
import ListingAgreement from "@/models/ListingAgreement";
import User from "@/models/User";
import { getSession } from "@/lib/auth";
import { ROLES, PAYMENT_STATUS } from "@/lib/constants";
import { formatRwf, formatDate } from "@/lib/format";
import DocumentShell, { AmountTable } from "@/components/documents/DocumentShell";

export const dynamic = "force-dynamic";

/**
 * The documents the platform issues: payment receipts, commission invoices,
 * and a copy of a signed listing agreement.
 *
 * None of these existed. Money left an account and nothing came back that the
 * payer could file, print or send on to anyone — and the signed listing
 * agreement, the one document with real weight behind it, was only ever sent
 * as the body of an email, which production cannot currently send at all
 * (RESEND_API_KEY is unset). The record was in the database the whole time;
 * this is the view of it that the person it concerns can actually keep.
 *
 * One route serves all three because the work is identical in each case: load
 * the record, check it belongs to whoever is asking, and lay it out. The three
 * `resolve` functions below are the only part that differs.
 */

const KINDS = {
  receipt: { label: "Receipt", prefix: "RCPT", resolve: resolveReceipt },
  invoice: { label: "Invoice", prefix: "INV", resolve: resolveInvoice },
  agreement: { label: "Agreement", prefix: "AGR", resolve: resolveAgreement },
};

const PAYMENT_LABEL = {
  listing_fee: "Listing fee",
  token_fee: "Contact unlock token",
  commission: "Commission settlement",
  penalty: "Penalty settlement",
  seeker_post: "Request posting fee",
  seeker_view: "Request view token",
};

/**
 * A short, stable, human-quotable reference. Derived from the record's own id
 * rather than a counter, so it never needs a sequence and two documents can
 * never collide.
 */
function docNumber(prefix, id, date) {
  const year = date ? new Date(date).getFullYear() : new Date().getFullYear();
  return `${prefix}-${year}-${String(id).slice(-6).toUpperCase()}`;
}

export async function generateMetadata({ params }) {
  const kind = KINDS[params.kind];
  return { title: kind ? `${kind.label} — getownerinfo` : "Document not found" };
}

export default async function DocumentPage({ params }) {
  const kind = KINDS[params.kind];
  if (!kind) notFound();

  const session = getSession();
  if (!session) {
    redirect(`/login?next=${encodeURIComponent(`/documents/${params.kind}/${params.id}`)}`);
  }

  // Ids come straight off a URL, so a malformed one must not reach a Mongoose
  // cast and become a 500.
  if (!/^[a-f\d]{24}$/i.test(params.id)) notFound();

  await connectDB();
  const isAdmin = session.role === ROLES.ADMIN;
  const doc = await kind.resolve({ id: params.id, session, isAdmin });
  // A document that is not this account's is absent rather than forbidden: the
  // existence of someone else's receipt is not ours to confirm.
  if (!doc) notFound();

  return <DocumentShell {...doc} />;
}

/* -------------------------------------------------------------------------- */

async function resolveReceipt({ id, session, isAdmin }) {
  const payment = await Payment.findById(id).populate({
    path: "listing",
    model: Listing,
    select: "title",
  });
  if (!payment) return null;
  if (!isAdmin && payment.user.toString() !== session.sub) return null;
  // A receipt is evidence that money was taken. An unsettled payment has none
  // to offer, so it has no receipt until it settles.
  if (payment.status !== PAYMENT_STATUS.PAID) return null;

  const payer = await User.findById(payment.user).select("name email phone").lean();
  const net = Math.max(0, (payment.amount || 0) - (payment.vatPortion || 0));
  const what = PAYMENT_LABEL[payment.type] || payment.type;

  return {
    kindLabel: "Payment receipt",
    title: what,
    docNumber: docNumber("RCPT", payment._id.toString(), payment.createdAt),
    issuedOn: formatDate(payment.createdAt),
    backHref: "/dashboard/payments",
    backLabel: "Payment history",
    meta: [
      { label: "Paid by", value: payer?.name || "—" },
      { label: "Account", value: payer?.email || payer?.phone || "—" },
      { label: "Payment method", value: payment.method || payment.provider || "—" },
      { label: "Provider reference", value: payment.providerRef || "—" },
      ...(payment.listing?.title ? [{ label: "Listing", value: payment.listing.title }] : []),
      ...(payment.tier ? [{ label: "Tier", value: payment.tier }] : []),
    ],
    footnote: (
      <p>
        Paid in full. Prices on getownerinfo are quoted VAT-inclusive at 18%; the VAT portion
        above is the tax contained in the amount charged, not an addition to it.
      </p>
    ),
    children: (
      <AmountTable
        rows={[
          { label: what, value: formatRwf(net), hint: "Excluding VAT" },
          { label: "VAT (18%, included)", value: formatRwf(payment.vatPortion || 0) },
        ]}
        total={{ label: "Total paid", value: formatRwf(payment.amount) }}
      />
    ),
  };
}

async function resolveInvoice({ id, session, isAdmin }) {
  const commission = await Commission.findById(id).populate({
    path: "listing",
    model: Listing,
    select: "title",
  });
  if (!commission) return null;
  if (!isAdmin && commission.owner.toString() !== session.sub) return null;

  const owner = await User.findById(commission.owner).select("name email phone").lean();
  const net = Math.max(0, (commission.total || 0) - (commission.vatPortion || 0));
  const settled = commission.status === "paid" || commission.status === "waived";

  return {
    kindLabel: "Commission invoice",
    title: `Commission on a ${commission.dealOutcome} deal`,
    docNumber: docNumber("INV", commission._id.toString(), commission.createdAt),
    issuedOn: formatDate(commission.createdAt),
    backHref: "/dashboard/invoices",
    backLabel: "Invoices & commissions",
    meta: [
      { label: "Billed to", value: owner?.name || "—" },
      { label: "Account", value: owner?.email || owner?.phone || "—" },
      { label: "Listing", value: commission.listing?.title || "—" },
      { label: "Reported deal value", value: formatRwf(commission.finalAmount) },
      { label: "Due date", value: formatDate(commission.dueDate) },
      {
        label: "Status",
        value: settled
          ? commission.status === "paid"
            ? `Paid ${formatDate(commission.paidAt)}`
            : "Waived"
          : commission.status === "overdue"
            ? "Overdue"
            : "Outstanding",
      },
    ],
    footnote: settled ? (
      <p>Settled. No further action is required on this invoice.</p>
    ) : (
      <p>
        Payable by the due date above. New exclusive (Model A) listings on this account are
        blocked while a commission invoice is outstanding, and an overdue invoice attracts a
        penalty.
      </p>
    ),
    children: (
      <AmountTable
        rows={[
          {
            label: "Commission",
            value: formatRwf(net),
            hint: `${((commission.commissionPercent || 0) * 100).toFixed(1)}% of ${formatRwf(commission.finalAmount)}, excluding VAT`,
          },
          { label: "VAT (18%, included)", value: formatRwf(commission.vatPortion || 0) },
        ]}
        total={{ label: settled ? "Total settled" : "Total due", value: formatRwf(commission.total) }}
      />
    ),
  };
}

async function resolveAgreement({ id, session, isAdmin }) {
  // Keyed by listing, not by agreement id: a resubmission writes a new record
  // rather than editing the old one, and what the owner wants is the one in
  // force. `{ listing: 1, signedAt: -1 }` is indexed for exactly this.
  const agreement = await ListingAgreement.findOne({ listing: id }).sort({ signedAt: -1 });
  if (!agreement) return null;
  if (!isAdmin && agreement.owner.toString() !== session.sub) return null;

  const [listing, owner] = await Promise.all([
    Listing.findById(agreement.listing).select("title durationMonths").lean(),
    User.findById(agreement.owner).select("name email phone").lean(),
  ]);

  const isModelA = agreement.model === "A";

  return {
    kindLabel: "Listing agreement",
    title: `${isModelA ? "Exclusive listing agreement (Model A)" : "Listing agreement (Model B)"}`,
    docNumber: docNumber("AGR", agreement._id.toString(), agreement.signedAt),
    issuedOn: formatDate(agreement.signedAt),
    backHref: "/dashboard/listings",
    backLabel: "My listings",
    meta: [
      { label: "Listing", value: listing?.title || "—" },
      { label: "Account", value: owner?.email || owner?.phone || "—" },
      { label: "Signed by", value: agreement.signatoryName },
      { label: "Signing as", value: agreement.signatoryRole.replace(/_/g, " ") },
      { label: "Signed on", value: formatDate(agreement.signedAt) },
      { label: "Agreement version", value: agreement.version },
      ...(isModelA
        ? [
            {
              label: "Commission rate",
              value: `${((agreement.commissionPercent ?? 0) * 100).toFixed(1)}% of the final deal amount`,
            },
            { label: "Exclusivity period", value: `${agreement.exclusivityMonths} month(s)` },
          ]
        : [
            { label: "Listing fee", value: `${formatRwf(agreement.listingFeeTotal)} (VAT inclusive)` },
            { label: "Duration", value: `${listing?.durationMonths ?? "—"} month(s)` },
          ]),
    ],
    footnote: (
      <p>
        Signed electronically on getownerinfo. The typed signature was matched against the
        signatory name at the time of signing
        {agreement.ipAddress ? `, from ${agreement.ipAddress}` : ""}. This record is
        append-only: re-signing creates a new agreement rather than altering this one.
      </p>
    ),
    children: (
      <>
        <h2 className="text-sm font-black uppercase tracking-wide text-ink-faint">
          Terms accepted
        </h2>
        <ol className="mt-3 space-y-3 text-sm leading-relaxed text-ink">
          {agreement.terms.map((term, i) => (
            <li key={i} className="flex gap-3">
              <span className="font-mono text-xs font-bold text-ink-faint">{i + 1}.</span>
              <span>{term}</span>
            </li>
          ))}
        </ol>

        <div className="mt-8 border-t border-line pt-5">
          <p className="text-[11px] font-black uppercase tracking-wide text-ink-faint">
            Signature
          </p>
          <p className="mt-2 font-display text-xl italic text-ink">{agreement.signature}</p>
          <p className="mt-1 text-xs font-semibold text-ink-faint">
            {agreement.signatoryName} · {new Date(agreement.signedAt).toUTCString()}
          </p>
        </div>
      </>
    ),
  };
}
