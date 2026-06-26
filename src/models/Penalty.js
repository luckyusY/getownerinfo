import mongoose from "mongoose";

const { Schema } = mongoose;

// Offense types (spec Part 9). Owners, buyers, and staff can be penalized.
export const OFFENSE_TYPES = {
  LATE_STATUS: "late_status_update",
  UNDER_REPORT: "under_reporting",
  EARLY_WITHDRAW: "early_withdrawal",
  FALSE_NOT_CONCLUDED: "false_not_concluded",
  COMMISSION_DELAY: "commission_delay",
  TOKEN_BYPASS: "token_bypass",
  CONTACT_SHARING: "contact_sharing",
  OVERRIDE_MISUSE: "override_misuse",
};

// IMMUTABLE penalty record (spec: stored for audit, never altered).
const PenaltySchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    listing: { type: Schema.Types.ObjectId, ref: "Listing", default: null },
    offenseType: { type: String, enum: Object.values(OFFENSE_TYPES), required: true },
    reason: { type: String, required: true },

    // Calculation snapshot: total = expectedAmount * percent + fixedAmount
    expectedAmount: { type: Number, default: 0 },
    percent: { type: Number, default: 0 },
    fixedAmount: { type: Number, default: 0 },
    total: { type: Number, required: true },

    status: { type: String, enum: ["active", "paid", "waived"], default: "active", index: true },
    issuedBy: { type: Schema.Types.ObjectId, ref: "User", default: null }, // null = system
    payment: { type: Schema.Types.ObjectId, ref: "Payment", default: null },
    paidAt: { type: Date, default: null },
    waivedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.Penalty || mongoose.model("Penalty", PenaltySchema);
