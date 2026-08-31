import { connectDB } from "@/lib/db";
import Listing from "@/models/Listing";
import { notifyUser } from "@/models/Notification";
import { audit } from "@/models/AuditLog";
import { ok, fail } from "@/lib/api";
import { LISTING_STATUS } from "@/lib/constants";

// GET /api/cron/expire-listings — daily job (see vercel.json).
//
// `expiresAt` was written on every listing since launch but nothing ever read
// it, so listings stayed live forever regardless of the duration the owner paid
// for. This closes that loop and warns owners before it happens.
//
// Vercel Cron sends `Authorization: Bearer $CRON_SECRET`.
const WARN_DAYS = 3;

function authorized(req) {
  const secret = process.env.CRON_SECRET;
  // Without a configured secret the endpoint stays closed rather than open.
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req) {
  if (!authorized(req)) return fail("Unauthorized", 401);

  await connectDB();
  const now = new Date();

  // 1. Expire anything past its date that is still publicly live.
  const due = await Listing.find({
    status: { $in: [LISTING_STATUS.ACTIVE, LISTING_STATUS.UNDER_NEGOTIATION] },
    expiresAt: { $lt: now },
  }).select("_id title owner");

  if (due.length) {
    await Listing.updateMany(
      { _id: { $in: due.map((l) => l._id) } },
      { $set: { status: LISTING_STATUS.EXPIRED } }
    );
    for (const l of due) {
      await notifyUser({
        user: l.owner,
        type: "listing_expired",
        title: "Your listing expired",
        body: `"${l.title}" is no longer visible to buyers. Renew it to bring it back.`,
        link: "/dashboard/owner",
      });
    }
    await audit({
      actorRole: "system",
      action: "listing.expire_batch",
      targetType: "Listing",
      meta: { count: due.length },
    });
  }

  // 2. Warn owners whose listings lapse soon, once, via a sticky flag.
  const warnBefore = new Date(now.getTime() + WARN_DAYS * 24 * 3600 * 1000);
  const expiringSoon = await Listing.find({
    status: LISTING_STATUS.ACTIVE,
    expiresAt: { $gte: now, $lte: warnBefore },
    expiryWarnedAt: null,
  }).select("_id title owner expiresAt");

  for (const l of expiringSoon) {
    await notifyUser({
      user: l.owner,
      type: "listing_expiring",
      title: "Listing expires soon",
      body: `"${l.title}" expires on ${new Date(l.expiresAt).toLocaleDateString()}. Renew to keep it live.`,
      link: "/dashboard/owner",
    });
  }
  if (expiringSoon.length) {
    await Listing.updateMany(
      { _id: { $in: expiringSoon.map((l) => l._id) } },
      { $set: { expiryWarnedAt: now } }
    );
  }

  return ok({ expired: due.length, warned: expiringSoon.length });
}
