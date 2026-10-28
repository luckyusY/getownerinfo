import { connectDB } from "@/lib/db";
import Conversation from "@/models/Conversation";
import Listing from "@/models/Listing";
import Message from "@/models/Message";
import User from "@/models/User";
import { ok, requireAuth } from "@/lib/api";
import { ROLES, SELLER_ROLES } from "@/lib/constants";

// GET /api/conversations/mine — threads for the current user.
//
// One account both sells and buys, so a non-staff user gets BOTH sides: the
// threads on listings they own and the threads where they are the buyer.
export async function GET() {
  const guard = requireAuth([ROLES.BUYER, ...SELLER_ROLES, ROLES.ADMIN, ROLES.MANAGER]);
  if (guard.error) return guard.error;
  const { role, sub } = guard.session;

  await connectDB();
  let filter;
  if (role === ROLES.ADMIN) {
    filter = {};
  } else if (role === ROLES.MANAGER) {
    const assignedListingIds = await Listing.distinct("_id", { assignedManager: sub });
    filter = { listing: { $in: assignedListingIds } };
  } else {
    filter = { $or: [{ owner: sub }, { buyer: sub }] };
  }

  const convos = await Conversation.find(filter)
    .sort({ lastMessageAt: -1 })
    .populate({ path: "listing", model: Listing, select: "title images" })
    .populate({ path: "buyer", model: User, select: "name avatarUrl" })
    .populate({ path: "owner", model: User, select: "name avatarUrl" });

  // Real unread counts, per side, in one query rather than one per thread.
  const unreadRows = await Message.aggregate([
    { $match: { conversation: { $in: convos.map((c) => c._id) }, blocked: { $ne: true } } },
    { $group: { _id: { conversation: "$conversation", sender: "$sender" }, last: { $max: "$createdAt" }, count: { $sum: 1 }, items: { $push: "$createdAt" } } },
  ]);

  function unreadFor(convo, viewerIsBuyer) {
    const readAt = viewerIsBuyer ? convo.buyerReadAt : convo.ownerReadAt;
    let n = 0;
    for (const row of unreadRows) {
      if (row._id.conversation.toString() !== convo._id.toString()) continue;
      if (row._id.sender.toString() === sub) continue;
      n += readAt ? row.items.filter((at) => at > readAt).length : row.count;
    }
    return n;
  }

  return ok({
    conversations: convos.map((c) => {
      const viewerIsBuyer = c.buyer?._id?.toString() === sub;
      const other = viewerIsBuyer ? c.owner : c.buyer;
      return {
        listingId: c.listing?._id?.toString(),
        listingTitle: c.listing?.title || "(removed)",
        listingImage: c.listing?.images?.[0]?.url || null,
        buyerId: c.buyer?._id?.toString(),
        buyerName: c.buyer?.name,
        // Which side the signed-in user is on, so the UI can label the thread.
        side: viewerIsBuyer ? "buyer" : "owner",
        counterpartName: other?.name || "Member",
        counterpartAvatar: other?.avatarUrl || null,
        preview: c.lastMessagePreview,
        lastMessageAt: c.lastMessageAt,
        unread: unreadFor(c, viewerIsBuyer),
      };
    }),
  });
}
