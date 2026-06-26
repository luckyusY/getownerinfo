import { connectDB } from "@/lib/db";
import Conversation from "@/models/Conversation";
import Listing from "@/models/Listing";
import User from "@/models/User";
import { ok, requireAuth } from "@/lib/api";
import { ROLES } from "@/lib/constants";

// GET /api/conversations/mine — threads for the current user (buyer or owner).
export async function GET() {
  const guard = requireAuth([ROLES.BUYER, ROLES.OWNER, ROLES.ADMIN, ROLES.MANAGER]);
  if (guard.error) return guard.error;
  const { role, sub } = guard.session;

  await connectDB();
  const filter = role === ROLES.BUYER ? { buyer: sub } : { owner: sub };

  const convos = await Conversation.find(filter)
    .sort({ lastMessageAt: -1 })
    .populate({ path: "listing", model: Listing, select: "title" })
    .populate({ path: "buyer", model: User, select: "name" });

  return ok({
    conversations: convos.map((c) => ({
      listingId: c.listing?._id?.toString(),
      listingTitle: c.listing?.title || "(removed)",
      buyerId: c.buyer?._id?.toString(),
      buyerName: c.buyer?.name,
      preview: c.lastMessagePreview,
      lastMessageAt: c.lastMessageAt,
    })),
  });
}
