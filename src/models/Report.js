import mongoose from "mongoose";

const { Schema } = mongoose;

export const REPORT_REASONS = {
  FAKE: "fake_listing",
  NOT_OWNER: "not_the_owner",
  WRONG_CONTACT: "wrong_or_dead_contact",
  ALREADY_TAKEN: "already_sold_or_rented",
  PRICE: "misleading_price",
  SCAM: "scam_or_fraud",
  OTHER: "other",
};

export const REPORT_STATUS = {
  OPEN: "open",
  REVIEWING: "reviewing",
  UPHELD: "upheld",
  DISMISSED: "dismissed",
};

const ReportSchema = new Schema(
  {
    reporter: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    listing: { type: Schema.Types.ObjectId, ref: "Listing", required: true, index: true },
    // Denormalised so a report survives the listing being deleted.
    listingOwner: { type: Schema.Types.ObjectId, ref: "User", index: true },

    reason: { type: String, enum: Object.values(REPORT_REASONS), required: true },
    details: { type: String, maxlength: 2000 },

    status: {
      type: String,
      enum: Object.values(REPORT_STATUS),
      default: REPORT_STATUS.OPEN,
      index: true,
    },
    // Set server-side when the report comes from a paid unlock: the unlock,
    // the payment and the amount. An admin deciding a "the contact did not
    // work" report needs to know money changed hands; before this the queue
    // showed the same row whether the reporter had paid or merely browsed.
    meta: { type: Schema.Types.Mixed },

    resolution: String,
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: Date,
  },
  { timestamps: true }
);

// One open report per person per listing — repeat submissions are noise, and
// counting distinct reporters is what actually signals a problem listing.
ReportSchema.index({ reporter: 1, listing: 1 }, { unique: true });
ReportSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.Report || mongoose.model("Report", ReportSchema);
