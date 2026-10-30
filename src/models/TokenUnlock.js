import mongoose from "mongoose";

const { Schema } = mongoose;

// IMMUTABLE access record. One per (user, listing). Created only after a verified
// token-fee payment. Becomes the reference for commission enforcement (Phase 5)
// and dispute resolution — never edited or deleted (spec).
const TokenUnlockSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    listing: { type: Schema.Types.ObjectId, ref: "Listing", required: true, index: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true }, // listing owner
    payment: { type: Schema.Types.ObjectId, ref: "Payment", required: true },

    tier: String, // buyer | tenant | client
    amountPaid: Number,
    fieldsUnlocked: { type: [String], default: [] },

    // Watermark stamped onto revealed contact info (buyer name + id) — anti-sharing.
    watermark: String,

    at: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// Guarantees a user cannot unlock (or be charged for) the same listing twice.
TokenUnlockSchema.index({ user: 1, listing: 1 }, { unique: true });

// An owner's earnings view filters on owner within a date window, and the
// per-user daily unlock cap filters on user within one. Neither had an index
// covering the date, so both scanned the collection.
TokenUnlockSchema.index({ owner: 1, at: -1 });
TokenUnlockSchema.index({ user: 1, at: -1 });

// Platform analytics counts unlocks in a window across all users.
TokenUnlockSchema.index({ at: -1 });

export default mongoose.models.TokenUnlock ||
  mongoose.model("TokenUnlock", TokenUnlockSchema);
