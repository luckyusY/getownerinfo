import { connectDB } from "@/lib/db";
import Commission from "@/models/Commission";
import Listing from "@/models/Listing";
import User from "@/models/User";
import { ok, requireAuth } from "@/lib/api";
import { ROLES } from "@/lib/constants";

// GET /api/admin/commissions — all commissions + revenue summary (admin).
export async function GET(req) {
  const guard = requireAuth([ROLES.ADMIN]);
  if (guard.error) return guard.error;

  await connectDB();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const query = status ? { status } : {};

  const commissions = await Commission.find(query)
    .sort({ createdAt: -1 })
    .populate({ path: "listing", model: Listing, select: "title" })
    .populate({ path: "owner", model: User, select: "name email" });

  const summary = commissions.reduce(
    (acc, c) => {
      acc.totalInvoiced += c.total;
      if (c.status === "paid") acc.totalPaid += c.total;
      else acc.totalOutstanding += c.total;
      return acc;
    },
    { totalInvoiced: 0, totalPaid: 0, totalOutstanding: 0 }
  );

  return ok({
    summary,
    commissions: commissions.map((c) => ({
      id: c._id.toString(),
      listingTitle: c.listing?.title || "(removed)",
      ownerName: c.owner?.name,
      ownerEmail: c.owner?.email,
      dealOutcome: c.dealOutcome,
      finalAmount: c.finalAmount,
      total: c.total,
      status: c.status,
      dueDate: c.dueDate,
    })),
  });
}
