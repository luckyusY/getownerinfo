import Payment from "@/models/Payment";
import Listing from "@/models/Listing";
import SeekerRequest, { SEEKER_STATUS } from "@/models/SeekerRequest";
import SeekerUnlock from "@/models/SeekerUnlock";
import Commission from "@/models/Commission";
import Penalty from "@/models/Penalty";
import User from "@/models/User";
import { audit } from "@/models/AuditLog";
import { dispatch } from "@/lib/notificationService";
import { PAYMENT_STATUS, PAYMENT_TYPES, LISTING_STATUS } from "@/lib/constants";

// What a receipt should call each kind of payment.
const PAYMENT_LABELS = {
  [PAYMENT_TYPES.LISTING_FEE]: "your listing fee",
  [PAYMENT_TYPES.SEEKER_POST]: "posting your request",
  [PAYMENT_TYPES.SEEKER_VIEW]: "viewing a buyer request",
  [PAYMENT_TYPES.COMMISSION]: "your commission invoice",
  [PAYMENT_TYPES.PENALTY]: "settling a penalty",
};

// Complete the application-side effect of a provider-confirmed payment.
// The conditional status update ensures webhook/verify races settle only once.
//
// Every branch also raises the notifications for what just happened. Before
// this, a payment that settled through the provider webhook (rather than
// inline during the request) changed the user's listing, request or balance
// silently: the seeker whose request went live, the owner whose listing moved
// into review and the seeker whose contact had just been bought were all told
// nothing. The `alreadyPaid` guard is what keeps a webhook/verify race from
// sending the same message twice.
export async function settleNonUnlockPayment(payment) {
  const claimed = await Payment.findOneAndUpdate(
    { _id: payment._id, status: { $ne: PAYMENT_STATUS.PAID } },
    { $set: { status: PAYMENT_STATUS.PAID } },
    { new: true }
  );
  const alreadyPaid = !claimed;
  const settledPayment = claimed || await Payment.findById(payment._id);
  if (!settledPayment) return { alreadyPaid, targetMissing: true };

  // The payer's receipt goes out first. Several branches below return early
  // when the thing the payment was for has gone missing, and money that has
  // actually been taken must be confirmed either way.
  if (!alreadyPaid) {
    await dispatch("payment_successful", {
      userId: settledPayment.user,
      data: {
        payment: settledPayment,
        what: PAYMENT_LABELS[settledPayment.type] || "your payment",
      },
    });
  }

  if (settledPayment.type === PAYMENT_TYPES.LISTING_FEE) {
    const listingId = settledPayment.meta?.listingId || settledPayment.listing;
    if (!listingId) return { settled: true, targetMissing: true };
    const listing = await Listing.findOne({ _id: listingId, owner: settledPayment.user });
    if (!listing) return { settled: true, targetMissing: true };
    listing.paymentStatus = PAYMENT_STATUS.PAID;
    const enteredReview = listing.status === LISTING_STATUS.DRAFT;
    if (enteredReview) listing.status = LISTING_STATUS.PENDING_APPROVAL;
    await listing.save();
    // Paying the fee is what pushes a draft into the review queue, so this is
    // the moment the owner should hear that their listing is now with us.
    if (!alreadyPaid && enteredReview) {
      await dispatch("listing_submitted", { userId: listing.owner, data: { listing } });
    }
  } else if (settledPayment.type === PAYMENT_TYPES.SEEKER_POST) {
    const requestId = settledPayment.meta?.seekerRequestId;
    if (!requestId) return { settled: true, targetMissing: true };
    const request = await SeekerRequest.findOne({ _id: requestId, seeker: settledPayment.user });
    if (!request) return { settled: true, targetMissing: true };
    request.status = SEEKER_STATUS.ACTIVE;
    request.postPayment = settledPayment._id;
    await request.save();
    if (!alreadyPaid) await audit({ actor: settledPayment.user, actorRole: "system", action: "seeker.create_paid", targetType: "SeekerRequest", targetId: request._id, meta: { paymentId: settledPayment._id.toString(), amount: settledPayment.amount } });
    // `POST /api/seekers` only fires this when the provider settles inline. A
    // request that went live via the webhook used to do so without a word.
    if (!alreadyPaid) {
      await dispatch("seeker_published", { userId: request.seeker, data: { request } });
    }
  } else if (settledPayment.type === PAYMENT_TYPES.SEEKER_VIEW) {
    const requestId = settledPayment.meta?.seekerRequestId;
    const request = requestId ? await SeekerRequest.findById(requestId) : null;
    const viewer = await User.findById(settledPayment.user);
    if (!request || !viewer) return { settled: true, targetMissing: true };
    const watermark = `${viewer.name} · ${viewer._id.toString().slice(-6)}`;
    try {
      await SeekerUnlock.create({
        viewer: viewer._id,
        seekerRequest: request._id,
        seeker: request.seeker,
        payment: settledPayment._id,
        amountPaid: settledPayment.amount,
        watermark,
      });
      await SeekerRequest.updateOne({ _id: request._id }, { $inc: { unlockCount: 1 } });
      // Someone now has this seeker's phone number. Telling them is the whole
      // point of the view token: it is the difference between a call they were
      // expecting and a cold call from a stranger. Only on a fresh unlock —
      // the duplicate-key path below means it had already been bought.
      await dispatch("seeker_unlocked", { userId: request.seeker, data: { request } });
    } catch (err) {
      if (err?.code !== 11000) throw err;
    }
  } else if (settledPayment.type === PAYMENT_TYPES.COMMISSION) {
    const commissionId = settledPayment.meta?.commissionId;
    const commission = commissionId ? await Commission.findById(commissionId) : null;
    if (!commission) return { settled: true, targetMissing: true };
    const newlyPaid = await Commission.findOneAndUpdate(
      { _id: commission._id, status: { $ne: "paid" } },
      { $set: { status: "paid", payment: settledPayment._id, paidAt: new Date() } },
      { new: false }
    );
    if (newlyPaid) {
      const user = await User.findById(commission.owner);
      if (user) {
        user.commissionDue = Math.max(0, (user.commissionDue || 0) - commission.total);
        await user.save();
      }
    }
  } else if (settledPayment.type === PAYMENT_TYPES.PENALTY) {
    const penaltyId = settledPayment.meta?.penaltyId;
    const penalty = penaltyId ? await Penalty.findById(penaltyId) : null;
    if (!penalty) return { settled: true, targetMissing: true };
    const newlyPaid = await Penalty.findOneAndUpdate(
      { _id: penalty._id, status: { $ne: "paid" } },
      { $set: { status: "paid", payment: settledPayment._id, paidAt: new Date() } },
      { new: false }
    );
    if (newlyPaid) {
      const user = await User.findById(penalty.user);
      if (user) {
        user.penaltyBalance = Math.max(0, (user.penaltyBalance || 0) - penalty.total);
        await user.save();
      }
    }
  }

  if (!alreadyPaid) await audit({ actor: settledPayment.user, actorRole: "system", action: "payment.settled", targetType: "Payment", targetId: settledPayment._id, meta: { type: settledPayment.type, amount: settledPayment.amount } });
  return { settled: true, alreadyPaid };
}
