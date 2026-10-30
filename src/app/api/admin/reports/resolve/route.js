import { z } from "zod";
import { connectDB } from "@/lib/db";
import Listing from "@/models/Listing";
import Report, { REPORT_STATUS } from "@/models/Report";
import { audit } from "@/models/AuditLog";
import { dispatch } from "@/lib/notificationService";
import { ok, fail, requireAuth } from "@/lib/api";
import { ROLES, LISTING_STATUS } from "@/lib/constants";

const schema = z.object({
  listingId: z.string().min(1),
  action: z.enum(["uphold", "dismiss"]),
  resolution: z.string().max(500).optional(),
  // Upholding may also take the listing down.
  takedown: z.boolean().optional().default(false),
});

// POST /api/admin/reports/resolve — resolve every open report on one listing.
export async function POST(req) {
  const guard = requireAuth([ROLES.ADMIN]);
  if (guard.error) return guard.error;

  let body;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body");
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail("Validation failed", 422);
  const { listingId, action, resolution, takedown } = parsed.data;

  await connectDB();
  const listing = await Listing.findById(listingId).select("title owner status");
  if (!listing) return fail("Listing not found", 404);

  const upheld = action === "uphold";

  // Collected before the update, because afterwards there is nothing left
  // matching "open" to read the reporters off. Each of these people filed a
  // report and, until now, never heard whether anything came of it — which is
  // the surest way to stop people reporting anything at all.
  const openReports = await Report.find({
    listing: listing._id,
    status: { $in: [REPORT_STATUS.OPEN, REPORT_STATUS.REVIEWING] },
  })
    .select("reporter")
    .lean();

  const result = await Report.updateMany(
    { listing: listing._id, status: { $in: [REPORT_STATUS.OPEN, REPORT_STATUS.REVIEWING] } },
    {
      $set: {
        status: upheld ? REPORT_STATUS.UPHELD : REPORT_STATUS.DISMISSED,
        resolution: resolution || (upheld ? "Report upheld" : "No violation found"),
        reviewedBy: guard.session.sub,
        reviewedAt: new Date(),
      },
    }
  );

  const listingUpdate = { reviewFlag: false, reviewReason: null };
  if (upheld && takedown) listingUpdate.status = LISTING_STATUS.REJECTED;
  await Listing.updateOne({ _id: listing._id }, { $set: listingUpdate });

  if (upheld) {
    await dispatch("listing_upheld_report", {
      userId: listing.owner,
      data: { listing, resolution, takedown: Boolean(takedown) },
    });
  }

  // Close the loop with everyone who reported it, whichever way it went.
  const outcome = upheld
    ? takedown
      ? "the listing was removed"
      : "upheld — the owner has been asked to correct it"
    : "no violation found";
  const reporters = [...new Set(openReports.map((r) => r.reporter.toString()))];
  for (const reporter of reporters) {
    await dispatch("report_resolved", { userId: reporter, data: { outcome } });
  }

  await audit({
    actor: guard.session.sub,
    actorRole: guard.session.role,
    action: upheld ? "report.uphold" : "report.dismiss",
    targetType: "Listing",
    targetId: listing._id,
    meta: { resolved: result.modifiedCount, takedown: Boolean(upheld && takedown) },
  });

  return ok({ resolved: result.modifiedCount, takedown: Boolean(upheld && takedown) });
}
