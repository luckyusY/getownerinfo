import { connectDB } from "@/lib/db";
import Penalty from "@/models/Penalty";
import Payment from "@/models/Payment";
import User from "@/models/User";
import { safeInitiate, safeVerify } from "@/lib/payments";
import { audit } from "@/models/AuditLog";
import { ok, fail, requireAuth } from "@/lib/api";
import { PAYMENT_TYPES, PAYMENT_STATUS } from "@/lib/constants";

// POST /api/penalties/:id/pay — offender settles a penalty.
export async function POST(_req, { params }) {
  const guard = requireAuth();
  if (guard.error) return guard.error;

  await connectDB();
  const penalty = await Penalty.findById(params.id);
  if (!penalty) return fail("Penalty not found", 404);
  if (penalty.user.toString() !== guard.session.sub) return fail("Forbidden", 403);
  if (penalty.status !== "active") return fail(`Penalty is '${penalty.status}'`, 409);

  const init = await safeInitiate({
    amount: penalty.total,
    type: PAYMENT_TYPES.PENALTY,
    reference: penalty._id.toString(),
    metadata: { penaltyId: penalty._id.toString() },
  });
  if (!init.ok) {
    return fail("Payment could not be processed right now. Please try again later.", 502);
  }

  const payment = await Payment.create({
    user: penalty.user,
    listing: penalty.listing,
    type: PAYMENT_TYPES.PENALTY,
    amount: penalty.total,
    status: PAYMENT_STATUS.PENDING,
    provider: init.provider.name,
    providerRef: init.providerRef,
  });

  const verified = init.status === "paid" ? { ok: true, status: "paid" } : await safeVerify(init.providerRef);
  if (!verified.ok || verified.status !== "paid") {
    payment.status = PAYMENT_STATUS.PENDING;
    await payment.save();
    return ok({ pending: true, paymentId: payment._id.toString(), redirectUrl: init.redirectUrl });
  }

  payment.status = PAYMENT_STATUS.PAID;
  await payment.save();

  penalty.status = "paid";
  penalty.payment = payment._id;
  penalty.paidAt = new Date();
  await penalty.save();

  const user = await User.findById(penalty.user);
  user.penaltyBalance = Math.max(0, (user.penaltyBalance || 0) - penalty.total);
  await user.save();

  await audit({
    actor: guard.session.sub,
    actorRole: guard.session.role,
    action: "penalty.pay",
    targetType: "Penalty",
    targetId: penalty._id,
    meta: { total: penalty.total },
  });

  return ok({ paid: true, penaltyBalance: user.penaltyBalance });
}
