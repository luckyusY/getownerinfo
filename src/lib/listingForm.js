// Shared listing-form rules used by both listing creation (POST /api/listings)
// and draft editing (PATCH /api/listings/:id).
//
// Everything that decides whether a listing is valid, which model it falls
// under, and what it costs lives here, so a draft that is edited and
// resubmitted is held to exactly the same rules as one created in one pass.

import { z } from "zod";
import Category from "@/models/Category";
import Subcategory from "@/models/Subcategory";
import User from "@/models/User";
import { evaluateModel } from "./eligibility.js";
import { computeListingFee } from "./pricing.js";
import { optionalRwandaPhone } from "./phone.js";
import { LISTING_MODELS } from "./constants.js";
import { emailConfigured, smsConfigured } from "./notify.js";
import administrativeUnits from "@/data/rwandaAdministrativeUnits.json";

const mediaSchema = z.object({ url: z.string().url(), publicId: z.string() });
// Private assets (ownership proof) carry no usable URL — only an identifier.
const privateMediaSchema = z.object({
  url: z.string().optional().default(""),
  publicId: z.string(),
  resourceType: z.string().optional().default("image"),
});
const phoneField = z
  .string()
  .trim()
  .max(20)
  .refine(optionalRwandaPhone, "Enter a valid Rwanda phone number, such as +250 7XX XXX XXX")
  .optional();

export const SUPPORTED_DURATIONS = [1, 2, 3, 6, 12];

// Public, buyer-visible attributes we accept per category. Anything not listed
// is dropped rather than stored, so a furniture listing can never carry
// real-estate-only data such as UPI or bedroom counts.
export const PUBLIC_ATTRIBUTE_KEYS = {
  "real-estate": [
    "bedrooms", "bathrooms", "toilets", "floor", "sizeSqm", "propertyUse",
    "furnishing", "parking", "availability", "leaseTerm", "amenities", "specialFeatures",
  ],
};

export function allowedAttributeKeys(categorySlug) {
  return new Set(PUBLIC_ATTRIBUTE_KEYS[categorySlug] || []);
}

/** Keep only the attributes this category is allowed to publish. */
export function sanitizeAttributes(categorySlug, attributes = {}) {
  const allowed = allowedAttributeKeys(categorySlug);
  if (!allowed.size) return {};
  return Object.fromEntries(Object.entries(attributes).filter(([key]) => allowed.has(key)));
}

/**
 * Real estate uses the dependent Rwanda location hierarchy; other categories
 * publish an approximate area only.
 */
export function sanitizeLocation(categorySlug, location = {}) {
  if (categorySlug === "real-estate") return location;
  return { area: location.area, country: "Rwanda" };
}

export const listingInputSchema = z.object({
  categorySlug: z.string(),
  subcategoryId: z.string().optional(),
  itemType: z.string().optional(),
  transactionType: z.enum(["rent", "sale"]).default("sale"),
  ownerType: z.enum(["owner", "manager", "third_party"]).default("owner"),
  representative: z
    .object({ name: z.string().optional(), phone: phoneField, relationship: z.string().optional() })
    .optional(),
  quantity: z.number().int().positive().default(1),
  price: z.number().nonnegative(),
  durationMonths: z
    .number()
    .int()
    .refine((n) => SUPPORTED_DURATIONS.includes(n), "Choose a supported listing duration")
    .default(1),
  modelChoice: z.enum(["A", "B"]).optional(),
  location: z
    .object({
      country: z.string().optional().default("Rwanda"),
      province: z.string().optional(),
      district: z.string().optional(),
      sector: z.string().optional(),
      area: z.string().optional(),
      famousPlace: z.string().optional(),
      upi: z.string().optional(),
      street: z.string().optional(),
      houseNumber: z.string().optional(),
      // A map pin is optional metadata: drop an incomplete one rather than
      // failing an otherwise valid listing.
      mapsPin: z.preprocess(
        (v) =>
          v && typeof v === "object" && Number.isFinite(v.lat) && Number.isFinite(v.lng)
            ? v
            : undefined,
        z.object({ lat: z.number(), lng: z.number() }).optional()
      ),
    })
    .default({}),
  contact: z
    .object({
      ownerName: z.string().optional(),
      ownerPhone: phoneField,
      keysManagerName: z.string().optional(),
      keysManagerPhone: phoneField,
      thirdPartyContact: z.string().optional(),
    })
    .default({}),
  title: z.string().min(3),
  description: z.string().optional(),
  attributes: z.record(z.any()).default({}),
  features: z.array(z.string()).default([]),
  images: z.array(mediaSchema).default([]),
  ownershipProof: z.array(privateMediaSchema).default([]),
  // The signed agreement, required whenever submit is true (spec Part 22).
  agreement: z
    .object({
      accepted: z.boolean().default(false),
      signatoryName: z.string().trim().max(120).optional(),
      signature: z.string().trim().max(120).optional(),
    })
    .optional(),
  // submit=true -> pending_approval (or checkout); otherwise saved as draft
  submit: z.boolean().default(false),
});

