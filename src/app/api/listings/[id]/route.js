import { connectDB } from "@/lib/db";
import Listing from "@/models/Listing";
import TokenUnlock from "@/models/TokenUnlock";
import PlatformSettings, { getSettings } from "@/models/PlatformSettings";
import { DEFAULT_SETTINGS } from "@/data/catalog";
import { getSession } from "@/lib/auth";
import { buildRevealedContact } from "@/lib/unlockService";
import { audit } from "@/models/AuditLog";
import { ok, fail, requireAuth } from "@/lib/api";
import { ROLES, SELLER_ROLES, LISTING_STATUS, LISTING_MODELS, PAYMENT_STATUS } from "@/lib/constants";
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
} from "@/lib/listingForm";
import { startListingFeeCheckout } from "@/lib/listingCheckout";

// Statuses an owner may still edit. Once a listing is live (or has history such
// as unlocks or a reported deal) it is no longer a form the owner can rewrite.
const EDITABLE_STATUSES = [LISTING_STATUS.DRAFT, LISTING_STATUS.REJECTED];

/**
 * Add the category slug to a full listing payload. The wizard needs the slug
 * (not the ObjectId) to reopen a draft on the right category-specific form.
 */
async function withCategorySlug(listing) {
  await listing.populate("category", "slug");
  // Proof identifiers are included here because this payload only ever goes to
  // the listing's own owner, an admin, or the assigned manager — and the owner
  // needs them back to reopen and resubmit a draft without re-uploading.
  const payload = listing.toFullJSON({ includeProof: true });
  return {
    ...payload,
    categorySlug: listing.category?.slug || null,
    subcategoryId: listing.subcategory?.toString?.() || null,
    editable: EDITABLE_STATUSES.includes(listing.status),
    // toPublicJSON() flattens images to URLs; the edit form needs the full
    // media objects so re-submitting keeps the existing uploads.
    images: listing.images.map((m) => ({ url: m.url, publicId: m.publicId })),
  };
}

// GET /api/listings/:id — role-aware view.
//   - owner of the listing, admin, assigned manager -> full (incl. proof for staff)
//   - a buyer who has unlocked -> public view + revealed contact/location
//   - everyone else -> public masked view (contact + exact location hidden)
export async function GET(_req, { params }) {
  await connectDB();
  const listing = await Listing.findById(params.id);
  if (!listing) return fail("Listing not found", 404);

  const session = getSession();
  const isAdmin = session?.role === ROLES.ADMIN;
  const isOwner = session && listing.owner.toString() === session.sub;
  const isAssignedManager =
    session?.role === ROLES.MANAGER && listing.assignedManager?.toString() === session.sub;

  if (isAdmin || isOwner || isAssignedManager) {
    return ok({ listing: await withCategorySlug(listing) });
  }

  // Public can only see active listings.
  if (listing.status !== LISTING_STATUS.ACTIVE) {
    return fail("Listing not available", 404);
  }

  // A signed-in buyer who has unlocked this listing sees the revealed fields
  // (watermarked), but never the ownership proof.
  if (session) {
    const unlock = await TokenUnlock.findOne({ user: session.sub, listing: listing._id });
    if (unlock) {
      return ok({
        listing: { ...listing.toPublicJSON(), contactLocked: false },
        revealed: buildRevealedContact(listing, unlock.watermark),
      });
    }
  }

  return ok({ listing: listing.toPublicJSON() });
}

