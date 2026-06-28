import { z } from "zod";
import { connectDB } from "@/lib/db";
import Notification from "@/models/Notification";
import { ok, fail, requireAuth } from "@/lib/api";

const schema = z.object({ id: z.string().optional(), all: z.boolean().optional() });

// POST /api/notifications/read — mark one (id) or all (all:true) as read.
export async function POST(req) {
  const guard = requireAuth();
  if (guard.error) return guard.error;

  let body = {};
  try {
    body = await req.json();
  } catch {
    /* default to marking all */
  }
  const parsed = schema.safeParse(body || {});
  if (!parsed.success) return fail("Invalid request", 422);

  await connectDB();
  const filter = { user: guard.session.sub, read: false };
  if (parsed.data.id) filter._id = parsed.data.id;
  await Notification.updateMany(filter, { $set: { read: true } });

  const unread = await Notification.countDocuments({ user: guard.session.sub, read: false });
  return ok({ unread });
}