/** True when province/district/sector form a real combination. */
export function isValidRwandaLocation({ province, district, sector }) {
  const prov = administrativeUnits.provinces.find((item) => item.name === province);
  const dist = prov?.districts.find((item) => item.name === district);
  return Boolean(prov && dist && dist.sectors.includes(sector));
}

/**
 * Submit-time required fields. Drafts may be incomplete; a submission may not.
 * @returns {string|null} the first problem, or null when ready to submit.
 */
export function submitBlocker(data, category, { subcategory } = {}) {
  if (!subcategory || !data.itemType) return "Choose a subcategory and item type before submitting";
  if (data.price <= 0) return "Price must be greater than zero";
  if (!data.contact.ownerName?.trim() || !data.contact.ownerPhone?.trim()) {
    return "Owner name and phone are required";
  }
  if (!data.location.area?.trim()) return "Choose an approximate public area";
  if (!data.images.length) return "Upload at least one listing image";
  if (!data.ownershipProof.length) return "Upload at least one ownership or authorization document";
  if (category.slug === "real-estate" && !isValidRwandaLocation(data.location)) {
    return "Select a valid province/city, district, and sector combination";
  }
  return null;
}

/**
 * Resolve the model for a listing, honouring the owner's choice only where the
 * listing actually qualifies. Never trusts the client's model.
 *
 * @returns {{ decision: object }|{ error: string }}
 */
export function resolveModel(data, category) {
  const eligibility = evaluateModel(category.modelRule, {
    transactionType: data.transactionType,
    quantity: data.quantity,
    price: data.price,
  });

  const forced = category.modelRule?.forcedModel;
  if (forced && data.modelChoice && data.modelChoice !== forced) {
    return { error: `This category only supports Model ${forced}` };
  }
  if (data.submit && eligibility.eligibleForA && !forced && !data.modelChoice) {
    return { error: "Choose Model A or Model B before submitting" };
  }
  if (data.modelChoice === LISTING_MODELS.A && !eligibility.eligibleForA) {
    return { error: "This listing does not qualify for Model A" };
  }

  return {
    decision: data.modelChoice ? { ...eligibility, model: data.modelChoice } : eligibility,
  };
}

/** Model B listing-fee snapshot, or null for Model A. */
export function listingFeeFor(decision, category, data, settings) {
  if (decision.model !== LISTING_MODELS.B) return null;
  const fee = computeListingFee({
    baseMonthlyFee: category.listingFeeMonthly,
    months: data.durationMonths,
    vatRate: settings.vatRate,
    durationDiscounts: settings.durationDiscounts,
  });
  return {
    total: fee.total,
    vatPortion: fee.vatPortion,
    discountRate: fee.discountRate,
    months: fee.months,
  };
}

export function expiryFor(durationMonths) {
  return new Date(Date.now() + durationMonths * 30 * 24 * 3600 * 1000);
}

/**
 * Resolve and validate the category -> subcategory -> itemType chain.
 * @returns {{ category, subcategory }|{ error: string, status: number }}
 */
