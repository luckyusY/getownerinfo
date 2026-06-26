import { connectDB } from "@/lib/db";
import Commission from "@/models/Commission";
import Payment from "@/models/Payment";
import User from "@/models/User";
import { safeInitiate, safeVerify } from "@/lib/payments";
import { audit } from "@/models/AuditLog";
import { ok, fail, requireAuth } from "@/lib/api";
import { ROLES, PAYMENT_TYPES, PAYMENT_STATUS } from "@/lib/constants";

// POST /api/commissions/:id/pay — owner settles a commission invoice.
export async function POST(_req, { params }) {
  const guard = requireAuth([ROLES.OWNER, ROLES.ADMIN]);
  if (guard.error) return guard.error;

  await connectDB();
  const commission = await Commission.findById(params.id);
  if (!commission) return fail("Commission not found", 404);
  if (commission.owner.toString() !== guard.session.sub && guard.session.role !== ROLES.ADMIN) {
    return fail("Forbidden", 403);
  }
  if (commission.status === "paid") return fail("Commission already paid", 409);

  const init = await safeInitiate({
    amount: commission.total,
    type: PAYMENT_TYPES.COMMISSION,
    reference: commission._id.toString(),
    metadata: { commissionId: commission._id.toString() },
  });
  if (!init.ok) {
    return fail("Payment could not be processed right now. Please try again later.", 502);
  }

  const payment = await Payment.create({
    user: commission.owner,
    listing: commission.listing,
    type: PAYMENT_TYPES.COMMISSION,
    amount: commission.total,
    vatPortion: commission.vatPortion,
    status: PAYMENT_STATUS.PENDING,
    provider: init.provider.name,
    providerRef: init.providerRef,
  });

  // Stub settles immediately; real provider would settle via webhook/verify.
  const verified = init.status === "paid" ? { ok: true, status: "paid" } : await safeVerify(init.providerRef);
  if (!verified.ok || verified.status !== "paid") {
    payment.status = PAYMENT_STATUS.PENDING;
    await payment.save();
    return ok({ pending: true, paymentId: payment._id.toString(), redirectUrl: init.redirectUrl });
  }

  payment.status = PAYMENT_STATUS.PAID;
  await payment.save();

  commission.status = "paid";
  commission.payment = payment._id;
  commission.paidAt = new Date();
  await commission.save();

  // Reduce the owner's outstanding balance (never below zero).
  const owner = await User.findById(commission.owner);
  owner.commissionDue = Math.max(0, (owner.commissionDue || 0) - commission.total);
  await owner.save();

  await audit({
    actor: guard.session.sub,
    actorRole: guard.session.role,
    action: "commission.pay",
    targetType: "Commission",
    targetId: commission._id,
    meta: { amount: commission.total },
  });

  return ok({ paid: true, commissionDue: owner.commissionDue });
}
