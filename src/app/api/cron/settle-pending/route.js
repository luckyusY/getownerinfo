import { connectDB } from "@/lib/db";
import Payment from "@/models/Payment";
import { audit } from "@/models/AuditLog";
import { safeVerify } from "@/lib/payments";
import { settleNonUnlockPayment } from "@/lib/paymentSettlement";
import { ok, fail } from "@/lib/api";
import { PAYMENT_STATUS, PAYMENT_TYPES } from "@/lib/constants";

/**
 * GET /api/cron/settle-pending — reconcile payments the provider never told us
 * about.
 *
 * A mobile-money payment leaves this app as `pending` and comes back one of
 * two ways: the provider's webhook, or the user returning to the page and
 * pressing "I have paid". When the webhook is lost and the user does not come
 * back, the payment sits pending forever — their request never goes live,
 * their listing never reaches the review queue, and nothing tells them why.
 * This sweep asks the provider about each one and finishes the job, which is
 * also what raises the notifications for it.
 *
 * Token-fee unlocks are deliberately excluded. Those sit behind a phone OTP
 * (see `POST /api/payments/:id/verify`), and settling one from a background
 * job would hand over the owner's contact without that gate ever being
 * passed. They stay pending until the buyer confirms in person.
 *
 * Schedule: register in `vercel.json` alongside the daily job. Every five
 * minutes (`asterisk-slash-5 * * * *`) is what makes this feel immediate, and
 * needs a Vercel plan that permits sub-daily crons; on Hobby the expression
 * must be daily or the deploy is rejected. The route is equally callable by
 * any external scheduler holding CRON_SECRET.
 */

// How far back to look. Beyond this a pending payment is stale enough that the
// provider has almost certainly abandoned it, and re-verifying every one of
// them forever would grow without limit.
const LOOKBACK_HOURS = 48;
// Cap the batch so one run cannot exceed the function timeout; the next run
// picks up whatever is left.
const BATCH = 100;

function authorized(req) {
  const secret = process.env.CRON_SECRET;
  // Without a configured secret the endpoint stays closed rather than open.
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req) {
  if (!authorized(req)) return fail("Unauthorized", 401);

  await connectDB();
  const since = new Date(Date.now() - LOOKBACK_HOURS * 3600 * 1000);

  const pending = await Payment.find({
    status: PAYMENT_STATUS.PENDING,
    type: { $ne: PAYMENT_TYPES.TOKEN_FEE },
    createdAt: { $gte: since },
    providerRef: { $nin: [null, ""] },
  })
    .sort({ createdAt: 1 })
    .limit(BATCH);

  let settled = 0;
  let failed = 0;
  let stillPending = 0;
  let unreachable = 0;

  for (const payment of pending) {
    const result = await safeVerify(payment.providerRef);

    // A provider we cannot reach is not a failed payment. Leaving it pending
    // means the next run tries again, rather than writing off money the user
    // may well have paid.
    if (!result.ok) {
      unreachable += 1;
      continue;
    }

    if (result.status === "paid") {
      // Raises the notifications for whatever the payment was for.
      await settleNonUnlockPayment(payment);
      settled += 1;
    } else if (result.status === "failed") {
      payment.status = PAYMENT_STATUS.FAILED;
      await payment.save();
      failed += 1;
    } else {
      stillPending += 1;
    }
  }

  if (settled || failed) {
    await audit({
      actorRole: "system",
      action: "cron.payments_reconciled",
      targetType: "Payment",
      meta: { settled, failed, stillPending, unreachable, examined: pending.length },
    });
  }

  return ok({ examined: pending.length, settled, failed, stillPending, unreachable });
}