export async function resolveCatalogChain(data) {
  const category = await Category.findOne({ slug: data.categorySlug });
  if (!category) return { error: "Unknown category", status: 404 };
  if (!category.transactionTypes.includes(data.transactionType)) {
    return { error: `Category does not support transaction type "${data.transactionType}"`, status: 422 };
  }

  let subcategory = null;
  if (data.subcategoryId) {
    if (!/^[a-f\d]{24}$/i.test(data.subcategoryId)) {
      return { error: "Choose a valid subcategory for this category", status: 422 };
    }
    subcategory = await Subcategory.findOne({
      _id: data.subcategoryId,
      category: category._id,
      isActive: true,
    });
    if (!subcategory) return { error: "Choose a valid subcategory for this category", status: 422 };
  }
  if (data.itemType && subcategory && !subcategory.itemTypes.includes(data.itemType)) {
    return { error: "Choose a valid item type for this subcategory", status: 422 };
  }

  return { category, subcategory };
}

/**
 * Owners with outstanding commission/penalty cannot open new exclusive
 * (Model A) listings until settled (spec Part 5 §5).
 * @returns {string|null} the blocking message, or null.
 */
export async function modelABlockedByDebt(decision, userId) {
  if (decision.model !== LISTING_MODELS.A) return null;
  const owner = await User.findById(userId).select("commissionDue penaltyBalance");
  const outstanding = (owner?.commissionDue || 0) + (owner?.penaltyBalance || 0);
  if (outstanding > 0) {
    return `You have ${outstanding} Rwf outstanding. Settle it before creating new exclusive (Model A) listings.`;
  }
  return null;
}

/**
 * Contact-channel gate (spec Part 12): a listing may not be submitted from an
 * account whose main contact details are unverified.
 *
 * A channel is only enforced once its codes can actually be delivered. Gating
 * on a channel with no provider behind it would make the gate impossible to
 * pass and would block every listing on the platform, so each one switches on
 * when its provider is configured:
 *   - email  -> RESEND_API_KEY
 *   - phone  -> SMS_PROVIDER_URL
 *
 * @returns {string|null} the blocking message, or null when the account is clear.
 */
export async function contactVerificationBlocker(userId) {
  const user = await User.findById(userId).select("emailVerifiedAt phoneVerifiedAt phone");
  if (!user) return "Account not found";

  if (emailConfigured() && !user.emailVerifiedAt) {
    return "Verify your email address before submitting a listing. You can do this from your profile.";
  }
  if (smsConfigured() && !user.phoneVerifiedAt) {
    return "Verify your phone number before submitting a listing. You can do this from your profile.";
  }
  return null;
}

/**
 * Every required field a listing is still missing (spec Part 9), for the admin
 * view of incomplete and abandoned forms. `submitBlocker` stops at the first
 * problem; this reports all of them so a reminder can be specific.
 *
 * @param {object} listing - a Listing document or lean object
 * @param {object} category - its category, for category-specific rules
 */
export function missingFields(listing, category) {
  const missing = [];
  if (!listing.subcategory) missing.push("Subcategory");
  if (!listing.itemType) missing.push("Item type");
  if (!(listing.price > 0)) missing.push("Price");
  if (!listing.contact?.ownerName?.trim()) missing.push("Owner name");
  if (!listing.contact?.ownerPhone?.trim()) missing.push("Owner phone");
  if (!listing.location?.area?.trim()) missing.push("Public area");
  if (!listing.images?.length) missing.push("Listing image");
  if (!listing.ownershipProof?.length) missing.push("Ownership document");
  if (!listing.title || listing.title.trim().length < 3) missing.push("Title");
  if (category?.slug === "real-estate" && !isValidRwandaLocation(listing.location || {})) {
    missing.push("Province / district / sector");
  }
  return missing;
}

/** Required-field completion as a percentage, for the admin drafts view. */
export function completionPercent(listing, category) {
  const TOTAL = category?.slug === "real-estate" ? 10 : 9;
  const missing = missingFields(listing, category).length;
  return Math.max(0, Math.round(((TOTAL - missing) / TOTAL) * 100));
}
