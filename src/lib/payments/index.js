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

export function getPaymentProvider() {
  const hasCreds = env.afripay.baseUrl && env.afripay.apiKey;
  return hasCreds ? afripayProvider : stubProvider;
}

export const isStubPayments = () => !(env.afripay.baseUrl && env.afripay.apiKey);
