// Payment provider abstraction. Swaps between a real AfriPay client (when
// credentials are configured) and a local stub that auto-approves — so the whole
// unlock/commission flow is testable end-to-end before AfriPay keys exist.
//
// Provider contract:
//   initiate({ amount, currency, type, reference, metadata })
//     -> { providerRef, status: 'pending'|'paid', redirectUrl?: string }
//   verify(providerRef)
//     -> { status: 'pending'|'paid'|'failed' }

import { env } from "../env.js";
import { afripayProvider } from "./afripay.js";
import { stubProvider } from "./stub.js";

// Only use the real provider when AfriPay is configured with a valid http(s)
// base URL and a key. A blank or malformed value falls back to the stub so a
// half-finished env config can't break payments.
function afripayConfigured() {
  const url = env.afripay.baseUrl;
  if (!url || !env.afripay.apiKey) return false;
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function getPaymentProvider() {
  return afripayConfigured() ? afripayProvider : stubProvider;
}

export const isStubPayments = () => !afripayConfigured();

/**
 * Initiate a payment without ever throwing into the caller. Returns
 * { ok: true, provider, ...result } or { ok: false, error }.
 */
export async function safeInitiate(args) {
  const provider = getPaymentProvider();
  try {
    const result = await provider.initiate(args);
    return { ok: true, provider, ...result };
  } catch (err) {
    console.error("payment.initiate failed:", err?.message || err);
    return { ok: false, provider, error: err?.message || "Payment provider error" };
  }
}

/** Verify a payment without throwing. Returns { ok, status } or { ok:false, error }. */
export async function safeVerify(providerRef) {
  const provider = getPaymentProvider();
  try {
    const result = await provider.verify(providerRef);
    return { ok: true, status: result.status };
  } catch (err) {
    console.error("payment.verify failed:", err?.message || err);
    return { ok: false, error: err?.message || "Payment provider error" };
  }
}
