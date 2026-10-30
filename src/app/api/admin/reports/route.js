import { connectDB } from "@/lib/db";
import Listing from "@/models/Listing";
import User from "@/models/User";
import Report, { REPORT_STATUS } from "@/models/Report";
import { ok, requireAuth } from "@/lib/api";
import { ROLES } from "@/lib/constants";

// GET /api/admin/reports?status=open — moderation queue for user reports,
// grouped by listing so an admin sees "5 people reported this" rather than five
// separate rows.
export async function GET(req) {
  // There is no report-to-manager assignment model yet; this is a global queue.
  const guard = requireAuth([ROLES.ADMIN]);
  if (guard.error) return guard.error;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || REPORT_STATUS.OPEN;

  await connectDB();
  const reports = await Report.find({ status })
    .sort({ createdAt: -1 })
    .limit(200)
    .populate({ path: "listing", model: Listing, select: "title status price reviewFlag owner" })
    .populate({ path: "reporter", model: User, select: "name email" })
    .lean();

  // Group by listing.
  const byListing = new Map();
  for (const r of reports) {
    const key = r.listing?._id?.toString() || "removed";
    if (!byListing.has(key)) {
      byListing.set(key, {
        listingId: key,
        title: r.listing?.title || "(listing removed)",
        listingStatus: r.listing?.status || null,
        reviewFlag: Boolean(r.listing?.reviewFlag),
        count: 0,
        reasons: {},
        reports: [],
      });
    }
    const g = byListing.get(key);
    g.count += 1;
    g.reasons[r.reason] = (g.reasons[r.reason] || 0) + 1;
    g.reports.push({
      id: r._id.toString(),
      reason: r.reason,
      details: r.details || "",
      reporterName: r.reporter?.name || "Unknown",
      at: r.createdAt,
      // Present only when the reporter had paid to unlock this listing.
      paidUnlock: r.meta?.unlockId
        ? { amountPaid: r.meta.amountPaid ?? null, tier: r.meta.tier || null, at: r.meta.unlockedAt || null }
        : null,
    });
  }

  // Most-reported first — that ordering is the whole point of the queue.
  const groups = [...byListing.values()].sort((a, b) => b.count - a.count);
  return ok({ groups });
}
