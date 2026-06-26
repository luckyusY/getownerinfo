import { connectDB } from "@/lib/db";
import Payment from "@/models/Payment";
import Listing from "@/models/Listing";
import TokenUnlock from "@/models/TokenUnlock";
import Commission from "@/models/Commission";
import Penalty from "@/models/Penalty";
import User from "@/models/User";
import { ok, requireAuth } from "@/lib/api";
import { ROLES, PAYMENT_STATUS } from "@/lib/constants";

// GET /api/admin/analytics — platform revenue & usage rollups (admin).
export async function GET() {
  const guard = requireAuth([ROLES.ADMIN]);
  if (guard.error) return guard.error;

  await connectDB();
  const since30 = new Date(Date.now() - 30 * 24 * 3600 * 1000);

  const [
    revenueByType,
    revenue30,
    listingsByStatus,
    listingsByModel,
    unlocks30,
    unlocksTotal,
    tokenByTier,
    usersByRole,
    commissionAgg,
    penaltyAgg,
    revenueByDay,
  ] = await Promise.all([
    // Paid revenue grouped by payment type (all-time)
    Payment.aggregate([
      { $match: { status: PAYMENT_STATUS.PAID } },
      { $group: { _id: "$type", total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    // Paid revenue in last 30 days
    Payment.aggregate([
      { $match: { status: PAYMENT_STATUS.PAID, createdAt: { $gte: since30 } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Listing.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Listing.aggregate([{ $group: { _id: "$model", count: { $sum: 1 } } }]),
    TokenUnlock.countDocuments({ at: { $gte: since30 } }),
    TokenUnlock.countDocuments({}),
    TokenUnlock.aggregate([{ $group: { _id: "$tier", count: { $sum: 1 }, revenue: { $sum: "$amountPaid" } } }]),
    User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
    Commission.aggregate([
      { $group: { _id: "$status", total: { $sum: "$total" }, count: { $sum: 1 } } },
    ]),
    Penalty.aggregate([
      { $group: { _id: "$status", total: { $sum: "$total" }, count: { $sum: 1 } } },
    ]),
    // Daily paid revenue for the last 30 days (for a trend chart)
    Payment.aggregate([
      { $match: { status: PAYMENT_STATUS.PAID, createdAt: { $gte: since30 } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, total: { $sum: "$amount" } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const asMap = (arr) => Object.fromEntries(arr.map((x) => [x._id || "unknown", x]));
  const totalRevenue = revenueByType.reduce((s, x) => s + x.total, 0);

  return ok({
    revenue: {
      total: totalRevenue,
      last30Days: revenue30[0]?.total || 0,
      byType: asMap(revenueByType),
      byDay: revenueByDay.map((d) => ({ date: d._id, total: d.total })),
    },
    listings: { byStatus: asMap(listingsByStatus), byModel: asMap(listingsByModel) },
    unlocks: { last30Days: unlocks30, total: unlocksTotal, byTier: asMap(tokenByTier) },
    users: asMap(usersByRole),
    commissions: asMap(commissionAgg),
    penalties: asMap(penaltyAgg),
  });
}
