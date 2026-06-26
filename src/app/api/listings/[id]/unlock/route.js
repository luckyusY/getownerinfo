import { z } from "zod";
import { connectDB } from "@/lib/db";
import Listing from "@/models/Listing";
import Category from "@/models/Category";
import User from "@/models/User";
import Payment from "@/models/Payment";
import TokenUnlock from "@/models/TokenUnlock";
import PlatformSettings, { getSettings } from "@/models/PlatformSettings";
import { DEFAULT_SETTINGS } from "@/data/catalog";
import { getPaymentProvider, isStubPayments } from "@/lib/payments";
import { finalizeUnlock, buildRevealedContact } from "@/lib/unlockService";
import { notify, generateOtp } from "@/lib/notify";
import { ok, fail, requireAuth } from "@/lib/api";
import { audit } from "@/models/AuditLog";
import {
  ROLES,
  LISTING_STATUS,
  PAYMENT_TYPES,
  PAYMENT_STATUS,
  VAT_RATE,
} from "@/lib/constants";

const schema = z.object({ tier: z.enum(["buyer", "tenant", "client"]).default("buyer") });

// POST /api/listings/:id/unlock — begin (and possibly complete) a token unlock.
export async function POST(req, { params }) {
  const guard = requireAuth([ROLES.BUYER, ROLES.ADMIN]);
  if (guard.error) return guard.error;

  let body = {};
  try {
    body = await req.json();
  } catch {
    /* tier defaults to buyer */
  }
  const { tier } = schema.parse({ tier: body?.tier });

  await connectDB();
  const listing = await Listing.findById(params.id);
  if (!listing) return fail("Listing not found", 404);
  if (listing.status !== LISTING_STATUS.ACTIVE) return fail("Listing is not available", 409);
  if (listing.owner.toString() === guard.session.sub) {
    return fail("You cannot unlock your own listing", 400);
  }

  const user = await User.findById(guard.session.sub);

  // Already unlocked? Return the revealed data (idempotent, no new charge).
  const existing = await TokenUnlock.findOne({ user: user._id, listing: listing._id });
  if (existing) {
    return ok({ alreadyUnlocked: true, ...buildRevealedContact(listing, existing.watermark) });
  }

  const settings = await getSettings(PlatformSettings, DEFAULT_SETTINGS);

  // Anti-abuse: daily unlock cap per user.
  const since = new Date(Date.now() - 24 * 3600 * 1000);
  const todayCount = await TokenUnlock.countDocuments({ user: user._id, at: { $gte: since } });
  if (todayCount >= (settings.tokenAccess?.maxUnlocksPerUserPerDay ?? 20)) {
    return fail("Daily unlock limit reached. Try again later.", 429);
  }

  const category = await Category.findById(listing.category);
  const amount = category?.tokenFee?.[tier] ?? 0;
  const vatPortion = Math.round(amount - amount / (1 + (settings.vatRate ?? VAT_RATE)));

  // Create the payment record and initiate with the provider.
  const provider = getPaymentProvider();
  const payment = await Payment.create({
    user: user._id,
    listing: listing._id,
    type: PAYMENT_TYPES.TOKEN_FEE,
    amount,
    vatPortion,
    tier,
    status: PAYMENT_STATUS.PENDING,
    provider: provider.name,
  });

  const init = await provider.initiate({
    amount,
    currency: settings.currency || "Rwf",
    type: PAYMENT_TYPES.TOKEN_FEE,
    reference: payment._id.toString(),
    metadata: { listingId: listing._id.toString(), userId: user._id.toString(), tier },
  });
  payment.providerRef = init.providerRef;
  await payment.save();

  await audit({
    actor: user._id,
    actorRole: guard.session.role,
    action: "payment.initiate",
    targetType: "Payment",
    targetId: payment._id,
    meta: { type: "token_fee", amount, listingId: listing._id.toString() },
  });

  // OTP gate (configurable). Generate, "send", and require it on verify.
  const otpRequired = settings.tokenAccess?.otpRequired ?? true;
  if (otpRequired) {
    const otp = generateOtp();
    payment.otp = otp;
    payment.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await payment.save();
    await notify({
      to: user.email,
      channel: "email",
      subject: "Your getownerinfo unlock code",
      message: `Your verification code is ${otp}. It expires in 10 minutes.`,
    });
    return ok({
      needsOtp: true,
      paymentId: payment._id.toString(),
      amount,
      redirectUrl: init.redirectUrl,
      // In stub/dev mode, surface the OTP so the flow is testable without email.
      ...(isStubPayments() ? { devOtp: otp } : {}),
    });
  }

  // No OTP: if the provider already settled (stub), finalize now.
  if (init.status === "paid") {
    await finalizeUnlock({ payment, listing, user });
    const unlock = await TokenUnlock.findOne({ user: user._id, listing: listing._id });
    return ok({ unlocked: true, ...buildRevealedContact(listing, unlock.watermark) });
  }

  return ok({ needsVerify: true, paymentId: payment._id.toString(), redirectUrl: init.redirectUrl });
}
