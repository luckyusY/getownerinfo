import mongoose from "mongoose";
import { PAYMENT_TYPES, PAYMENT_STATUS } from "@/lib/constants";

const { Schema } = mongoose;

const PaymentSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    listing: { type: Schema.Types.ObjectId, ref: "Listing", index: true },
    type: { type: String, enum: Object.values(PAYMENT_TYPES), required: true },
    amount: { type: Number, required: true }, // Rwf, VAT-inclusive
    vatPortion: { type: Number, default: 0 },
    currency: { type: String, default: "Rwf" },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
      index: true,
    },
    provider: String,
    providerRef: { type: String, index: true },
    method: String, // momo | card | bank (reported by provider)

    // OTP gate for token unlocks (spec anti-abuse). Hidden by default.
    // `otp` holds an HMAC of the code, never the code itself.
    otp: { type: String, select: false },
    otpExpiresAt: { type: Date, select: false },
    otpAttempts: { type: Number, default: 0, select: false },

    // For token unlocks: which pricing tier (buyer/tenant/client)
    tier: String,
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export default mongoose.models.Payment || mongoose.model("Payment", PaymentSchema);
