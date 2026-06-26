import mongoose from "mongoose";
import { LISTING_STATUS, LISTING_MODELS } from "@/lib/constants";

const { Schema } = mongoose;

const MediaSchema = new Schema(
  { url: String, publicId: String },
  { _id: false }
);

// GATED fields (revealed only after a valid TokenUnlock — Phase 4).
const ContactSchema = new Schema(
  {
    ownerName: String,
    ownerPhone: String,
    keysManagerName: String,
    keysManagerPhone: String,
    thirdPartyContact: String,
  },
  { _id: false }
);

const LocationSchema = new Schema(
  {
    area: String, // PUBLIC approximate area (e.g. "Kicukiro, Kigali")
    // --- gated exact location ---
    upi: String,
    street: String,
    houseNumber: String,
    mapsPin: { lat: Number, lng: Number },
  },
  { _id: false }
);

const ListingSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    assignedManager: { type: Schema.Types.ObjectId, ref: "User", default: null },

    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    subcategory: { type: Schema.Types.ObjectId, ref: "Subcategory" },
    itemType: String,
    transactionType: { type: String, enum: ["rent", "sale"], default: "sale" },

    ownerType: {
      type: String,
      enum: ["owner", "manager", "third_party"],
      default: "owner",
    },
    representative: { name: String, phone: String, relationship: String },

    quantity: { type: Number, default: 1, min: 1 },
    price: { type: Number, required: true, min: 0 },
    location: { type: LocationSchema, default: () => ({}) },
    contact: { type: ContactSchema, default: () => ({}) },

    model: { type: String, enum: Object.values(LISTING_MODELS), required: true },
    eligibleForA: { type: Boolean, default: false },
    modelReason: String,

    durationMonths: { type: Number, default: 1 },
    expiresAt: { type: Date },

    title: { type: String, required: true },
    description: String,
    features: { type: [String], default: [] },
    images: { type: [MediaSchema], default: [] },
    ownershipProof: { type: [MediaSchema], default: [] }, // admin-only

    // Pricing snapshot for Model B paid listings
    listingFee: {
      total: Number,
      vatPortion: Number,
      discountRate: Number,
      months: Number,
    },
    paymentStatus: {
      type: String,
      enum: ["not_required", "pending", "paid"],
      default: "not_required",
    },

    status: {
      type: String,
      enum: Object.values(LISTING_STATUS),
      default: LISTING_STATUS.DRAFT,
      index: true,
    },
    rejectionReason: String,

    // Set when a buyer first unlocks contact (spec: "marked under negotiation").
    // Kept as a flag so the listing stays browsable by other buyers.
    underNegotiation: { type: Boolean, default: false },
    firstUnlockAt: { type: Date, default: null },
    unlockCount: { type: Number, default: 0 },

    // Deal outcome (Model A) — populated in Phase 5
    dealOutcome: { type: String, default: null }, // sold | rented | not_concluded
    finalAmount: { type: Number, default: null },
    dealCompletedAt: { type: Date, default: null },

    // Anti-cheating: flagged when an outcome looks suspicious (e.g. "not concluded"
    // despite contact unlocks). Reviewed by admin; penalties handled in Phase 7.
    reviewFlag: { type: Boolean, default: false },
    reviewReason: { type: String, default: null },
  },
  { timestamps: true }
);

ListingSchema.index({ status: 1, category: 1 });

// PUBLIC view: no contact, no exact location, no ownership proof.
ListingSchema.methods.toPublicJSON = function () {
  return {
    id: this._id.toString(),
    title: this.title,
    description: this.description,
    features: this.features,
    images: this.images.map((m) => m.url),
    category: this.category?.toString?.() || this.category,
    subcategory: this.subcategory?.toString?.() || this.subcategory,
    itemType: this.itemType,
    transactionType: this.transactionType,
    price: this.price,
    quantity: this.quantity,
    model: this.model,
    status: this.status,
    location: { area: this.location?.area || null }, // approximate only
    contactLocked: true,
    createdAt: this.createdAt,
  };
};

// FULL view: includes gated contact + exact location. For owner/admin/manager,
// or a buyer who has unlocked (Phase 4). Ownership proof only when includeProof.
ListingSchema.methods.toFullJSON = function ({ includeProof = false } = {}) {
  const pub = this.toPublicJSON();
  return {
    ...pub,
    contactLocked: false,
    contact: {
      ownerName: this.contact?.ownerName,
      ownerPhone: this.contact?.ownerPhone,
      keysManagerName: this.contact?.keysManagerName,
      keysManagerPhone: this.contact?.keysManagerPhone,
      thirdPartyContact: this.contact?.thirdPartyContact,
    },
    location: {
      area: this.location?.area || null,
      upi: this.location?.upi,
      street: this.location?.street,
      houseNumber: this.location?.houseNumber,
      mapsPin: this.location?.mapsPin,
    },
    ownerType: this.ownerType,
    representative: this.representative,
    durationMonths: this.durationMonths,
    expiresAt: this.expiresAt,
    listingFee: this.listingFee,
    paymentStatus: this.paymentStatus,
    ...(includeProof ? { ownershipProof: this.ownershipProof.map((m) => m.url) } : {}),
  };
};

export default mongoose.models.Listing || mongoose.model("Listing", ListingSchema);
