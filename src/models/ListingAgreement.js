import mongoose from "mongoose";
import { LISTING_MODELS } from "@/lib/constants";

const { Schema } = mongoose;

export { AGREEMENT_TERMS, AGREEMENT_VERSION } from "@/data/agreementTerms";
import { AGREEMENT_VERSION as VERSION } from "@/data/agreementTerms";

/**
 * An immutable record of a listing agreement, signed before the listing is
 * submitted. Never updated or deleted — a re-signature creates a new record.
 */
const ListingAgreementSchema = new Schema(
  {
    listing: { type: Schema.Types.ObjectId, ref: "Listing", required: true, index: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

    model: { type: String, enum: Object.values(LISTING_MODELS), required: true },
    version: { type: String, required: true, default: VERSION },
    // The exact clauses shown at signing time, copied in so the record stands
    // on its own even if the wording later changes.
    terms: { type: [String], default: [] },

    // Model A commercials. Null for Model B.
    commissionPercent: { type: Number, default: null },
    exclusivityMonths: { type: Number, default: null },
    // Model B commercials. Null for Model A.
    listingFeeTotal: { type: Number, default: null },

    // Who signed, and in what capacity.
    signatoryName: { type: String, required: true, trim: true },
    signatoryRole: {
      type: String,
      enum: ["owner", "manager", "third_party"],
      default: "owner",
    },
    // The typed signature. Must match the signatory's name at signing time.
    signature: { type: String, required: true, trim: true },
    signedAt: { type: Date, required: true, default: Date.now },

    // Light provenance for disputes. Never used to identify beyond the account.
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },

    // Whether the signed copy reached the account's email.
    copySentTo: { type: String, default: null },
    copyDelivered: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ListingAgreementSchema.index({ listing: 1, signedAt: -1 });

export default mongoose.models.ListingAgreement ||
  mongoose.model("ListingAgreement", ListingAgreementSchema);
