// Listing agreements: validation at submit time, the immutable record, and the
// signed copy that goes back to the account that signed it (spec Part 22).

import ListingAgreement, { AGREEMENT_TERMS, AGREEMENT_VERSION } from "@/models/ListingAgreement";
import { audit } from "@/models/AuditLog";
import { notify } from "@/lib/notify";
import { formatRwf } from "@/lib/format";
import { LISTING_MODELS } from "@/lib/constants";

/** A typed signature counts only if it matches the declared signatory name. */
function signatureMatches(signature, name) {
  const normalize = (v) => String(v || "").trim().replace(/\s+/g, " ").toLowerCase();
  return normalize(signature) === normalize(name) && normalize(name).length >= 3;
}

/**
 * Validate the agreement block on a submission.
 * @returns {string|null} the blocking message, or null when it is acceptable.
 */
export function agreementBlocker(agreement, { model }) {
  if (!agreement) {
    return model === LISTING_MODELS.A
      ? "Read and sign the exclusive listing agreement before submitting"
      : "Read and sign the listing agreement before submitting";
  }
  if (!agreement.accepted) return "You must accept the agreement terms before submitting";
  if (!agreement.signatoryName?.trim()) return "Enter the name of the person signing";
  if (!agreement.signature?.trim()) return "Type your full name to sign the agreement";
  if (!signatureMatches(agreement.signature, agreement.signatoryName)) {
    return "Your signature must match the signatory name exactly";
  }
  return null;
}

/**
 * Record a signed agreement and email a copy to the account that signed it.
 * Append-only: a resubmission writes a new record rather than editing one.
 */
export async function recordAgreement({ listing, user, agreement, category, session, request }) {
  const isModelA = listing.model === LISTING_MODELS.A;

  const record = await ListingAgreement.create({
    listing: listing._id,
    owner: listing.owner,
    model: listing.model,
    version: AGREEMENT_VERSION,
    terms: AGREEMENT_TERMS[listing.model] || [],
    commissionPercent: isModelA ? category?.commissionPercent ?? null : null,
    exclusivityMonths: isModelA ? listing.durationMonths : null,
    listingFeeTotal: isModelA ? null : listing.listingFee?.total ?? null,
    signatoryName: agreement.signatoryName.trim(),
    signatoryRole: listing.ownerType || "owner",
    signature: agreement.signature.trim(),
    signedAt: new Date(),
    ipAddress: request?.headers?.get?.("x-forwarded-for")?.split(",")[0]?.trim() || null,
    userAgent: request?.headers?.get?.("user-agent") || null,
    copySentTo: user?.email || null,
  });

  const summary = isModelA
    ? [
        `Listing: ${listing.title}`,
        `Model: A — exclusive, commission only`,
        `Commission: ${((record.commissionPercent ?? 0) * 100).toFixed(1)}% of the final deal amount`,
        `Exclusivity period: ${record.exclusivityMonths} month(s)`,
      ]
    : [
        `Listing: ${listing.title}`,
        `Model: B — paid listing`,
        `Listing fee: ${formatRwf(record.listingFeeTotal)} (VAT inclusive)`,
        `Duration: ${listing.durationMonths} month(s)`,
      ];

  const body = [
    `You signed the getownerinfo listing agreement on ${record.signedAt.toUTCString()}.`,
    "",
    ...summary,
    `Signed by: ${record.signatoryName}`,
    `Agreement version: ${record.version}`,
    "",
    "Terms you accepted:",
    ...record.terms.map((t, i) => `${i + 1}. ${t}`),
    "",
    "Keep this message as your copy of the agreement.",
  ].join("\n");

  const delivery = await notify({
    to: user?.email,
    channel: "email",
    subject: `Your signed listing agreement — ${listing.title}`,
    message: body,
  });

  // The record is the source of truth; whether the copy reached an inbox is
  // tracked separately so a mail outage never blocks a submission.
  if (delivery.delivered) {
    record.copyDelivered = true;
    await record.save();
  }

  await audit({
    actor: user?._id || listing.owner,
    actorRole: session?.role,
    action: "listing.agreement_signed",
    targetType: "Listing",
    targetId: listing._id,
    meta: {
      agreementId: record._id.toString(),
      model: listing.model,
      version: record.version,
      commissionPercent: record.commissionPercent,
      exclusivityMonths: record.exclusivityMonths,
      copyDelivered: record.copyDelivered,
    },
  });

  return record;
}
