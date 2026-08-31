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

const schema = z.object({ otp: z.string().optional() });
const MAX_OTP_ATTEMPTS = 5;

// POST /api/payments/:id/verify — confirm a payment (with OTP if required) and,
// for token-fee payments, finalize the unlock and reveal the gated fields.
export async function POST(req, { params }) {
  const guard = requireAuth();
  if (guard.error) return guard.error;

  let body = {};
  try {
    body = await req.json();
  } catch {
    /* otp optional */
  }
  const { otp } = schema.parse(body || {});

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
    if ((payment.otpAttempts || 0) >= MAX_OTP_ATTEMPTS) {
      return fail("Too many incorrect codes. Restart the unlock.", 429);
    }
    if (!verifyOtp(otp, payment.otp)) {
      payment.otpAttempts = (payment.otpAttempts || 0) + 1;
      await payment.save();
      return fail("Incorrect OTP", 401);
    }
  }

  // Confirm with the provider (stub returns paid).
  const result = await safeVerify(payment.providerRef);
  if (!result.ok) {
    return fail("Payment could not be verified right now. Please try again later.", 502);
  }
  if (result.status !== "paid") {
    if (result.status === "failed") {
      payment.status = PAYMENT_STATUS.FAILED;
      await payment.save();
      return fail("Payment failed", 402);
    }
    return fail("Payment still pending", 402);
  }

  // Clear the OTP once consumed.
  payment.otp = undefined;
  payment.otpExpiresAt = undefined;

  if (payment.type !== PAYMENT_TYPES.TOKEN_FEE) {
    payment.status = PAYMENT_STATUS.PAID;
    await payment.save();
    return ok({ paid: true });
  }

  const listing = await Listing.findById(payment.listing);
  if (!listing) return fail("Listing not found", 404);
  const user = await User.findById(payment.user);

  await finalizeUnlock({ payment, listing, user });
  const unlock = await TokenUnlock.findOne({ user: user._id, listing: listing._id });

  return ok({ unlocked: true, ...buildRevealedContact(listing, unlock.watermark) });
}
