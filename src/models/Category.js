import mongoose from "mongoose";

const { Schema } = mongoose;

const ModelRuleSchema = new Schema(
  {
    allowsModelA: { type: Boolean, default: true },
    forcedModel: { type: String, enum: ["A", "B", null], default: null },
    maxUnitsForModelA: { type: Number, default: 1 },
    // thresholds: { rentMonthly, sale } — min price (Rwf) to qualify for Model A
    thresholds: { type: Map, of: Number, default: {} },
  },
  { _id: false }
);

const TokenFeeSchema = new Schema(
  {
    buyer: { type: Number, default: 0 },
    tenant: { type: Number, default: 0 },
    client: { type: Number, default: 0 },
  },
  { _id: false }
);

const CategorySchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    transactionTypes: { type: [String], default: ["sale"] }, // rent | sale
    modelRule: { type: ModelRuleSchema, default: () => ({}) },
    listingFeeMonthly: { type: Number, default: 0 }, // Rwf, VAT-inclusive
    tokenFee: { type: TokenFeeSchema, default: () => ({}) },
    commissionPercent: { type: Number, default: 0 }, // Model A, e.g. 0.05 = 5%
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.Category ||
  mongoose.model("Category", CategorySchema);
