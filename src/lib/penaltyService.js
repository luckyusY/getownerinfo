import User from "@/models/User";
import Penalty from "@/models/Penalty";
import PlatformSettings, { getSettings } from "@/models/PlatformSettings";
import { DEFAULT_SETTINGS } from "@/data/catalog";
import { computePenalty } from "@/lib/pricing";
import { audit } from "@/models/AuditLog";

/**
 * Apply a penalty to a user and add it to their outstanding balance (which
 * blocks new Model A listings until cleared). Returns the immutable record.
 *
 * @param {object} args
 *   - userId        offender
 *   - offenseType
 *   - reason
 *   - expectedAmount  base (e.g. the dodged commission/fee); 0 for fixed-only
 *   - listingId?
 *   - issuedBy?       admin user id; null = system
 *   - severe?         flag account for suspension/blacklist instead of a fee
 */
export async function applyPenalty({
  userId,
  offenseType,
  reason,
  expectedAmount = 0,
  listingId = null,
  issuedBy = null,
  severe = false,
}) {
  const settings = await getSettings(PlatformSettings, DEFAULT_SETTINGS);
  const percent = settings.penalty?.commissionPercent ?? 0.5;
  const fixedAmount = settings.penalty?.fixedAmount ?? 100_000;
  const total = computePenalty({ expectedAmount, commissionPercent: percent, fixedAmount });

  const penalty = await Penalty.create({
    user: userId,
    listing: listingId,
    offenseType,
    reason,
    expectedAmount,
    percent,
    fixedAmount,
    total,
    issuedBy,
  });

  const update = { $inc: { penaltyBalance: total } };
  if (severe) update.$set = { isBlacklisted: true };
  await User.updateOne({ _id: userId }, update);

  await audit({
    actor: issuedBy,
    actorRole: issuedBy ? "admin" : "system",
    action: "penalty.apply",
    targetType: "User",
    targetId: userId,
    meta: { offenseType, total, listingId, severe },
  });

  return penalty;
}
