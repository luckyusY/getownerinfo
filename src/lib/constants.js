// Shared domain enums used across models, API routes, and UI.

export const ROLES = {
  ADMIN: "admin",
  MANAGER: "platform_listing_manager",
  OWNER: "owner",
  BUYER: "buyer", // buyer / tenant / client
};

export const ALL_ROLES = Object.values(ROLES);

export const LISTING_MODELS = {
  A: "A", // exclusive, commission-based
  B: "B", // pay-to-list
};

export const LISTING_STATUS = {
  DRAFT: "draft",
  PENDING_APPROVAL: "pending_approval",
  ACTIVE: "active",
  UNDER_NEGOTIATION: "under_negotiation",
  SOLD: "sold",
  RENTED: "rented",
  NOT_CONCLUDED: "not_concluded",
  EXPIRED: "expired",
  REJECTED: "rejected",
};

export const PAYMENT_TYPES = {
  LISTING_FEE: "listing_fee",
  TOKEN_FEE: "token_fee",
  COMMISSION: "commission",
  PENALTY: "penalty",
  SEEKER_POST: "seeker_post",
  SEEKER_VIEW: "seeker_view",
};

export const PAYMENT_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  FAILED: "failed",
  REFUNDED: "refunded",
};

// Owner-reported deal outcomes (Model A)
export const DEAL_OUTCOMES = {
  RENTED: "rented",
  SOLD: "sold",
  NOT_CONCLUDED: "not_concluded",
};

export const VAT_RATE = 0.18; // 18% VAT, inclusive

// Default Model A eligibility thresholds (Rwf). Overridable via PlatformSettings.
export const DEFAULT_THRESHOLDS = {
  realEstateRentMonthly: 1_500_000,
  realEstateSale: 50_000_000,
  vehicleSale: 10_000_000,
  furnitureAppliances: 3_000_000,
  businessIndustry: 3_000_000,
};

// Duration discounts: months -> discount fraction
export const DURATION_DISCOUNTS = {
  1: 0,
  2: 0.2,
  3: 0.3,
  6: 0.4,
  12: 0.5,
};
