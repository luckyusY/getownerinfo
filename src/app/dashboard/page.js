import { redirect } from "next/navigation";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Listing from "@/models/Listing";
import Category from "@/models/Category";
import TokenUnlock from "@/models/TokenUnlock";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";
import SeekerRequest from "@/models/SeekerRequest";
import { getSession } from "@/lib/auth";
import { ROLES, LISTING_STATUS } from "@/lib/constants";
import WelcomeHero from "@/components/dashboard/WelcomeHero";
import QuickActions from "@/components/dashboard/QuickActions";
import RecentListings from "@/components/dashboard/RecentListings";
import RecentMessages from "@/components/dashboard/RecentMessages";
import MyRequests from "@/components/dashboard/MyRequests";
import AccountOverview from "@/components/dashboard/AccountOverview";
import VerificationStatus from "@/components/dashboard/VerificationStatus";
import AccountActivity from "@/components/dashboard/AccountActivity";
import HelpSupport from "@/components/dashboard/HelpSupport";

export const dynamic = "force-dynamic";

const DAYS = 30;

/** Bucket timestamps into one count per day across the trailing window. */
function dailySeries(dates, days = DAYS) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));

  const points = new Array(days).fill(0);
  for (const d of dates) {
    if (!d) continue;
    const day = Math.floor((new Date(d) - start) / 86400000);
    if (day >= 0 && day < days) points[day] += 1;
  }

  const labels = points.map((_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  });
  return { points, labels };
}

export default async function DashboardOverview() {
  const session = getSession();
  if (!session) redirect("/login");

  // Staff keep their own purpose-built consoles.
  if (session.role === ROLES.ADMIN) redirect("/dashboard/admin");
  if (session.role === ROLES.MANAGER) redirect("/dashboard/manager");

  await connectDB();
  const me = new Types.ObjectId(session.sub);
  const since = new Date(Date.now() - DAYS * 86400000);

  const [user, listings, categories, unlocksOnMine, myUnlocks, conversations, requests, totalsAgg] =
    await Promise.all([
      User.findById(session.sub).lean(),
      Listing.find({ owner: session.sub }).sort({ updatedAt: -1 }).limit(6).lean(),
      Category.find({}).select("name slug").lean(),
      TokenUnlock.find({ owner: session.sub, at: { $gte: since } }).select("at").lean(),
      TokenUnlock.find({ user: session.sub, at: { $gte: since } }).select("at").lean(),
      Conversation.find({ $or: [{ buyer: me }, { owner: me }] })
        .sort({ lastMessageAt: -1 })
        .limit(5)
        .lean(),
      SeekerRequest.find({ seeker: session.sub }).sort({ createdAt: -1 }).limit(3).lean(),
      Listing.aggregate([
        { $match: { owner: me } },
        {
          $group: {
            _id: null,
            views: { $sum: "$viewCount" },
            unlocks: { $sum: "$unlockCount" },
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ["$status", LISTING_STATUS.ACTIVE] }, 1, 0] } },
          },
        },
      ]),
    ]);

  if (!user) redirect("/login");

  const catById = Object.fromEntries(categories.map((c) => [c._id.toString(), c]));

  // Resolve the other participant, the listing title, and a real unread count
  // for each of the most recent threads.
  const threads = await Promise.all(
    conversations.map(async (c) => {
      const iAmBuyer = c.buyer.toString() === session.sub;
      const otherId = iAmBuyer ? c.owner : c.buyer;
      const readAt = iAmBuyer ? c.buyerReadAt : c.ownerReadAt;

      const [person, listing, unread] = await Promise.all([
        User.findById(otherId).select("name avatarUrl").lean(),
        Listing.findById(c.listing).select("title").lean(),
        Message.countDocuments({
          conversation: c._id,
          sender: { $ne: me },
          blocked: { $ne: true },
          ...(readAt ? { createdAt: { $gt: readAt } } : {}),
        }),
      ]);

      return {
        id: c._id.toString(),
        listingId: c.listing.toString(),
        listingTitle: listing?.title || "Listing",
        name: person?.name || "Member",
        avatarUrl: person?.avatarUrl || null,
        role: iAmBuyer ? "Owner" : "Buyer",
        preview: c.lastMessagePreview || "",
        at: c.lastMessageAt,
        unread,
      };
    })
  );

  const totals = totalsAgg[0] || { views: 0, unlocks: 0, total: 0, active: 0 };
  const mine = dailySeries(unlocksOnMine.map((u) => u.at));
  const bought = dailySeries(myUnlocks.map((u) => u.at));
  const unreadTotal = threads.reduce((sum, t) => sum + t.unread, 0);

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_356px]">
      <div className="min-w-0 space-y-5">
        <WelcomeHero user={user} />
        <QuickActions unreadMessages={unreadTotal} />

        <RecentListings
          listings={listings.slice(0, 4).map((l) => ({
            id: l._id.toString(),
            title: l.title,
            status: l.status,
            price: l.price,
            transactionType: l.transactionType,
            image: l.images?.[0]?.url || null,
            area: l.location?.area || null,
            attributes: l.attributes || {},
            itemType: l.itemType,
            views: l.viewCount || 0,
            unlocks: l.unlockCount || 0,
          }))}
        />

        <div className="grid gap-5 lg:grid-cols-2">
          <RecentMessages conversations={threads} />
          <MyRequests
            requests={requests.map((r) => ({
              id: r._id.toString(),
              categoryName: catById[r.category?.toString()]?.name || "Request",
              categorySlug: catById[r.category?.toString()]?.slug || null,
              details: r.details,
              location: r.preferredLocation,
              status: r.status,
              createdAt: r.createdAt,
              responses: r.unlockCount || 0,
            }))}
          />
        </div>
      </div>

      <div className="min-w-0 space-y-5">
        <AccountOverview
          stats={{
            listings: totals.total || 0,
            active: totals.active || 0,
            views: totals.views || 0,
            unlocks: totals.unlocks || 0,
          }}
          myUnlocks={myUnlocks.length}
        />
        <VerificationStatus user={user} />
        <AccountActivity
          series={[
            { key: "mine", label: "Unlocks on my listings", color: "#1668E3", points: mine.points },
            { key: "bought", label: "Contacts I unlocked", color: "#15B0DD", points: bought.points },
          ]}
          labels={mine.labels}
        />
        <HelpSupport />
      </div>
    </div>
  );
}
