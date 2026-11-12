import { z } from "zod";
import { connectDB } from "@/lib/db";
import Listing from "@/models/Listing";
import User from "@/models/User";
import Payment from "@/models/Payment";
import TokenUnlock from "@/models/TokenUnlock";
import { safeVerify } from "@/lib/payments";
import { finalizeUnlock, buildRevealedContact } from "@/lib/unlockService";
import { verifyOtp } from "@/lib/notify";
import { ok, fail, requireAuth } from "@/lib/api";
import { PAYMENT_TYPES, PAYMENT_STATUS } from "@/lib/constants";
import { settleNonUnlockPayment } from "@/lib/paymentSettlement";

const schema = z.object({ otp: z.string().optional() });

/** Where a still-unpaid payment is paid. Only hosted checkouts have one. */
function checkoutUrlFor(payment) {
  if (payment.provider === "afripay" && payment.providerRef) {
    // A path, so it stays on the host the buyer is signed in on.
    return `/api/payments/${encodeURIComponent(payment.providerRef)}/checkout`;
  }
  return null;
}
const MAX_OTP_ATTEMPTS = 5;

// POST /api/payments/:id/verify — confirm a payment (with OTP if required) and,
// for token-fee payments, finalize the unlock and reveal the gated fields.
export async function POST(req, { params }) {
  const guard = await requireAuth();
  if (guard.error) return guard.error;

  let body = {};
  try {
    body = await req.json();
  } catch {
    /* otp optional */
  }
  const parsedBody = schema.safeParse(body || {});
  if (!parsedBody.success) return fail("OTP must be a string", 422);
  const { otp } = parsedBody.data;
  if (!/^[a-f\d]{24}$/i.test(params.id)) return fail("Payment not found", 404);

  await connectDB();
  // Need otp fields, normally select:false.
  const payment = await Payment.findById(params.id).select("+otp +otpExpiresAt +otpAttempts");
  if (!payment) return fail("Payment not found", 404);
  if (payment.user.toString() !== guard.session.sub) return fail("Forbidden", 403);

  // OTP check (if one was issued). Stored as an HMAC, compared in constant time,
  // with a hard attempt cap so a 6-digit code can't be brute-forced.
  if (payment.otp) {
    if (!otp) return fail("OTP required", 422);
    if (payment.otpExpiresAt && payment.otpExpiresAt < new Date()) {
      return fail("OTP expired. Restart the unlock.", 410);
    }
    // Spend an attempt BEFORE comparing, in one atomic update. Reading the
    // counter, comparing, then saving let a burst of parallel requests all see
    // "0 attempts" and try far more than five codes against a 6-digit OTP.
    const claimed = await Payment.updateOne(
      { _id: payment._id, otpAttempts: { $not: { $gte: MAX_OTP_ATTEMPTS } } },
      { $inc: { otpAttempts: 1 } }
    );
    if (!claimed.modifiedCount) {
      return fail("Too many incorrect codes. Restart the unlock.", 429);
    }
    if (!verifyOtp(otp, payment.otp)) {
      return fail("Incorrect OTP", 401);
    }
  }

  // Confirm with the provider (stub returns paid). A payment the webhook has
  // already settled needs no second opinion — and AfriPay has no verification
  // API to give one, so asking would answer "pending" forever and leave a buyer
  // who really paid stuck on this screen.
  const result =
    payment.status === PAYMENT_STATUS.PAID
      ? { ok: true, status: "paid" }
      : await safeVerify(payment.providerRef);
  if (!result.ok) {
    return fail("Payment could not be verified right now. Please try again later.", 502);
  }
  if (result.status !== "paid") {
    if (result.status === "failed") {
      // Only a pending payment can fail; never overwrite one settled meanwhile.
      await Payment.updateOne(
        { _id: payment._id, status: PAYMENT_STATUS.PENDING },
        { $set: { status: PAYMENT_STATUS.FAILED } }
      );
      return fail("Payment failed", 402);
    }

    // The code was right but the money has not arrived. With a hosted checkout
    // (AfriPay) that is the normal order of events: the buyer proves it is them
    // first, then pays. This branch used to answer only "Payment still
    // pending", never offered the checkout, and left the code live — so a
    // buyer could type the correct code forever and never be shown where to
    // pay. Mark the code as passed, so the background checks that follow need
    // no code, and hand back the checkout to pay on.
    if (payment.otp) {
      await Payment.updateOne(
        { _id: payment._id },
        {
          $unset: { otp: "", otpExpiresAt: "" },
          $set: { "meta.otpVerifiedAt": new Date() },
        }
      );
    }
    return fail("Code confirmed. Complete the payment to unlock the contact.", 402, {
      needsPayment: true,
      redirectUrl: checkoutUrlFor(payment),
    });
  }

  // Clear the OTP once consumed.
  payment.otp = undefined;
  payment.otpExpiresAt = undefined;

  if (payment.type !== PAYMENT_TYPES.TOKEN_FEE) {
    const result = await settleNonUnlockPayment(payment);
    return ok({ paid: true, alreadyPaid: Boolean(result.alreadyPaid), targetMissing: Boolean(result.targetMissing) });
  }

  const listing = await Listing.findById(payment.listing);
  if (!listing) return fail("Listing not found", 404);
  const user = await User.findById(payment.user);

  await finalizeUnlock({ payment, listing, user });
  const unlock = await TokenUnlock.findOne({ user: user._id, listing: listing._id });

  return ok({
    unlocked: true,
    unlockId: unlock._id.toString(),
    ...buildRevealedContact(listing, unlock.watermark),
  });
}
