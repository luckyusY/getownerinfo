// Automatic commission enforcement and fraud detection (spec Part 24).
//
// Everything here is advisory to the admin rather than final: each check
// records an immutable Penalty and flags the listing or account for review.
// An admin can waive a penalty, so a false positive is recoverable — but the
// detection itself is never skipped.

import Listing from "@/models/Listing";
import User from "@/models/User";
import Commission from "@/models/Commission";
import TokenUnlock from "@/models/TokenUnlock";
import { applyPenalty } from "@/lib/penaltyService";
import { audit } from "@/models/AuditLog";
import { notifyUser } from "@/models/Notification";
import { LISTING_STATUS, DEAL_OUTCOMES } from "@/lib/constants";
import { OFFENSE_TYPES } from "@/models/Penalty";
import { dispatch } from "@/lib/notificationService";

/** Normalise a title for comparison: lowercase, no punctuation, single spaces. */
function normalizeTitle(title) {
  return String(title || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Rough overlap between two titles, as a fraction of the shorter one's words.
 * Deliberately simple — it only needs to catch an owner re-posting the same
 * item, not to do semantic matching.
 */
function titleOverlap(a, b) {
  const wordsA = new Set(normalizeTitle(a).split(" ").filter((w) => w.length > 2));
  const wordsB = new Set(normalizeTitle(b).split(" ").filter((w) => w.length > 2));
  if (!wordsA.size || !wordsB.size) return 0;
  let shared = 0;
  for (const w of wordsA) if (wordsB.has(w)) shared += 1;
  return shared / Math.min(wordsA.size, wordsB.size);
}

/**
 * Find a near-identical live listing from the same owner.
 * @returns {object|null} the existing listing, or null.
 */
export async function findDuplicateListing({ ownerId, categoryId, title, price, excludeId, settings }) {
  const windowDays = settings?.fraud?.duplicateWindowDays ?? 30;
  const since = new Date(Date.now() - windowDays * 86400000);

  const candidates = await Listing.find({
    owner: ownerId,
    category: categoryId,
    status: { $in: [LISTING_STATUS.ACTIVE, LISTING_STATUS.PENDING_APPROVAL, LISTING_STATUS.UNDER_NEGOTIATION] },
    createdAt: { $gte: since },
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  })
    .select("title price createdAt status")
    .lean();

  for (const c of candidates) {
    // Same ballpark price and a strongly overlapping title.
    const priceClose = price > 0 && c.price > 0 && Math.abs(c.price - price) / Math.max(c.price, price) <= 0.05;
    if (priceClose && titleOverlap(c.title, title) >= 0.8) return c;
  }
  return null;
}

/**
 * Assess a reported deal outcome for under-reporting and repeated
 * non-conclusion, applying penalties where the thresholds are crossed.
 *
 * @returns {{ flags: string[], penalties: object[] }}
 */
export async function assessDealOutcome({ listing, outcome, finalAmount, settings, category, actorId }) {
  const flags = [];
  const penalties = [];
  const tolerance = settings?.fraud?.underReportTolerance ?? 0.3;
  const maxNotConcluded = settings?.fraud?.maxNotConcluded ?? 3;

  const unlockCount = await TokenUnlock.countDocuments({ listing: listing._id });
  const concluded = outcome !== DEAL_OUTCOMES.NOT_CONCLUDED;

  if (!concluded && unlockCount > 0) {
    flags.push(`Reported "not concluded" despite ${unlockCount} paid contact unlock(s).`);

    // A pattern of this across the account is the real offence, not one report.
    const priorNotConcluded = await Listing.countDocuments({
      owner: listing.owner,
      dealOutcome: DEAL_OUTCOMES.NOT_CONCLUDED,
      unlockCount: { $gt: 0 },
      _id: { $ne: listing._id },
    });

    if (priorNotConcluded + 1 >= maxNotConcluded) {
      const expected = Math.round(listing.price * (category?.commissionPercent ?? 0));
      const penalty = await applyPenalty({
        userId: listing.owner,
        offenseType: OFFENSE_TYPES.FALSE_NOT_CONCLUDED,
        reason: `${priorNotConcluded + 1} listings with paid unlocks reported as "not concluded".`,
        expectedAmount: expected,
        listingId: listing._id,
      });
      penalties.push(penalty);
      flags.push(`Account pattern: ${priorNotConcluded + 1} unconcluded deals after paid unlocks.`);
    }
  }

  // Under-reporting: a deal closed far below what it was advertised at.
  if (concluded && listing.price > 0 && finalAmount > 0) {
    const shortfall = (listing.price - finalAmount) / listing.price;
    if (shortfall > tolerance) {
      const dodged = Math.round((listing.price - finalAmount) * (category?.commissionPercent ?? 0));
      flags.push(
        `Reported ${Math.round(shortfall * 100)}% below the listed price ` +
          `(${listing.price} listed vs ${finalAmount} reported).`
      );
      const penalty = await applyPenalty({
        userId: listing.owner,
        offenseType: OFFENSE_TYPES.UNDER_REPORT,
        reason: `Deal reported ${Math.round(shortfall * 100)}% below the listed price.`,
        expectedAmount: dodged,
        listingId: listing._id,
      });
      penalties.push(penalty);
    }
  }

  if (flags.length) {
    listing.reviewFlag = true;
    listing.reviewReason = flags.join(" ");

    await audit({
      actor: actorId,
      actorRole: "system",
      action: "fraud.outcome_flagged",
      targetType: "Listing",
      targetId: listing._id,
      meta: { flags, penaltyIds: penalties.map((p) => p._id.toString()), outcome, finalAmount },
    });
  }

  if (penalties.length) {
    await dispatch("penalty_applied", {
      userId: listing.owner,
      data: { reason: flags.join(" ") },
    });
  }

  return { flags, penalties };
}

/**
 * Commission invoices past their due date plus the grace period.
 * Applies a penalty once per overdue invoice and suspends repeat offenders.
 *
 * Intended to be driven by the daily cron.
 */
export async function enforceOverdueCommissions({ settings }) {
  const graceDays = settings?.fraud?.commissionGraceDays ?? 7;
  const cutoff = new Date(Date.now() - graceDays * 86400000);

  const overdue = await Commission.find({
    status: { $in: ["invoiced", "overdue"] },
    dueDate: { $lt: cutoff },
    penaltyApplied: { $ne: true },
  }).populate("listing", "title");

  const results = [];
  for (const commission of overdue) {
    const penalty = await applyPenalty({
      userId: commission.owner,
      offenseType: OFFENSE_TYPES.COMMISSION_DELAY,
      reason: `Commission of ${commission.total} Rwf unpaid more than ${graceDays} days past its due date.`,
      expectedAmount: commission.total,
      listingId: commission.listing?._id || null,
    });

    commission.status = "overdue";
    commission.penaltyApplied = true;
    await commission.save();

    // Repeat non-payment suspends the account from listing until settled.
    const unpaid = await Commission.countDocuments({
      owner: commission.owner,
      status: { $in: ["invoiced", "overdue"] },
    });
    if (unpaid >= 3) {
      await User.updateOne({ _id: commission.owner }, { $set: { isActive: false } });
      await audit({
        actorRole: "system",
        action: "fraud.account_suspended",
        targetType: "User",
        targetId: commission.owner,
        meta: { unpaidCommissions: unpaid },
      });
    }

    await dispatch("commission_overdue", {
      userId: commission.owner,
      data: { listing: commission.listing, commission },
    });

    results.push({ commissionId: commission._id.toString(), penaltyId: penalty._id.toString(), suspended: unpaid >= 3 });
  }

  return results;
}
