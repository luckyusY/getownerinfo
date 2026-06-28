import { connectDB } from "@/lib/db";
import Notification from "@/models/Notification";
import { ok, requireAuth } from "@/lib/api";

// GET /api/notifications — latest notifications + unread count for the user.
export async function GET() {
  const guard = requireAuth();
  if (guard.error) return guard.error;

  await connectDB();
  const [items, unread] = await Promise.all([
    Notification.find({ user: guard.session.sub }).sort({ createdAt: -1 }).limit(20).lean(),
    Notification.countDocuments({ user: guard.session.sub, read: false }),
  ]);

  return ok({
    unread,
    notifications: items.map((n) => ({
      id: n._id.toString(),
      type: n.type,
      title: n.title,
      body: n.body,
      link: n.link,
      read: n.read,
      at: n.createdAt,
    })),
  });
}
