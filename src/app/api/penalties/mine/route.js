import { connectDB } from "@/lib/db";
import Penalty from "@/models/Penalty";
import Listing from "@/models/Listing";
import { ok, requireAuth } from "@/lib/api";

// GET /api/penalties/mine — the current user's penalties.
export async function GET() {
  const guard = requireAuth();
  if (guard.error) return guard.error;

  await connectDB();
  const penalties = await Penalty.find({ user: guard.session.sub })
    .sort({ createdAt: -1 })
    .populate({ path: "listing", model: Listing, select: "title" });

  return ok({
    penalties: penalties.map((p) => ({
      id: p._id.toString(),
      listingTitle: p.listing?.title || null,
      offenseType: p.offenseType,
      reason: p.reason,
      total: p.total,
      status: p.status,
      createdAt: p.createdAt,
    })),
  });
}
