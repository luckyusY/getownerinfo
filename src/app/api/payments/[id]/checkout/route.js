import { connectDB } from "@/lib/db";
import Payment from "@/models/Payment";
import { fail, requireAuth } from "@/lib/api";
import { PAYMENT_STATUS } from "@/lib/constants";
import { env } from "@/lib/env";
import { AFRIPAY_CHECKOUT_URL, buildCheckoutFields } from "@/lib/payments/afripay";

// GET /api/payments/:ref/checkout — hand the buyer off to AfriPay.
//
// :ref is the providerRef minted by afripayProvider.initiate(), not a Payment
// _id: initiate() has to return a URL before the Payment row exists.
//
// This renders a self-submitting form rather than redirecting, because AfriPay's
// checkout answers the POST with a PHPSESSID cookie and only renders for a
// request carrying it. The POST has to come from the buyer's browser so the
// session lands there; see src/lib/payments/afripay.js.
//
// The page therefore contains app_secret. AfriPay's design leaves no way around
// that, so it is served no-store and only to the signed-in owner of the payment.
export const dynamic = "force-dynamic";

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function GET(req, { params }) {
  const guard = requireAuth();
  if (guard.error) return guard.error;

  const providerRef = params.id;
  if (!providerRef?.startsWith("afp_")) return fail("Unknown checkout reference", 404);

  await connectDB();
  const payment = await Payment.findOne({ providerRef });
  if (!payment) return fail("Payment not found", 404);
  if (payment.user.toString() !== guard.session.sub) return fail("Forbidden", 403);
  if (payment.status === PAYMENT_STATUS.PAID) {
    return fail("This payment has already been settled", 409);
  }
  if (payment.status !== PAYMENT_STATUS.PENDING) {
    return fail(`Payment is ${payment.status} and cannot be paid`, 409);
  }

  const fields = buildCheckoutFields({
    amount: payment.amount,
    currency: payment.currency,
    comment: payment.type,
    clientToken: providerRef,
    returnUrl: `${env.appUrl}/api/payments/return?ref=${encodeURIComponent(providerRef)}`,
  });

  const inputs = Object.entries(fields)
    .map(([name, value]) => `<input type="hidden" name="${esc(name)}" value="${esc(value)}">`)
    .join("\n    ");

  // noscript keeps the flow usable without JS; the button is the same form.
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>Redirecting to AfriPay…</title>
  <style>
    body { font-family: system-ui, sans-serif; display: grid; place-items: center;
           min-height: 100vh; margin: 0; color: #1f2937; background: #f9fafb; }
    .box { text-align: center; padding: 2rem; }
    button { font: inherit; padding: .6rem 1.2rem; border-radius: .5rem;
             border: 1px solid #4338ca; background: #4f46e5; color: #fff; cursor: pointer; }
  </style>
</head>
<body>
  <div class="box">
    <p>Taking you to AfriPay to pay ${esc(fields.amount)} ${esc(fields.currency)}…</p>
    <form id="afripay" method="post" action="${esc(AFRIPAY_CHECKOUT_URL)}">
    ${inputs}
      <noscript><button type="submit">Continue to AfriPay</button></noscript>
    </form>
  </div>
  <script>document.getElementById("afripay").submit();</script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store, no-cache, must-revalidate",
      "referrer-policy": "no-referrer",
    },
  });
}
