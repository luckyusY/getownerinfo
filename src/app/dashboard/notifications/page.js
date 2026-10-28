import Link from "next/link";
import { connectDB } from "@/lib/db";
import Notification from "@/models/Notification";
import { guardRole } from "@/lib/guardRole";
import { ALL_ROLES } from "@/lib/constants";
import { PageHeader } from "@/components/ui/Dashboard";
import EmptyState from "@/components/ui/EmptyState";
import NotificationList from "./NotificationList";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const session = guardRole(ALL_ROLES);
  await connectDB();

  const notifications = await Notification.find({ user: session.sub })
    .sort({ createdAt: -1 })
    .limit(60)
    .lean();

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle="Approvals, unlocks, messages, expiry warnings and payment activity on your account."
      />

      <div className="mt-6">
        {notifications.length === 0 ? (
          <EmptyState
            title="Nothing yet"
            hint="Listing approvals, contact unlocks and new messages will appear here."
            action={<Link href="/listings" className="btn-primary">Browse listings</Link>}
          />
        ) : (
          <NotificationList
            notifications={notifications.map((n) => ({
              id: n._id.toString(),
              type: n.type,
              title: n.title,
              body: n.body,
              link: n.link,
              read: n.read,
              createdAt: n.createdAt?.toISOString() || null,
            }))}
          />
        )}
      </div>
    </div>
  );
}
