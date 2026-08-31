import { z } from "zod";
import { connectDB } from "@/lib/db";
import Listing from "@/models/Listing";
import Report, { REPORT_REASONS, REPORT_STATUS } from "@/models/Report";
import { audit } from "@/models/AuditLog";
import { ok, fail, requireAuth } from "@/lib/api";
import { enforceRateLimit } from "@/lib/rateLimit";

const schema = z.object({
  listingId: z.string().min(1),
  reason: z.enum(Object.values(REPORT_REASONS)),
  details: z.string().max(2000).optional(),
});

// Number of distinct reporters before a listing is auto-flagged for review.
const AUTO_FLAG_THRESHOLD = 3;

// POST /api/reports — any signed-in user can report a listing.
export async function POST(req) {
  const guard = requireAuth();
  if (guard.error) return guard.error;

  const limited = await enforceRateLimit(req, {
    name: "report",
    limit: 10,
    windowMs: 60 * 60 * 1000,
    identifier: guard.session.sub,
  });
  if (limited) return limited;

  let body;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body");
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return fail("Validation failed", 422, { issues: parsed.error.flatten().fieldErrors });
  }

  await connectDB();
  const listing = await Listing.findById(parsed.data.listingId).select("owner title reviewFlag");
  if (!listing) return fail("Listing not found", 404);
  if (listing.owner.toString() === guard.session.sub) {
    return fail("You cannot report your own listing", 400);
  }

  try {
    await Report.create({
      reporter: guard.session.sub,
      listing: listing._id,
      listingOwner: listing.owner,
      reason: parsed.data.reason,
      details: parsed.data.details,
    });
  } catch (err) {
    // Unique index on (reporter, listing).
    if (err?.code === 11000) return fail("You have already reported this listing", 409);
    throw err;
  }

  // Several independent reporters is a stronger signal than any single one —
  // surface the listing to admins automatically rather than waiting for someone
  // to notice the queue.
  const distinctReporters = await Report.countDocuments({
    listing: listing._id,
    status: { $in: [REPORT_STATUS.OPEN, REPORT_STATUS.REVIEWING] },
  });
  if (distinctReporters >= AUTO_FLAG_THRESHOLD && !listing.reviewFlag) {
    await Listing.updateOne(
      { _id: listing._id },
      { $set: { reviewFlag: true, reviewReason: `${distinctReporters} unresolved user reports` } }
    );
  }

  await audit({
    actor: guard.session.sub,
    actorRole: guard.session.role,
    action: "listing.report",
    targetType: "Listing",
    targetId: listing._id,
    meta: { reason: parsed.data.reason, distinctReporters },
  });

  return ok({ reported: true }, 201);
}
