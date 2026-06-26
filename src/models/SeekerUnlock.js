import mongoose from "mongoose";

const { Schema } = mongoose;

// IMMUTABLE record: a viewer paid the view token to reveal a seeker's contact.
const SeekerUnlockSchema = new Schema(
  {
    viewer: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    seekerRequest: { type: Schema.Types.ObjectId, ref: "SeekerRequest", required: true, index: true },
    seeker: { type: Schema.Types.ObjectId, ref: "User", required: true },
    payment: { type: Schema.Types.ObjectId, ref: "Payment", required: true },
    amountPaid: Number,
    watermark: String,
    at: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// One unlock per (viewer, request) — no double charge.
SeekerUnlockSchema.index({ viewer: 1, seekerRequest: 1 }, { unique: true });

export default mongoose.models.SeekerUnlock ||
  mongoose.model("SeekerUnlock", SeekerUnlockSchema);
