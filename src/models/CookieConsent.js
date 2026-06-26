import mongoose from "mongoose";

const { Schema } = mongoose;

// Logged-in users' cookie preferences, retained for audit (spec Part 11).
const CookieConsentSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", index: true },
    essential: { type: Boolean, default: true }, // always on
    analytics: { type: Boolean, default: false },
    preferences: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.CookieConsent ||
  mongoose.model("CookieConsent", CookieConsentSchema);
