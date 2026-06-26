import { connectDB } from "@/lib/db";
import SeekerRequest, { SEEKER_STATUS } from "@/models/SeekerRequest";
import SeekerUnlock from "@/models/SeekerUnlock";
import User from "@/models/User";
import Payment from "@/models/Payment";
import PlatformSettings, { getSettings } from "@/models/PlatformSettings";
import { DEFAULT_SETTINGS } from "@/data/catalog";
import { safeInitiate, safeVerify } from "@/lib/payments";
import { audit } from "@/models/AuditLog";
import { buildSeekerContact } from "../route";
import { ok, fail, requireAuth } from "@/lib/api";
import { ROLES, PAYMENT_TYPES, PAYMENT_STATUS } from "@/lib/constants";

// POST /api/seekers/:id/unlock — pay the view token to reveal seeker contact.
export async function POST(_req, { params }) {
  const guard = requireAuth([ROLES.OWNER, ROLES.BUYER, ROLES.ADMIN, ROLES.MANAGER]);
  if (guard.error) return guard.error;

  await connectDB();
  const request = await SeekerRequest.findById(params.id);
  if (!request) return fail("Request not found", 404);
  if (request.seeker.toString() === guard.session.sub) {
    return fail("You cannot unlock your own request", 400);
  }
  if (request.status !== SEEKER_STATUS.ACTIVE || request.expiresAt < new Date()) {
    return fail("Request is not available", 409);
  }

  const viewer = await User.findById(guard.session.sub);

  // Idempotent.
  const existing = await SeekerUnlock.findOne({ viewer: viewer._id, seekerRequest: request._id });
  if (existing) {
    return ok({ alreadyUnlocked: true, ...buildSeekerContact(request, existing.watermark) });
  }

  const settings = await getSettings(PlatformSettings, DEFAULT_SETTINGS);
  const amount = settings.seeker?.viewToken ?? 10_000;

  const init = await safeInitiate({
    amount,
    type: PAYMENT_TYPES.SEEKER_VIEW,
    reference: `${request._id.toString()}:${viewer._id.toString()}`,
    metadata: { seekerRequestId: request._id.toString() },
  });
  if (!init.ok) {
    return fail("Payment could not be processed right now. Please try again later.", 502);
  }

  const payment = await Payment.create({
    user: viewer._id,
    type: PAYMENT_TYPES.SEEKER_VIEW,
    amount,
    status: PAYMENT_STATUS.PENDING,
    provider: init.provider.name,
    providerRef: init.providerRef,
    meta: { seekerRequestId: request._id.toString() },
  });

  const verified = init.status === "paid" ? { ok: true, status: "paid" } : await safeVerify(init.providerRef);
  if (!verified.ok || verified.status !== "paid") {
    payment.status = PAYMENT_STATUS.PENDING;
    await payment.save();
    return ok({ needsPayment: true, paymentId: payment._id.toString(), redirectUrl: init.redirectUrl });
  }
  payment.status = PAYMENT_STATUS.PAID;
  await payment.save();

  const watermark = `${viewer.name} · ${viewer._id.toString().slice(-6)}`;
  await SeekerUnlock.create({
    viewer: viewer._id,
    seekerRequest: request._id,
    seeker: request.seeker,
    payment: payment._id,
    amountPaid: amount,
    watermark,
  });
  await SeekerRequest.updateOne({ _id: request._id }, { $inc: { unlockCount: 1 } });

  await audit({
    actor: viewer._id,
    actorRole: guard.session.role,
    action: "seeker.unlock",
    targetType: "SeekerRequest",
    targetId: request._id,
    meta: { amount },
  });

  return ok({ unlocked: true, ...buildSeekerContact(request, watermark) });
}
