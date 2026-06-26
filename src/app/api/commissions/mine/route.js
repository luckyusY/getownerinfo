import { connectDB } from "@/lib/db";
import Commission from "@/models/Commission";
import Listing from "@/models/Listing";
import { ok, requireAuth } from "@/lib/api";
import { ROLES } from "@/lib/constants";

// GET /api/commissions/mine — owner's commission invoices.
export async function GET() {
  const guard = requireAuth([ROLES.OWNER, ROLES.ADMIN]);
  if (guard.error) return guard.error;

  await connectDB();
  const commissions = await Commission.find({ owner: guard.session.sub })
    .sort({ createdAt: -1 })
    .populate({ path: "listing", model: Listing, select: "title" });

  return ok({
    commissions: commissions.map((c) => ({
      id: c._id.toString(),
      listingTitle: c.listing?.title || "(removed)",
      dealOutcome: c.dealOutcome,
      finalAmount: c.finalAmount,
      commissionPercent: c.commissionPercent,
      total: c.total,
      vatPortion: c.vatPortion,
      status: c.status,
      dueDate: c.dueDate,
      paidAt: c.paidAt,
    })),
  });
}
