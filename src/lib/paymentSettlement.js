import Payment from "@/models/Payment";
import Listing from "@/models/Listing";
import SeekerRequest, { SEEKER_STATUS } from "@/models/SeekerRequest";
import SeekerUnlock from "@/models/SeekerUnlock";
import Commission from "@/models/Commission";
import Penalty from "@/models/Penalty";
import User from "@/models/User";
import { audit } from "@/models/AuditLog";
import { PAYMENT_STATUS, PAYMENT_TYPES, LISTING_STATUS } from "@/lib/constants";

// Complete the application-side effect of a provider-confirmed payment.
// The conditional status update ensures webhook/verify races settle only once.
export async function settleNonUnlockPayment(payment) {
  const claimed = await Payment.findOneAndUpdate(
    { _id: payment._id, status: { $ne: PAYMENT_STATUS.PAID } },
    { $set: { status: PAYMENT_STATUS.PAID } },
    { new: true }
  );
  const alreadyPaid = !claimed;
  const settledPayment = claimed || await Payment.findById(payment._id);
  if (!settledPayment) return { alreadyPaid, targetMissing: true };

  if (settledPayment.type === PAYMENT_TYPES.LISTING_FEE) {
    const listingId = settledPayment.meta?.listingId || settledPayment.listing;
    if (!listingId) return { settled: true, targetMissing: true };
    const listing = await Listing.findOne({ _id: listingId, owner: settledPayment.user });
    if (!listing) return { settled: true, targetMissing: true };
    listing.paymentStatus = PAYMENT_STATUS.PAID;
    if (listing.status === LISTING_STATUS.DRAFT) listing.status = LISTING_STATUS.PENDING_APPROVAL;
    await listing.save();
  } else if (settledPayment.type === PAYMENT_TYPES.SEEKER_POST) {
    const requestId = settledPayment.meta?.seekerRequestId;
    if (!requestId) return { settled: true, targetMissing: true };
    const request = await SeekerRequest.findOne({ _id: requestId, seeker: settledPayment.user });
    if (!request) return { settled: true, targetMissing: true };
    request.status = SEEKER_STATUS.ACTIVE;
    request.postPayment = settledPayment._id;
    await request.save();
    if (!alreadyPaid) await audit({ actor: settledPayment.user, actorRole: "system", action: "seeker.create_paid", targetType: "SeekerRequest", targetId: request._id, meta: { paymentId: settledPayment._id.toString(), amount: settledPayment.amount } });
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