// PATCH /api/listings/:id — continue a draft (or fix a rejected listing) and
// optionally submit it. Held to exactly the same rules as creation.
export async function PATCH(req, { params }) {
  const guard = requireAuth([...SELLER_ROLES, ROLES.ADMIN]);
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
  const listing = await Listing.findById(params.id);
  if (!listing) return fail("Listing not found", 404);

  const isAdmin = guard.session.role === ROLES.ADMIN;
  if (!isAdmin && listing.owner.toString() !== guard.session.sub) {
    return fail("Forbidden: this listing belongs to another account", 403);
  }
  if (!EDITABLE_STATUSES.includes(listing.status)) {
    return fail(`A listing with status '${listing.status}' can no longer be edited`, 409);
  }

  const chain = await resolveCatalogChain(data);
  if (chain.error) return fail(chain.error, chain.status);
  const { category, subcategory } = chain;

  if (data.submit) {
    const blocker = submitBlocker(data, category, { subcategory });
    if (blocker) return fail(blocker, 422);
  }

  const settings = await getSettings(PlatformSettings, DEFAULT_SETTINGS);

  const resolved = resolveModel(data, category);
  if (resolved.error) return fail(resolved.error, 422);
  const { decision } = resolved;

  // Debt only blocks opening a NEW exclusive listing, so it applies when this
  // edit is what turns the draft into a Model A submission.
  if (data.submit) {
    const debtBlocker = await modelABlockedByDebt(decision, listing.owner);
    if (debtBlocker) return fail(debtBlocker, 402);
  }

  const listingFee = listingFeeFor(decision, category, data, settings);

  listing.category = category._id;
  listing.subcategory = data.subcategoryId || undefined;
  listing.itemType = data.itemType;
  listing.attributes = sanitizeAttributes(category.slug, data.attributes);
  listing.transactionType = data.transactionType;
  listing.ownerType = data.ownerType;
  listing.representative = data.representative;
  listing.quantity = data.quantity;
  listing.price = data.price;
  listing.location = sanitizeLocation(category.slug, data.location);
  listing.contact = data.contact;
  listing.model = decision.model;
  listing.eligibleForA = decision.eligibleForA;
  listing.modelReason = decision.reason;
  listing.durationMonths = data.durationMonths;
  listing.expiresAt = expiryFor(data.durationMonths);
  listing.title = data.title;
  listing.description = data.description;
  listing.features = data.features;
  listing.images = data.images;
  listing.ownershipProof = data.ownershipProof;
  listing.listingFee = listingFee;

  if (!data.submit) {
    // Still a draft: keep it out of moderation and clear any stale rejection.
    listing.status = LISTING_STATUS.DRAFT;
    listing.rejectionReason = undefined;
    listing.paymentStatus = "not_required";
    await listing.save();

    await audit({
      actor: guard.session.sub,
      actorRole: guard.session.role,
      action: "listing.update_draft",
      targetType: "Listing",
      targetId: listing._id,
      meta: { model: decision.model },
    });

    return ok({ listing: await withCategorySlug(listing) });
  }

  listing.rejectionReason = undefined;

  if (decision.model === LISTING_MODELS.A) {
    listing.paymentStatus = "not_required";
    listing.status = LISTING_STATUS.PENDING_APPROVAL;
    await listing.save();
  } else {
    // Model B: the fee must settle before the listing reaches moderation.
    listing.paymentStatus = PAYMENT_STATUS.PENDING;
    listing.status = LISTING_STATUS.DRAFT;
    await listing.save();

    const checkout = await startListingFeeCheckout({ listing, userId: listing.owner });
    if (!checkout.ok) {
      // Leave it as an editable draft — the owner's work is not lost.
      listing.paymentStatus = "not_required";
      await listing.save();
      return fail("Checkout could not be started. Please try again later.", 502);
    }

    if (checkout.settled) {
      listing.paymentStatus = PAYMENT_STATUS.PAID;
      listing.status = LISTING_STATUS.PENDING_APPROVAL;
      await listing.save();
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
      return ok({
        needsPayment: true,
        paymentId: checkout.payment._id.toString(),
        redirectUrl: checkout.redirectUrl,
        listingId: listing._id.toString(),
      });
    }
  }

  await audit({
    actor: guard.session.sub,
    actorRole: guard.session.role,
    action: "listing.submit",
    targetType: "Listing",
    targetId: listing._id,
    meta: { model: decision.model, status: listing.status, fromDraft: true },
  });

  return ok({ listing: await withCategorySlug(listing) });
}

// DELETE /api/listings/:id — discard a draft (or a rejected listing).
export async function DELETE(_req, { params }) {
  const guard = requireAuth([...SELLER_ROLES, ROLES.ADMIN]);
  if (guard.error) return guard.error;

  await connectDB();
  const listing = await Listing.findById(params.id);
  if (!listing) return fail("Listing not found", 404);

  const isAdmin = guard.session.role === ROLES.ADMIN;
  if (!isAdmin && listing.owner.toString() !== guard.session.sub) {
    return fail("Forbidden: this listing belongs to another account", 403);
  }
  if (!EDITABLE_STATUSES.includes(listing.status)) {
    return fail(`Only a draft or rejected listing can be deleted (this one is '${listing.status}')`, 409);
  }

  await Listing.deleteOne({ _id: listing._id });

  await audit({
    actor: guard.session.sub,
    actorRole: guard.session.role,
    action: "listing.delete_draft",
    targetType: "Listing",
    targetId: listing._id,
    meta: { title: listing.title, status: listing.status },
  });

  return ok({ deleted: true });
}
