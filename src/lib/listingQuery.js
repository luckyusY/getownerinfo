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
