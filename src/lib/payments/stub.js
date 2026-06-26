// Local stub payment provider — auto-approves. Used when AfriPay creds are absent.
import crypto from "crypto";

export const stubProvider = {
  name: "stub",

  async initiate({ amount, currency = "Rwf", type, reference, metadata }) {
    return {
      providerRef: `stub_${crypto.randomBytes(8).toString("hex")}`,
      status: "paid", // auto-approve in dev
      redirectUrl: null,
      echo: { amount, currency, type, reference, metadata },
    };
  },

  async verify(providerRef) {
    // Stub treats every known ref as paid.
    return { status: providerRef?.startsWith("stub_") ? "paid" : "failed" };
  },
};
