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
 * Scheduled daily in `vercel.json`, which is all a Hobby plan permits — a
 * sub-daily expression is not throttled, it is rejected, and the whole deploy
 * fails with it. Daily is therefore the floor this repo can carry on its own,
 * and it makes this sweep a true backstop: a lost webhook that the user never
 * returns to settle waits up to a day.
 *
 * To settle those in minutes instead, point an external scheduler (cron-job.org,
 * a GitHub Actions schedule, any host's cron) at this route every five minutes
 * with CRON_SECRET in the Authorization header. That is the intended route to
 * a faster sweep without a Vercel plan change; nothing here needs to change
 * for it, and the daily run stays as a floor if the scheduler goes quiet.
 */

// Each payment costs one round trip to the provider, and they are deliberately
// sequential so a sweep cannot hammer the provider with a burst. 60s leaves
// room for a slow provider without the platform's default cutting a run in
// half and leaving the batch half-reconciled.
export const maxDuration = 60;

// How far back to look. Beyond this a pending payment is stale enough that the
// provider has almost certainly abandoned it, and re-verifying every one of
// them forever would grow without limit.
const LOOKBACK_HOURS = 48;
// Sized to finish inside `maxDuration` rather than to drain the queue: at one
// run every five minutes this clears 300 an hour, and the oldest are taken
// first, so anything left over is picked up by the next run.
const BATCH = 25;

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
