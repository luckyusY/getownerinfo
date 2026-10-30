import { LISTING_STATUS } from "./constants.js";

/**
 * Matches listings that have not passed their paid duration. Listings created
 * before `expiresAt` existed have no value, so treat a missing date as "never
 * expires" rather than "already expired".
 */
export function notExpired(now = new Date()) {
  return {
    $or: [
      { expiresAt: null },
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: now } },
    ],
  };
}

/**
 * The canonical filter for listings shown to the public.
 *
 * The daily cron flips expired listings to EXPIRED, but this is the guard that
 * matters: if the cron is late, misconfigured, or fails, buyers still never see
 * a listing the owner has stopped paying for.
 *
 * Uses `$and` so callers stay free to use `$or` for search terms.
 */
export function publicListingFilter(extra = {}) {
  return {
    status: LISTING_STATUS.ACTIVE,
    ...extra,
    $and: [...(extra.$and || []), notExpired()],
  };
}

/**
 * Escape a user-supplied string for use inside a `$regex`.
 *
 * Search terms used to reach the query untouched, so a visitor typing `c++`
 * or an unbalanced `(` built an invalid pattern and the query threw. The
 * browse page catches fetch errors silently, so that surfaced as a skeleton
 * that never resolved.
 */
export function escapeRegex(input) {
  return String(input).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Which of these listings' owners have completed identity verification.
 *
 * `isVerified` lives on the User, not the Listing, so the grid had no way to
 * show it — the badge existed only on the detail page, after the buyer had
 * already chosen what to click. One `$in` over the distinct owners rather than
 * a lookup per card, and no denormalised copy to keep in step.
 *
 * Returns a Set of owner id strings so both the lean and the document card
 * paths can use it.
 *
 * @param {Array<{owner?: unknown}>} listings
 * @param {import("mongoose").Model} User
 * @returns {Promise<Set<string>>}
 */
export async function verifiedOwnerIds(listings, User) {
  const ids = [...new Set((listings || []).map((l) => l.owner?.toString()).filter(Boolean))];
  if (!ids.length) return new Set();
  const owners = await User.find({ _id: { $in: ids }, isVerified: true })
    .select("_id")
    .lean()
    .catch(() => []);
  return new Set(owners.map((o) => o._id.toString()));
}
