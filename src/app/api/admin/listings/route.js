import { z } from "zod";
import { connectDB } from "@/lib/db";
import Listing from "@/models/Listing";
import Category from "@/models/Category";
import User from "@/models/User";
import { audit } from "@/models/AuditLog";
import { notifyUser } from "@/models/Notification";
import { notify } from "@/lib/notify";
import { missingFields, completionPercent } from "@/lib/listingForm";
import { ok, fail, requireAuth } from "@/lib/api";
import { ROLES, LISTING_STATUS } from "@/lib/constants";

// GET /api/admin/listings?status=pending_approval — moderation queue (admin).
//
// For drafts this also reports how complete each form is and what is still
// missing, which is the admin view of incomplete and abandoned forms.
export async function GET(req) {
  const guard = requireAuth([ROLES.ADMIN]);
  if (guard.error) return guard.error;

  await connectDB();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || LISTING_STATUS.PENDING_APPROVAL;
  // Only forms untouched for this many days, so "abandoned" can be separated
  // from a draft someone is actively working on.
  const staleDays = Number(searchParams.get("staleDays")) || 0;

  const filter = { status };
  if (staleDays > 0) {
    filter.updatedAt = { $lt: new Date(Date.now() - staleDays * 86400000) };
  }

  const listings = await Listing.find(filter)
    .populate("owner", "name email phone")
    .populate("assignedManager", "name email")
    .sort({ updatedAt: 1 })
    .limit(100);

  const categories = await Category.find({}).select("slug name").lean();
  const catById = Object.fromEntries(categories.map((c) => [c._id.toString(), c]));

  return ok({
    listings: listings.map((l) => {
      const category = catById[l.category?.toString()];
      return {
        ...l.toFullJSON({ includeProof: true }),
        ownerName: l.owner?.name,
        ownerEmail: l.owner?.email,
        ownerPhone: l.owner?.phone || null,
        ownerId: l.owner?._id?.toString() || null,
        categoryName: category?.name || "Listing",
        assignedManagerId: l.assignedManager?._id?.toString() || null,
        assignedManagerName: l.assignedManager?.name || null,
        updatedAt: l.updatedAt,
        // Completion reporting, used by the drafts view.
        completionPercent: completionPercent(l, category),
        missingFields: missingFields(l, category),
      };
    }),
  });
}

const patchSchema = z.object({
  listingId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid listing id"),
  // null clears the assignment.
  assignedManager: z.string().regex(/^[a-f\d]{24}$/i).nullable(),
});

// PATCH /api/admin/listings — assign (or clear) the listing manager.
export async function PATCH(req) {
  const guard = requireAuth([ROLES.ADMIN]);
  if (guard.error) return guard.error;

  let body;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body");
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return fail("Validation failed", 422, { issues: parsed.error.flatten().fieldErrors });
  }
  const { listingId, assignedManager } = parsed.data;

  await connectDB();
  const listing = await Listing.findById(listingId);
  if (!listing) return fail("Listing not found", 404);

  let manager = null;
  if (assignedManager) {
    manager = await User.findById(assignedManager).select("name email role isActive");
    if (!manager) return fail("Manager not found", 404);
    if (manager.role !== ROLES.MANAGER) {
      return fail("That account is not a listing manager", 422);
    }
    if (manager.isActive === false) return fail("That listing manager is suspended", 409);
  }

  const previous = listing.assignedManager?.toString() || null;
  listing.assignedManager = assignedManager || null;
  await listing.save();

  await audit({
    actor: guard.session.sub,
    actorRole: guard.session.role,
    action: assignedManager ? "admin.listing_assigned" : "admin.listing_unassigned",
    targetType: "Listing",
    targetId: listing._id,
    meta: { previous, assignedManager: assignedManager || null },
  });

  // Tell the manager they now have work, so an assignment is not silent.
  if (manager) {
    await notifyUser({
      user: manager._id,
      type: "info",
      title: "A listing was assigned to you",
      body: `You are now managing “${listing.title}”.`,
      link: "/dashboard/manager",
    });
    await notify({
      to: manager.email,
      channel: "email",
      subject: "A listing was assigned to you",
      message: `You have been assigned "${listing.title}" on getownerinfo. Open your manager dashboard to review it.`,
    });
  }

  return ok({
    listingId: listing._id.toString(),
    assignedManagerId: assignedManager || null,
    assignedManagerName: manager?.name || null,
  });
}

const remindSchema = z.object({
  listingId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid listing id"),
});

// POST /api/admin/listings — nudge the owner of an incomplete form (spec Part 9).
export async function POST(req) {
  const guard = requireAuth([ROLES.ADMIN]);
  if (guard.error) return guard.error;

  let body;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body");
  }
  const parsed = remindSchema.safeParse(body);
  if (!parsed.success) return fail("Invalid listing id", 422);

  await connectDB();
  const listing = await Listing.findById(parsed.data.listingId).populate("owner", "name email");
  if (!listing) return fail("Listing not found", 404);
  if (listing.status !== LISTING_STATUS.DRAFT) {
    return fail("Only an unfinished draft can be chased", 409);
  }

  const category = await Category.findById(listing.category).select("slug name").lean();
  const missing = missingFields(listing, category);

  await notifyUser({
    user: listing.owner._id,
    type: "info",
    title: "Finish your listing",
    body: missing.length
      ? `“${listing.title}” still needs: ${missing.join(", ")}.`
      : `“${listing.title}” is ready to submit.`,
    link: `/dashboard/owner/listings/new?draft=${listing._id.toString()}`,
  });

  const delivery = await notify({
    to: listing.owner?.email,
    channel: "email",
    subject: `Your listing “${listing.title}” is not finished`,
    message: [
      `Your draft listing "${listing.title}" has not been submitted yet.`,
      missing.length ? `Still needed: ${missing.join(", ")}.` : "It looks complete — submit it when ready.",
      "",
      "Reopen it from your dashboard to finish and submit.",
    ].join("\n"),
  });

  await audit({
    actor: guard.session.sub,
    actorRole: guard.session.role,
    action: "admin.listing_reminder_sent",
    targetType: "Listing",
    targetId: listing._id,
    meta: { missing, emailDelivered: delivery.delivered },
  });

  return ok({ reminded: true, missing, emailDelivered: delivery.delivered });
}
