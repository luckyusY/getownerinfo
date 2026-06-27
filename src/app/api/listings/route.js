import { z } from "zod";
import { connectDB } from "@/lib/db";
import Listing from "@/models/Listing";
import Category from "@/models/Category";
import User from "@/models/User";
import PlatformSettings, { getSettings } from "@/models/PlatformSettings";
import { DEFAULT_SETTINGS } from "@/data/catalog";
import { evaluateModel } from "@/lib/eligibility";
import { computeListingFee } from "@/lib/pricing";
import { audit } from "@/models/AuditLog";
import { ok, fail, requireAuth } from "@/lib/api";
import { ROLES, LISTING_STATUS, LISTING_MODELS } from "@/lib/constants";

const mediaSchema = z.object({ url: z.string().url(), publicId: z.string() });

const createSchema = z.object({
  categorySlug: z.string(),
  subcategoryId: z.string().optional(),
  itemType: z.string().optional(),
  transactionType: z.enum(["rent", "sale"]).default("sale"),
  ownerType: z.enum(["owner", "manager", "third_party"]).default("owner"),
  representative: z
    .object({ name: z.string().optional(), phone: z.string().optional(), relationship: z.string().optional() })
    .optional(),
  quantity: z.number().int().positive().default(1),
  price: z.number().nonnegative(),
  durationMonths: z.number().int().positive().default(1),
  location: z
    .object({
      area: z.string().optional(),
      upi: z.string().optional(),
      street: z.string().optional(),
      houseNumber: z.string().optional(),
      mapsPin: z.object({ lat: z.number(), lng: z.number() }).optional(),
    })
    .default({}),
  contact: z
    .object({
      ownerName: z.string().optional(),
      ownerPhone: z.string().optional(),
      keysManagerName: z.string().optional(),
      keysManagerPhone: z.string().optional(),
      thirdPartyContact: z.string().optional(),
    })
    .default({}),
  title: z.string().min(3),
  description: z.string().optional(),
  features: z.array(z.string()).default([]),
  images: z.array(mediaSchema).default([]),
  ownershipProof: z.array(mediaSchema).default([]),
  // submit=true -> pending_approval; otherwise saved as draft
  submit: z.boolean().default(false),
});

// POST /api/listings — create a listing (draft or submit for approval).
export async function POST(req) {
  const guard = requireAuth([ROLES.OWNER, ROLES.MANAGER, ROLES.ADMIN]);
  if (guard.error) return guard.error;

  let body;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body");
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return fail("Validation failed", 422, { issues: parsed.error.flatten().fieldErrors });
  }
  const data = parsed.data;

  await connectDB();
  const category = await Category.findOne({ slug: data.categorySlug });
  if (!category) return fail("Unknown category", 404);
  if (!category.transactionTypes.includes(data.transactionType)) {
    return fail(`Category does not support transaction type "${data.transactionType}"`, 422);
  }

  const settings = await getSettings(PlatformSettings, DEFAULT_SETTINGS);

  // Determine model server-side (never trust the client).
  const decision = evaluateModel(category.modelRule, {
    transactionType: data.transactionType,
    quantity: data.quantity,
    price: data.price,
  });

  // Enforcement: owners with outstanding commission/penalty cannot open new
  // exclusive (Model A) listings until settled (spec Part 5 §5).
  if (decision.model === LISTING_MODELS.A) {
    const owner = await User.findById(guard.session.sub).select("commissionDue penaltyBalance");
    const outstanding = (owner?.commissionDue || 0) + (owner?.penaltyBalance || 0);
    if (outstanding > 0) {
      return fail(
        `You have ${outstanding} Rwf outstanding. Settle it before creating new exclusive (Model A) listings.`,
        402
      );
    }
  }

  let listingFee = null;
  let paymentStatus = "not_required";
  if (decision.model === LISTING_MODELS.B) {
    const fee = computeListingFee({
      baseMonthlyFee: category.listingFeeMonthly,
      months: data.durationMonths,
      vatRate: settings.vatRate,
      durationDiscounts: settings.durationDiscounts,
    });
    listingFee = {
      total: fee.total,
      vatPortion: fee.vatPortion,
      discountRate: fee.discountRate,
      months: fee.months,
    };
    // Model B requires payment before activation (enforced in Phase 4).
    paymentStatus = data.submit ? "pending" : "not_required";
  }

  const status = data.submit ? LISTING_STATUS.PENDING_APPROVAL : LISTING_STATUS.DRAFT;
  const expiresAt = new Date(Date.now() + data.durationMonths * 30 * 24 * 3600 * 1000);

  const listing = await Listing.create({
    owner: guard.session.sub,
    category: category._id,
    subcategory: data.subcategoryId || undefined,
    itemType: data.itemType,
    transactionType: data.transactionType,
    ownerType: data.ownerType,
    representative: data.representative,
    quantity: data.quantity,
    price: data.price,
    location: data.location,
    contact: data.contact,
    model: decision.model,
    eligibleForA: decision.eligibleForA,
    modelReason: decision.reason,
    durationMonths: data.durationMonths,
    expiresAt,
    title: data.title,
    description: data.description,
    features: data.features,
    images: data.images,
    ownershipProof: data.ownershipProof,
    listingFee,
    paymentStatus,
    status,
  });

  await audit({
    actor: guard.session.sub,
    actorRole: guard.session.role,
    action: data.submit ? "listing.submit" : "listing.create_draft",
    targetType: "Listing",
    targetId: listing._id,
    meta: { model: decision.model, status },
  });

  return ok({ listing: listing.toFullJSON({ includeProof: true }) }, 201);
}

// GET /api/listings — public browse of ACTIVE listings (masked). Supports
// ?category=slug & ?model=A|B & ?q=text
export async function GET(req) {
  await connectDB();
  const { searchParams } = new URL(req.url);

  const query = { status: LISTING_STATUS.ACTIVE };
  const categorySlug = searchParams.get("category");
  if (categorySlug) {
    const cat = await Category.findOne({ slug: categorySlug });
    if (cat) query.category = cat._id;
    else return ok({ listings: [] });
  }
  const model = searchParams.get("model");
  if (model === "A" || model === "B") query.model = model;
  const location = searchParams.get("location");
  if (location) query["location.area"] = { $regex: location, $options: "i" };
  const q = searchParams.get("q");
  if (q) {
    const rx = { $regex: q, $options: "i" };
    query.$or = [{ title: rx }, { itemType: rx }, { "location.area": rx }, { description: rx }];
  }

  const listings = await Listing.find(query).sort({ createdAt: -1 }).limit(60);
  return ok({ listings: listings.map((l) => l.toPublicJSON()) });
}
