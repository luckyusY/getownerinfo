import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Listing from "@/models/Listing";
import Favorite from "@/models/Favorite";
import TokenUnlock from "@/models/TokenUnlock";
import SeekerRequest from "@/models/SeekerRequest";
import Conversation from "@/models/Conversation";
import Notification from "@/models/Notification";
import Commission from "@/models/Commission";
import { getSession } from "@/lib/auth";
import { ROLES, LISTING_STATUS } from "@/lib/constants";
import DashboardShell from "@/components/dashboard/DashboardShell";

/**
 * Counts behind the sidebar badges. Staff see their assigned/queue scope;
 * everyone else sees their own account, since one account both sells and buys.
 */
async function loadCounts(session) {
  const isAdmin = session.role === ROLES.ADMIN;
  const isManager = session.role === ROLES.MANAGER;
  const listingScope = isAdmin
    ? {}
    : isManager
      ? { assignedManager: session.sub }
      : { owner: session.sub };

  const [
    listings, active, pending, drafts,
    saved, unlocks, requests, conversations, notifications, invoices,
  ] = await Promise.all([
    Listing.countDocuments(listingScope),
    Listing.countDocuments({ ...listingScope, status: LISTING_STATUS.ACTIVE }),
    Listing.countDocuments({ ...listingScope, status: LISTING_STATUS.PENDING_APPROVAL }),
    Listing.countDocuments({ ...listingScope, status: LISTING_STATUS.DRAFT }),
    Favorite.countDocuments({ user: session.sub }),
    TokenUnlock.countDocuments({ user: session.sub }),
    SeekerRequest.countDocuments({ seeker: session.sub }),
    Conversation.countDocuments({ $or: [{ buyer: session.sub }, { owner: session.sub }] }),
    Notification.countDocuments({ user: session.sub, read: false }),
    Commission.countDocuments({ owner: session.sub, status: { $ne: "paid" } }),
  ]);

  return { listings, active, pending, drafts, saved, unlocks, requests, conversations, notifications, invoices };
}

export default async function DashboardLayout({ children }) {
  const session = getSession();
  if (!session) redirect("/login");

  await connectDB();
  const user = await User.findById(session.sub).lean();
  if (!user) redirect("/login");

  const counts = await loadCounts(session);

  return (
    <DashboardShell
      user={{
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl || null,
        isVerified: Boolean(user.isVerified),
      }}
      counts={{ ...counts, verified: Boolean(user.isVerified) }}
    >
      {children}
    </DashboardShell>
  );
}
