import { connectDB } from "@/lib/db";
import TokenUnlock from "@/models/TokenUnlock";
import Listing from "@/models/Listing";
import { ok, requireAuth } from "@/lib/api";

// GET /api/unlocks/mine — the authenticated buyer's unlock history.
export async function GET() {
  const guard = requireAuth();
  if (guard.error) return guard.error;

  await connectDB();
  const unlocks = await TokenUnlock.find({ user: guard.session.sub })
    .sort({ at: -1 })
    .populate({ path: "listing", model: Listing, select: "title price category transactionType" });

  return ok({
    unlocks: unlocks.map((u) => ({
      id: u._id.toString(),
      listingId: u.listing?._id?.toString(),
      listingTitle: u.listing?.title || "(removed)",
      price: u.listing?.price,
      tier: u.tier,
      amountPaid: u.amountPaid,
      at: u.at,
    })),
  });
}
