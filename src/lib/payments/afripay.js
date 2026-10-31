// AfriPay provider.
//
// AfriPay's checkout is NOT a REST API. It is a browser form POST to
// https://www.afripay.africa/checkout/index.php that answers 302 + a PHPSESSID
// cookie; the checkout page only renders for a request carrying that cookie.
// Probed against the live endpoint on 2026-10-31:
//
//   unknown app_id             -> "This application does not exist"
//   real app_id, wrong secret  -> "Your secret does not match the given application"
//   valid pair                 -> 302, Set-Cookie: PHPSESSID, location: index.php
//   GET without that cookie    -> "Some required params are missing!"
//
// The consequence is architectural: the BUYER'S browser has to perform the POST.
// A server-side POST binds the checkout session to our server rather than to the
// buyer, so there is no URL we could hand them afterwards. initiate() therefore
// returns a local handoff URL whose page auto-submits the real form — see
// src/app/api/payments/[id]/checkout/route.js.
//
// This means app_secret is served to the buyer's browser. That is forced by
// AfriPay's design, not a choice made here: every site on this integration has
// the secret in its page source. Register an app for this project alone and
// treat its secret as public.

import crypto from "crypto";
import { env } from "../env.js";

export const AFRIPAY_CHECKOUT_URL = "https://www.afripay.africa/checkout/index.php";

/**
 * The seven fields AfriPay's checkout requires. Omitting any of them lands on
 * "Some required params are missing!".
 */
export function buildCheckoutFields({ amount, currency, comment, clientToken, returnUrl }) {
  return {
    amount: String(amount),
    // Production sends "RWF"; the app's own settings default to "Rwf", which the
    // endpoint also accepts. Normalise so only one spelling ever goes out.
    currency: String(currency || "RWF").toUpperCase(),
    comment: comment || "Payment",
    client_token: clientToken,
    return_url: returnUrl,
    app_id: env.afripay.appId,
    app_secret: env.afripay.appSecret,
  };
}

export const afripayProvider = {
  name: "afripay",

  async initiate({ amount, currency = "RWF", type, reference, metadata }) {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error(`AfriPay: refusing to initiate a non-positive amount (${amount})`);
    }

    // AfriPay hands back no transaction id at this stage — the POST happens
    // later, in the buyer's browser. So we mint our own reference, send it as
    // client_token, and let it be the providerRef the webhook matches on.
    const providerRef = `afp_${crypto.randomBytes(12).toString("hex")}`;

    return {
      providerRef,
      status: "pending",
      redirectUrl: `${env.appUrl}/api/payments/${providerRef}/checkout`,
      echo: { amount, currency, type, reference, metadata },
    };
  },

  async verify(providerRef) {
    // AfriPay publishes no documented verification endpoint (api.afripay.africa
    // resolves but answers 403, and there are no public docs). Reporting "paid"
    // from here would hand out unlocks for free, so this stays "pending" and
    // settlement is left to the webhook. Once AfriPay supplies an API, implement
    // the real lookup here.
    console.warn(
      `payments.afripay.verify: no verification API available; leaving ${providerRef} pending`
    );
    return { status: "pending" };
  },
};
