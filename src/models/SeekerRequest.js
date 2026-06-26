import mongoose from "mongoose";

const { Schema } = mongoose;

export const SEEKER_STATUS = {
  PENDING: "pending", // awaiting post-fee payment
  ACTIVE: "active",
  FULFILLED: "fulfilled",
  CLOSED: "closed",
  EXPIRED: "expired",
  REJECTED: "rejected",
};

// A buyer/tenant "wanted" request. Public but anonymized; viewers pay a view
// token to reveal the seeker's contact (spec Part 10).
const SeekerRequestSchema = new Schema(
  {
    seeker: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    subcategory: { type: Schema.Types.ObjectId, ref: "Subcategory" },

    budgetMin: { type: Number, default: 0 },
    budgetMax: { type: Number, default: 0 },
    preferredLocation: { type: String }, // public
    quantityType: { type: String },
    details: { type: String }, // public: what is wanted

    validityDays: { type: Number, default: 30 },
    expiresAt: { type: Date, required: true, index: true },

    // GATED — revealed only after a view-token unlock.
    contact: {
      name: String,
      phone: String,
      preferredContactTime: String,
    },
    // Never shown to anyone but admin.
    privateNotes: { type: String, select: false },

    status: {
      type: String,
      enum: Object.values(SEEKER_STATUS),
      default: SEEKER_STATUS.PENDING,
      index: true,
    },
    postPayment: { type: Schema.Types.ObjectId, ref: "Payment", default: null },
    unlockCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// PUBLIC anonymized view (no contact).
SeekerRequestSchema.methods.toPublicJSON = function () {
  return {
    id: this._id.toString(),
    category: this.category?.toString?.() || this.category,
    subcategory: this.subcategory?.toString?.() || this.subcategory,
    budgetMin: this.budgetMin,
    budgetMax: this.budgetMax,
    preferredLocation: this.preferredLocation,
    quantityType: this.quantityType,
    details: this.details,
    validityDays: this.validityDays,
    expiresAt: this.expiresAt,
    status: this.status,
    contactLocked: true,
    createdAt: this.createdAt,
  };
};

export default mongoose.models.SeekerRequest ||
  mongoose.model("SeekerRequest", SeekerRequestSchema);
