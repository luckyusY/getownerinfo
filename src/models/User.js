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
    role: {
      type: String,
      enum: ALL_ROLES,
      default: ROLES.BUYER,
      index: true,
    },

    // Verification / KYC (admin-only — never exposed to buyers)
    isVerified: { type: Boolean, default: false },
    kyc: {
      idNumber: { type: String, select: false },
      idDocumentUrl: { type: String, select: false },
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
    role: this.role,
    isVerified: this.isVerified,
    penaltyBalance: this.penaltyBalance,
    commissionDue: this.commissionDue,
    isActive: this.isActive,
    createdAt: this.createdAt,
  };
};

export default mongoose.models.User || mongoose.model("User", UserSchema);
