import { connectDB } from "@/lib/db";
import Listing from "@/models/Listing";
import Category from "@/models/Category";
import PlatformSettings, { getSettings } from "@/models/PlatformSettings";
import { DEFAULT_SETTINGS } from "@/data/catalog";
import { publicListingFilter } from "@/lib/listingQuery";
import { audit } from "@/models/AuditLog";
import { ok, fail, requireAuth } from "@/lib/api";
import { SELLER_ROLES, LISTING_STATUS, LISTING_MODELS, PAYMENT_STATUS } from "@/lib/constants";
import {
  listingInputSchema,
  resolveModel,
  listingFeeFor,
  sanitizeAttributes,
  sanitizeLocation,
  submitBlocker,
  expiryFor,
  resolveCatalogChain,
  modelABlockedByDebt,
  contactVerificationBlocker,
} from "@/lib/listingForm";
import { startListingFeeCheckout } from "@/lib/listingCheckout";
import { agreementBlocker, recordAgreement } from "@/lib/agreementService";
import { findDuplicateListing } from "@/lib/fraudService";
import User from "@/models/User";
import { dispatch } from "@/lib/notificationService";

// POST /api/listings — create a listing (draft or submit for approval).
export async function POST(req) {
  // Staff review and moderate listings; sellers create their own listings.
  const guard = requireAuth(SELLER_ROLES);
  if (guard.error) return guard.error;

  let body;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body");
  }
  const parsed = listingInputSchema.safeParse(body);
  if (!parsed.success) {
    return fail("Validation failed", 422, { issues: parsed.error.flatten().fieldErrors });
  }
  const data = parsed.data;

  await connectDB();
  const chain = await resolveCatalogChain(data);
  if (chain.error) return fail(chain.error, chain.status);
  const { category, subcategory } = chain;

  if (data.submit) {
    const contactBlocker = await contactVerificationBlocker(guard.session.sub);
    if (contactBlocker) return fail(contactBlocker, 403);
    const blocker = submitBlocker(data, category, { subcategory });
    if (blocker) return fail(blocker, 422);
  }

  const settings = await getSettings(PlatformSettings, DEFAULT_SETTINGS);

  // Determine model server-side (never trust the client).
  const resolved = resolveModel(data, category);
  if (resolved.error) return fail(resolved.error, 422);
  const { decision } = resolved;

  const debtBlocker = await modelABlockedByDebt(decision, guard.session.sub);
  if (debtBlocker) return fail(debtBlocker, 402);

  // Duplicate detection (spec Part 24): the same owner re-posting the same
  // item inflates the catalogue and splits buyer interest across copies.
  if (data.submit) {
    const duplicate = await findDuplicateListing({
      ownerId: guard.session.sub,
      categoryId: category._id,
      title: data.title,
      price: data.price,
      settings,
    });
    if (duplicate) {
      return fail(
        `You already have a live listing that looks like this one ("${duplicate.title}"). ` +
          "Update that listing instead of posting it again.",
        409
      );
    }
  }

  if (data.submit) {
    const agreementIssue = agreementBlocker(data.agreement, { model: decision.model });
    if (agreementIssue) return fail(agreementIssue, 422);
  }

  const listingFee = listingFeeFor(decision, category, data, settings);
  // Model B requires payment before activation.
  const paymentStatus =
    decision.model === LISTING_MODELS.B && data.submit ? PAYMENT_STATUS.PENDING : "not_required";

  // A paid-listing submission must not enter moderation until the listing fee
  // settles. The checkout handler below advances it after provider confirmation.
  const status =
    data.submit && decision.model === LISTING_MODELS.A
      ? LISTING_STATUS.PENDING_APPROVAL
      : LISTING_STATUS.DRAFT;

  const listing = await Listing.create({
    owner: guard.session.sub,
    category: category._id,
    subcategory: data.subcategoryId || undefined,
    itemType: data.itemType,
    attributes: sanitizeAttributes(category.slug, data.attributes),
    transactionType: data.transactionType,
    ownerType: data.ownerType,
    representative: data.representative,
    quantity: data.quantity,
    price: data.price,
    location: sanitizeLocation(category.slug, data.location),
    contact: data.contact,
    model: decision.model,
    eligibleForA: decision.eligibleForA,
    modelReason: decision.reason,
    durationMonths: data.durationMonths,
    expiresAt: expiryFor(data.durationMonths),
    title: data.title,
    description: data.description,
    features: data.features,
    images: data.images,
    ownershipProof: data.ownershipProof,
    listingFee,
    paymentStatus,
    status,
  });

  if (data.submit) {
    const signer = await User.findById(guard.session.sub).select("email _id");
    await recordAgreement({
      listing,
      user: signer,
      agreement: data.agreement,
      category,
      session: guard.session,
      request: req,
    });
  }

  if (data.submit && decision.model === LISTING_MODELS.B) {
    const checkout = await startListingFeeCheckout({ listing, userId: guard.session.sub });
    if (!checkout.ok) {
      // Nothing was charged and the listing never reached moderation — drop it
      // rather than leaving an orphan the owner cannot act on.
      await Listing.deleteOne({ _id: listing._id });
      return fail("Checkout could not be started. Please try again later.", 502);
    }

    if (checkout.settled) {
      await listing.populate("category");
      listing.paymentStatus = PAYMENT_STATUS.PAID;
      listing.status = LISTING_STATUS.PENDING_APPROVAL;
    } else {
      await audit({
        actor: guard.session.sub,
        actorRole: guard.session.role,
        action: "listing.checkout_started",
        targetType: "Listing",
        targetId: listing._id,
        meta: {
          model: decision.model,
          amount: listingFee.total,
          paymentId: checkout.payment._id.toString(),
        },
      });
      return ok(
        {
          needsPayment: true,
          paymentId: checkout.payment._id.toString(),
          redirectUrl: checkout.redirectUrl,
          listingId: listing._id.toString(),
        },
        201
      );
    }
  }

  if (data.submit && listing.status === LISTING_STATUS.PENDING_APPROVAL) {
    await dispatch("listing_submitted", { userId: listing.owner, data: { listing } });
  }

  await audit({
    actor: guard.session.sub,
    actorRole: guard.session.role,
    action: data.submit ? "listing.submit" : "listing.create_draft",
    targetType: "Listing",
    targetId: listing._id,
    meta: { model: decision.model, status: listing.status },
  });

  return ok({ listing: listing.toFullJSON({ includeProof: true }) }, 201);
}

// GET /api/listings — public browse of ACTIVE listings (masked). Supports
// ?category=slug & ?model=A|B & ?q=text
export async function GET(req) {
  await connectDB();
  const { searchParams } = new URL(req.url);

  const query = publicListingFilter();
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
