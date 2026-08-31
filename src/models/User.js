import mongoose from "mongoose";
import { ALL_ROLES, ROLES } from "@/lib/constants";

const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, trim: true },
    passwordHash: { type: String, required: true },
    googleId: { type: String, trim: true, sparse: true, index: true },
    avatarUrl: { type: String, trim: true },
    authProviders: { type: [String], default: ["password"] },
    role: {
      type: String,
      enum: ALL_ROLES,
      default: ROLES.BUYER,
      index: true,
    },

    // Verification / KYC. The documents themselves are admin-only and never
    // exposed to buyers; only the resulting `isVerified` flag is public.
    isVerified: { type: Boolean, default: false },
    kyc: {
      idNumber: { type: String, select: false },
      idDocumentUrl: { type: String, select: false },
      // Cloudinary publicId for the private (authenticated) asset, so an admin
      // can mint a signed URL without the raw one ever being stored publicly.
      idDocumentPublicId: { type: String, select: false },
      fullName: { type: String, select: false },
      status: {
        type: String,
        enum: ["none", "pending", "approved", "rejected"],
        default: "none",
        index: true,
      },
      submittedAt: Date,
      reviewedAt: Date,
      reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
      rejectionReason: String,
    },

    // Outstanding amounts owed (Rwf). Either > 0 blocks new exclusive (Model A)
    // listings until settled (spec: listing restrictions).
    penaltyBalance: { type: Number, default: 0 },
    commissionDue: { type: Number, default: 0 },

    isActive: { type: Boolean, default: true },
    isBlacklisted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Strip sensitive fields whenever a user is serialized to JSON.
UserSchema.methods.toSafeJSON = function () {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    phone: this.phone,
    avatarUrl: this.avatarUrl,
    role: this.role,
    isVerified: this.isVerified,
    // Status only — never the ID number or document URL.
    kycStatus: this.kyc?.status || "none",
    penaltyBalance: this.penaltyBalance,
    commissionDue: this.commissionDue,
    isActive: this.isActive,
    createdAt: this.createdAt,
  };
};

export default mongoose.models.User || mongoose.model("User", UserSchema);
