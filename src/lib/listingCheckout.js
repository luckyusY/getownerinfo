// Model B listing-fee checkout, shared by listing creation and draft
// resubmission so both go through the same price -> payment -> activation path.

import Payment from "@/models/Payment";
import { safeInitiate, safeVerify } from "@/lib/payments";
import { settleNonUnlockPayment } from "@/lib/paymentSettlement";
import { PAYMENT_TYPES, PAYMENT_STATUS } from "@/lib/constants";

/**
 * Start (and, with the stub provider, immediately settle) the listing fee.
 *
 * Callers decide what to do on failure: a freshly created listing is removed,
 * while an existing draft is simply left as a draft.
 *
 * @returns {{ ok: false }}
 *        | {{ ok: true, settled: true, payment }}
 *        | {{ ok: true, settled: false, payment, redirectUrl }}
 */
export async function startListingFeeCheckout({ listing, userId }) {
  const init = await safeInitiate({
    amount: listing.listingFee.total,
    type: PAYMENT_TYPES.LISTING_FEE,
    reference: listing._id.toString(),
    metadata: { listingId: listing._id.toString() },
  });
  if (!init.ok) return { ok: false };

  const payment = await Payment.create({
    user: userId,
    listing: listing._id,
    type: PAYMENT_TYPES.LISTING_FEE,
    amount: listing.listingFee.total,
    vatPortion: listing.listingFee.vatPortion,
    status: PAYMENT_STATUS.PENDING,
    provider: init.provider.name,
    providerRef: init.providerRef,
    meta: { listingId: listing._id.toString() },
  });

  const verified =
    init.status === "paid" ? { ok: true, status: "paid" } : await safeVerify(init.providerRef);

  if (verified.ok && verified.status === "paid") {
    await settleNonUnlockPayment(payment);
    return { ok: true, settled: true, payment };
  }

  return { ok: true, settled: false, payment, redirectUrl: init.redirectUrl };
}
