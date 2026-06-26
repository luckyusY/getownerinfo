import mongoose from "mongoose";

const { Schema } = mongoose;

// Model A commission invoice. Created automatically when an owner reports a
// completed (sold/rented) deal. Amount derived by the pricing engine from the
// final deal value and the category commission rate.
const CommissionSchema = new Schema(
  {
    listing: { type: Schema.Types.ObjectId, ref: "Listing", required: true, index: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    dealOutcome: { type: String, enum: ["sold", "rented"], required: true },

    finalAmount: { type: Number, required: true }, // reported deal value (Rwf)
    commissionPercent: { type: Number, required: true },
    total: { type: Number, required: true }, // commission due, VAT-inclusive
    vatPortion: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ["invoiced", "paid", "waived"],
      default: "invoiced",
      index: true,
    },
    dueDate: { type: Date },
    payment: { type: Schema.Types.ObjectId, ref: "Payment", default: null },
    paidAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.Commission ||
  mongoose.model("Commission", CommissionSchema);
