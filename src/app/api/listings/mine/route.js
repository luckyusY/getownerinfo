import { connectDB } from "@/lib/db";
import Listing from "@/models/Listing";
import { ok, requireAuth } from "@/lib/api";
import { ROLES } from "@/lib/constants";

// GET /api/listings/mine — the authenticated owner's own listings (full view).
export async function GET() {
  const guard = requireAuth([ROLES.OWNER, ROLES.MANAGER, ROLES.ADMIN]);
  if (guard.error) return guard.error;

  await connectDB();
  const listings = await Listing.find({ owner: guard.session.sub }).sort({ createdAt: -1 });
  return ok({ listings: listings.map((l) => l.toFullJSON({ includeProof: true })) });
}
