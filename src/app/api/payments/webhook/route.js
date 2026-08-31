import crypto from "crypto";
import { connectDB } from "@/lib/db";
import Listing from "@/models/Listing";
import User from "@/models/User";
import Payment from "@/models/Payment";
import { finalizeUnlock } from "@/lib/unlockService";
import { audit } from "@/models/AuditLog";
import { ok, fail } from "@/lib/api";
import { PAYMENT_TYPES, PAYMENT_STATUS } from "@/lib/constants";

// POST /api/payments/webhook — provider-initiated settlement callback.
//
// This is the authoritative path for marking a payment paid. The client-driven
// /api/payments/:id/verify route is a convenience for the happy path; if the
// buyer closes the tab mid-flow, only this route completes the unlock.
//
// TODO: confirm the signature header name and digest scheme against the chosen
// provider's docs before going live. The HMAC-SHA256-over-raw-body scheme below
// is what IremboPay, Paypack, and Flutterwave all use, but the header differs.
const SIGNATURE_HEADER = "x-payment-signature";

function signatureValid(rawBody, header) {
  const secret = process.env.AFRIPAY_SECRET || "";
  if (!secret) return false;
  if (!header) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(String(header).replace(/^sha256=/, ""), "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function POST(req) {
  // Read the raw body — the signature is over exact bytes, so we cannot use
  // req.json() first.
  const raw = await req.text();

  if (!signatureValid(raw, req.headers.get(SIGNATURE_HEADER))) {
    console.error("payments.webhook: invalid or missing signature");
    return fail("Invalid signature", 401);
  }

  let event;
  try {
    event = JSON.parse(raw);
  } catch {
    return fail("Invalid JSON body", 400);
  }

  const providerRef = event.id || event.transaction_id || event.reference;
  const status = String(event.status || "").toLowerCase();
  if (!providerRef) return fail("Missing transaction reference", 422);

  await connectDB();
  const payment = await Payment.findOne({ providerRef });
  if (!payment) {
    // Unknown ref: acknowledge so the provider stops retrying, but log it.
    console.error(`payments.webhook: no payment for providerRef ${providerRef}`);
    return ok({ ignored: true });
  }

  // Idempotent: a duplicate delivery for an already-settled payment is a no-op.
  if (payment.status === PAYMENT_STATUS.PAID) return ok({ alreadyPaid: true });

  if (status === "failed" || status === "cancelled") {
    payment.status = PAYMENT_STATUS.FAILED;
    await payment.save();
    return ok({ recorded: "failed" });
  }

  const paid = status === "success" || status === "completed" || status === "paid";
  if (!paid) return ok({ recorded: "pending" });

  // Amounts come from our own record, never from the callback body.
  if (payment.type !== PAYMENT_TYPES.TOKEN_FEE) {
    payment.status = PAYMENT_STATUS.PAID;
    await payment.save();
    await audit({
      actor: payment.user,
      actorRole: "system",
      action: "payment.webhook_paid",
      targetType: "Payment",
      targetId: payment._id,
      meta: { type: payment.type, amount: payment.amount },
    });
    return ok({ recorded: "paid" });
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
