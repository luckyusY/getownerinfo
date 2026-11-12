import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { connectDB } from "@/lib/db";
import Payment from "@/models/Payment";
import { PAYMENT_TYPES } from "@/lib/constants";

// GET|POST /api/payments/return — where AfriPay sends the buyer back to after
// checkout (the return_url we post in src/app/api/payments/[id]/checkout).
//
// This route deliberately changes NO state. A browser redirect is attacker-
// controllable — anyone can open this URL with any query string — so it must
// never mark a payment paid. Settlement belongs to the webhook.
//
// What AfriPay appends to return_url is not documented, and the DASIA site this
// integration was reverse-engineered from ignores it entirely. So the handler
// logs the full inbound shape: the first few real returns will show the actual
// contract, and the webhook/verify path can then be written against fact rather
// than guesswork.
export const dynamic = "force-dynamic";

// Where each kind of payment was started from, so the buyer lands back there.
const RETURN_PATHS = {
  [PAYMENT_TYPES.LISTING_FEE]: "/dashboard/listings",
  [PAYMENT_TYPES.SEEKER_POST]: "/dashboard/requests",
  [PAYMENT_TYPES.SEEKER_VIEW]: "/seekers",
  [PAYMENT_TYPES.COMMISSION]: "/dashboard/invoices",
  [PAYMENT_TYPES.PENALTY]: "/dashboard/invoices",
};

/**
 * Send the buyer back to what they were paying for.
 *
 * Everything used to land on /dashboard, so a buyer who paid to unlock a
 * listing came back to a page with no sign of it and had to find the listing
 * again. A token payment now returns to its listing with ?payment=<id>, which
 * the unlock panel picks up to wait for the confirmation and reveal the
 * contact in place.
 *
 * The ref is only used to look the payment up; nothing is changed. A forged or
 * unknown ref just lands on the dashboard.
 */
async function destinationFor(ref) {
  const fallback = new URL("/dashboard", env.appUrl);
  fallback.searchParams.set("payment", "returned");
  if (!ref || !/^afp_[a-f0-9]{24}$/.test(ref)) return fallback;

  try {
    await connectDB();
    const payment = await Payment.findOne({ providerRef: ref }).select("type listing").lean();
    if (!payment) return fallback;

    if (payment.type === PAYMENT_TYPES.TOKEN_FEE && payment.listing) {
      const dest = new URL(`/listings/${payment.listing}`, env.appUrl);
      dest.searchParams.set("payment", payment._id.toString());
      return dest;
    }
    const dest = new URL(RETURN_PATHS[payment.type] || "/dashboard", env.appUrl);
    dest.searchParams.set("payment", "returned");
    return dest;
  } catch (err) {
    // Never strand the buyer on an error page over a redirect.
    console.error("payments.return: lookup failed:", err?.message || err);
    return fallback;
  }
}

async function handle(req) {
  const url = new URL(req.url);
  const query = Object.fromEntries(url.searchParams.entries());

  let body = null;
  if (req.method === "POST") {
    try {
      const raw = await req.text();
      body = raw.slice(0, 2000);
    } catch {
      /* body is best-effort; never fail the redirect over it */
    }
  }

  // TODO: once these logs show AfriPay's real return contract, replace this with
  // a proper status lookup. Until then it is the only record of what they send.
  console.info(
    "payments.afripay.return:",
    JSON.stringify({ method: req.method, query, body })
  );

  const ref = query.ref || "";
  const dest = await destinationFor(ref);
  return NextResponse.redirect(dest, { status: 303 });
}

export async function GET(req) {
  return handle(req);
}

export async function POST(req) {
  return handle(req);
}
