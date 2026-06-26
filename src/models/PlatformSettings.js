import mongoose from "mongoose";

const { Schema } = mongoose;

// Singleton config document (key: "global"). Admin-editable platform-wide rules.
const PlatformSettingsSchema = new Schema(
  {
    key: { type: String, default: "global", unique: true, index: true },
    vatRate: { type: Number, default: 0.18 },
    currency: { type: String, default: "Rwf" },
    // duration (months) -> discount fraction
    durationDiscounts: { type: Map, of: Number, default: {} },
    seeker: {
      postFee: { type: Number, default: 20_000 },
      viewToken: { type: Number, default: 10_000 },
      validityDays: { type: [Number], default: [7, 14, 30] },
    },
    penalty: {
      commissionPercent: { type: Number, default: 0.5 },
      fixedAmount: { type: Number, default: 100_000 },
    },
    tokenAccess: {
      otpRequired: { type: Boolean, default: true },
      maxUnlocksPerUserPerDay: { type: Number, default: 20 },
    },
  },
  { timestamps: true }
);

export default mongoose.models.PlatformSettings ||
  mongoose.model("PlatformSettings", PlatformSettingsSchema);

/** Fetch the singleton settings doc, creating it from defaults if absent. */
export async function getSettings(Model, defaults) {
  let doc = await Model.findOne({ key: "global" });
  if (!doc) doc = await Model.create({ key: "global", ...defaults });
  return doc;
}
