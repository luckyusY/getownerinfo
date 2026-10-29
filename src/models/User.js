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
    // Contact-channel verification. Set when the OTP for that channel is
    // confirmed; null until then. The dashboard reads these directly.
    emailVerifiedAt: { type: Date, default: null },
    phoneVerifiedAt: { type: Date, default: null },
    // Live OTP challenges. Only the HMAC is stored, so the raw code exists
    // solely in the message that was sent. Never selected by default.
    contactOtp: {
      emailCode: { type: String, select: false },
      emailExpiresAt: { type: Date, select: false },
      emailAttempts: { type: Number, default: 0, select: false },
      // The address the code was sent to, so changing it invalidates the code.
      emailTarget: { type: String, select: false },
      phoneCode: { type: String, select: false },
      phoneExpiresAt: { type: Date, select: false },
      phoneAttempts: { type: Number, default: 0, select: false },
      phoneTarget: { type: String, select: false },
    },
    kyc: {
      idNumber: { type: String, select: false },
      docType: {
        type: String,
        enum: ["national_id", "passport", "driving_licence"],
        select: false,
      },
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
    // Outbound notification preferences. In-app delivery is always on; these
    // only govern email, and events that carry money or access ignore them.
    notificationPrefs: {
      email: {
        listings: { type: Boolean, default: true },
        payments: { type: Boolean, default: true },
        messages: { type: Boolean, default: true },
        account: { type: Boolean, default: true },
      },
    },

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
    emailVerified: Boolean(this.emailVerifiedAt),
    phoneVerified: Boolean(this.phoneVerifiedAt),
    // Status only — never the ID number or document URL.
    kycStatus: this.kyc?.status || "none",
    notificationPrefs: {
      email: {
        listings: this.notificationPrefs?.email?.listings !== false,
        payments: this.notificationPrefs?.email?.payments !== false,
        messages: this.notificationPrefs?.email?.messages !== false,
        account: this.notificationPrefs?.email?.account !== false,
      },
    },
    penaltyBalance: this.penaltyBalance,
    commissionDue: this.commissionDue,
    isActive: this.isActive,
    createdAt: this.createdAt,
  };
};

export default mongoose.models.User || mongoose.model("User", UserSchema);
