import crypto from "crypto";
import { connectDB } from "@/lib/db";
import Listing from "@/models/Listing";
import User from "@/models/User";
import Payment from "@/models/Payment";
import { finalizeUnlock } from "@/lib/unlockService";
import { audit } from "@/models/AuditLog";
import { ok, fail } from "@/lib/api";
import { PAYMENT_TYPES, PAYMENT_STATUS } from "@/lib/constants";
import { settleNonUnlockPayment } from "@/lib/paymentSettlement";

// POST /api/payments/webhook — provider-initiated settlement callback.
//
// This is the authoritative path for marking a payment paid. The client-driven
// /api/payments/:id/verify route is a convenience for the happy path; if the
// buyer closes the tab mid-flow, only this route completes the unlock.
//
// AfriPay's documented callback (from their onboarding email): a POST carrying
// status, amount, currency, transaction_ref, payment_method and client_token —
// the last being whatever we sent in the checkout form, i.e. our providerRef.
// It carries NO signature. So authenticity rests on two things:
//   1. The callback URL we register with AfriPay includes a secret key
//      (?key=<AFRIPAY_SECRET>), compared in constant time. Fails closed when
//      AFRIPAY_SECRET is unset.
//   2. Amount and currency from the callback must equal our own Payment record;
//      a mismatch is never settled.
// Register with AfriPay:  https://<domain>/api/payments/webhook?key=<AFRIPAY_SECRET>
// This is weaker than a signature (the key sits in AfriPay's config and logs),
// so use a long random value and rotate it if it leaks.
//
// The success status string is not documented; the set accepted below is a guess
// to be confirmed against the first real callback (unknown values are logged).
function keyValid(provided) {
  const secret = process.env.AFRIPAY_SECRET || "";
  if (!secret || !provided) return false;
  const a = Buffer.from(secret, "utf8");
  const b = Buffer.from(String(provided), "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

const PAID_STATUSES = new Set(["success", "successful", "completed", "paid"]);
const FAILED_STATUSES = new Set(["failed", "cancelled", "canceled"]);

// JSON or form-encoded — the callback's content type is not documented. Always
// returns a plain object, so a body like `null` or `[]` cannot crash the handler.
async function parseBody(req) {
  const raw = await req.text();
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
    return {};
  } catch {
    return Object.fromEntries(new URLSearchParams(raw));
  }
}

// Keep AfriPay's own reference and the payment method: transaction_ref is the
// only handle on their side of a dispute. Best-effort — a failure to record it
// must never stop a confirmed payment from settling.
async function recordProviderDetails(payment, event) {
  const set = {};
  if (event.transaction_ref) set["meta.transactionRef"] = String(event.transaction_ref).slice(0, 120);
  if (event.payment_method) set.method = String(event.payment_method).slice(0, 40);
  if (!Object.keys(set).length) return;
  try {
    await Payment.updateOne({ _id: payment._id }, { $set: set });
  } catch (err) {
    console.error(`payments.webhook: could not record provider details for ${payment.providerRef}: ${err.message}`);
  }
}

export async function POST(req) {
  if (!keyValid(new URL(req.url).searchParams.get("key"))) {
    console.error("payments.webhook: invalid or missing callback key");
    return fail("Unauthorized", 401);
  }

  const event = await parseBody(req);

  const providerRef = typeof event.client_token === "string" ? event.client_token.trim() : "";
  const status = String(event.status || "").trim().toLowerCase();
  if (!providerRef) return fail("Missing client_token", 422);

  await connectDB();
  const payment = await Payment.findOne({ providerRef });
  if (!payment) {
    // Unknown ref: acknowledge so the provider stops retrying, but log it.
    console.error(`payments.webhook: no payment for providerRef ${providerRef}`);
    return ok({ ignored: true });
  }

  if (FAILED_STATUSES.has(status)) {
    // Only a pending payment can fail. A late or replayed "failed" callback must
    // never downgrade one that has already been paid and acted on.
    const marked = await Payment.updateOne(
      { _id: payment._id, status: PAYMENT_STATUS.PENDING },
      { $set: { status: PAYMENT_STATUS.FAILED } }
    );
    if (!marked.modifiedCount) {
      console.warn(`payments.webhook: ignored "${status}" for ${providerRef}; payment is already ${payment.status}`);
      return ok({ ignored: true });
    }
    await recordProviderDetails(payment, event);
    return ok({ recorded: "failed" });
  }

  if (!PAID_STATUSES.has(status)) {
    console.warn(`payments.webhook: unrecognised status "${event.status}" for ${providerRef}`);
    return ok({ recorded: "pending" });
  }

  // Checked only on the paid path: a failure notice may legitimately carry no
  // amount, but nothing settles unless the provider confirms exactly what we
  // asked for.
  const sameAmount = Number(event.amount) === Number(payment.amount);
  const sameCurrency =
    String(event.currency || "").trim().toUpperCase() === String(payment.currency || "RWF").toUpperCase();
  if (!sameAmount || !sameCurrency) {
    console.error(
      `payments.webhook: mismatch for ${providerRef}: got ${event.amount} ${event.currency}, expected ${payment.amount} ${payment.currency}`
    );
    return fail("Amount or currency mismatch", 422);
  }

  await recordProviderDetails(payment, event);

  // Other payment types use resumable idempotent settlement below. Token
  // payments still run finalization so a retry can complete a partially failed
  // access-log write after the provider marked the payment paid.
  if (payment.status === PAYMENT_STATUS.PAID && payment.type !== PAYMENT_TYPES.TOKEN_FEE) {
    const result = await settleNonUnlockPayment(payment);
    return ok({ alreadyPaid: true, targetMissing: Boolean(result.targetMissing) });
  }

  // Amounts come from our own record, never from the callback body.
  if (payment.type !== PAYMENT_TYPES.TOKEN_FEE) {
    const result = await settleNonUnlockPayment(payment);
    return ok({ recorded: result.alreadyPaid ? "already_paid" : "paid", targetMissing: Boolean(result.targetMissing) });
  }

  const listing = await Listing.findById(payment.listing);
  const user = await User.findById(payment.user);
  if (!listing || !user) {
    console.error(`payments.webhook: listing/user missing for payment ${payment._id}`);
    return ok({ ignored: true });
  }

  // finalizeUnlock is idempotent — safe under duplicate webhook delivery.
  await finalizeUnlock({ payment, listing, user });
  await audit({
    actor: user._id,
    actorRole: "system",
    action: "payment.webhook_unlock",
    targetType: "Payment",
    targetId: payment._id,
    meta: { listingId: listing._id.toString(), amount: payment.amount },
  });

  return ok({ recorded: "unlocked" });
}
