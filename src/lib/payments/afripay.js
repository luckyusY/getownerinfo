// AfriPay provider. Skeleton against the documented contract; endpoint paths and
// payloads are placeholders to be confirmed against AfriPay's API docs. Activated
// automatically once AFRIPAY_BASE_URL + AFRIPAY_API_KEY are set in the env.

import { env } from "../env.js";

async function afripayFetch(path, options = {}) {
  const res = await fetch(`${env.afripay.baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.afripay.apiKey}`,
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`AfriPay ${res.status}: ${text}`);
  }
  return res.json();
}

export const afripayProvider = {
  name: "afripay",

  async initiate({ amount, currency = "Rwf", type, reference, metadata }) {
    // TODO: confirm endpoint + payload shape against AfriPay docs.
    const data = await afripayFetch("/v1/payments", {
      method: "POST",
      body: JSON.stringify({
        amount,
        currency,
        reference,
        description: type,
        metadata,
        callback_url: `${env.appUrl}/api/payments/webhook`,
      }),
    });
    return {
      providerRef: data.id || data.transaction_id,
      status: data.status === "success" ? "paid" : "pending",
      redirectUrl: data.payment_url || data.redirect_url || null,
    };
  },

  async verify(providerRef) {
    const data = await afripayFetch(`/v1/payments/${providerRef}`);
    const paid = data.status === "success" || data.status === "completed";
    return { status: paid ? "paid" : data.status === "failed" ? "failed" : "pending" };
  },
};
