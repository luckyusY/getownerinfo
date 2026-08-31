// Payment provider abstraction. Swaps between a real payment client (when
// credentials are configured) and a local stub that auto-approves — so the whole
// unlock/commission flow is testable end-to-end before real keys exist.
//
// Provider contract:
//   initiate({ amount, currency, type, reference, metadata })
//     -> { providerRef, status: 'pending'|'paid', redirectUrl?: string }
//   verify(providerRef)
//     -> { status: 'pending'|'paid'|'failed' }
//
// SAFETY: the stub auto-approves every payment. It must never be reachable in
// production — an unconfigured provider has to fail the request loudly rather
// than quietly hand out paid content for free.

import { env } from "../env.js";
import { afripayProvider } from "./afripay.js";
import { stubProvider } from "./stub.js";

const IS_PROD = process.env.NODE_ENV === "production";
// Explicit, deliberate opt-in for running stub payments against a production
// build (e.g. a staging deploy). Absent this, production without a configured
// provider refuses to take payments at all.
const ALLOW_STUB = process.env.PAYMENTS_ALLOW_STUB === "true";

// Only use the real provider when it is configured with a valid http(s) base
// URL and a key. A blank or malformed value is treated as unconfigured.
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

/** True when no real provider is configured, so payments would be simulated. */
export const isStubPayments = () => !afripayConfigured();

/** True when the stub is actually permitted to run in this environment. */
export const stubAllowed = () => !IS_PROD || ALLOW_STUB;

/**
 * Resolve the active provider. Throws in production when no real provider is
 * configured — callers go through safeInitiate/safeVerify, which turn this into
 * a 502 so no unlock is ever granted against a simulated payment.
 */
export function getPaymentProvider() {
  if (afripayConfigured()) return afripayProvider;
  if (!stubAllowed()) {
    throw new Error(
      "No payment provider is configured. Set AFRIPAY_BASE_URL and AFRIPAY_API_KEY, " +
        "or set PAYMENTS_ALLOW_STUB=true to explicitly allow simulated payments."
    );
  }
  return stubProvider;
}

/**
 * Initiate a payment without ever throwing into the caller. Returns
 * { ok: true, provider, ...result } or { ok: false, error }.
 */
export async function safeInitiate(args) {
  let provider;
  try {
    provider = getPaymentProvider();
    const result = await provider.initiate(args);
    return { ok: true, provider, ...result };
  } catch (err) {
    console.error("payment.initiate failed:", err?.message || err);
    return { ok: false, provider, error: err?.message || "Payment provider error" };
  }
}

/** Verify a payment without throwing. Returns { ok, status } or { ok:false, error }. */
export async function safeVerify(providerRef) {
  try {
    const provider = getPaymentProvider();
    const result = await provider.verify(providerRef);
    return { ok: true, status: result.status };
  } catch (err) {
    console.error("payment.verify failed:", err?.message || err);
    return { ok: false, error: err?.message || "Payment provider error" };
  }
}
