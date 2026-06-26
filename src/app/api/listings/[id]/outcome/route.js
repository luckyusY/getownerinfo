import { z } from "zod";
import { connectDB } from "@/lib/db";
import Listing from "@/models/Listing";
import Category from "@/models/Category";
import User from "@/models/User";
import Commission from "@/models/Commission";
import TokenUnlock from "@/models/TokenUnlock";
import PlatformSettings, { getSettings } from "@/models/PlatformSettings";
import { DEFAULT_SETTINGS } from "@/data/catalog";
import { computeCommission } from "@/lib/pricing";
import { audit } from "@/models/AuditLog";
import { ok, fail, requireAuth } from "@/lib/api";
import { ROLES, LISTING_STATUS, LISTING_MODELS, DEAL_OUTCOMES } from "@/lib/constants";

const schema = z.object({
  outcome: z.enum([DEAL_OUTCOMES.SOLD, DEAL_OUTCOMES.RENTED, DEAL_OUTCOMES.NOT_CONCLUDED]),
  finalAmount: z.number().nonnegative().optional(),
  completedDate: z.string().optional(),
});

// POST /api/listings/:id/outcome — owner reports the off-platform deal result.
// For Model A sold/rented, the system auto-calculates and invoices commission.
export async function POST(req, { params }) {
  const guard = requireAuth([ROLES.OWNER, ROLES.ADMIN]);
  if (guard.error) return guard.error;

  let body;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body");
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail("Validation failed", 422, { issues: parsed.error.flatten().fieldErrors });
  const { outcome, finalAmount, completedDate } = parsed.data;

  await connectDB();
  const listing = await Listing.findById(params.id);
  if (!listing) return fail("Listing not found", 404);

  const isOwner = listing.owner.toString() === guard.session.sub;
  if (!isOwner && guard.session.role !== ROLES.ADMIN) return fail("Forbidden", 403);

  if (![LISTING_STATUS.ACTIVE, LISTING_STATUS.UNDER_NEGOTIATION].includes(listing.status)) {
    return fail(`Cannot report outcome for a listing that is '${listing.status}'`, 409);
  }

  const concluded = outcome !== DEAL_OUTCOMES.NOT_CONCLUDED;
  if (concluded && (finalAmount == null || finalAmount <= 0)) {
    return fail("finalAmount is required when the deal is sold or rented", 422);
  }

  // Anti-cheating: "not concluded" despite contact unlocks is suspicious.
  const unlockCount = await TokenUnlock.countDocuments({ listing: listing._id });
  if (!concluded && unlockCount > 0) {
    listing.reviewFlag = true;
    listing.reviewReason = `Reported "not concluded" despite ${unlockCount} contact unlock(s).`;
  }

  listing.dealOutcome = outcome;
  listing.finalAmount = concluded ? finalAmount : null;
  listing.dealCompletedAt = completedDate ? new Date(completedDate) : new Date();
  listing.status =
    outcome === DEAL_OUTCOMES.SOLD
      ? LISTING_STATUS.SOLD
      : outcome === DEAL_OUTCOMES.RENTED
      ? LISTING_STATUS.RENTED
      : LISTING_STATUS.NOT_CONCLUDED;

  let commission = null;

  // Commission applies only to Model A concluded deals.
  if (concluded && listing.model === LISTING_MODELS.A) {
    const category = await Category.findById(listing.category);
    const settings = await getSettings(PlatformSettings, DEFAULT_SETTINGS);
    const calc = computeCommission({
      amount: finalAmount,
      commissionPercent: category?.commissionPercent ?? 0,
      vatRate: settings.vatRate,
    });

    const dueDate = new Date(Date.now() + 7 * 24 * 3600 * 1000);
    commission = await Commission.create({
      listing: listing._id,
      owner: listing.owner,
      dealOutcome: outcome,
      finalAmount,
      commissionPercent: calc.commissionPercent,
      total: calc.total,
      vatPortion: calc.vatPortion,
      status: "invoiced",
      dueDate,
    });

    // Increment the owner's outstanding balance -> restricts new exclusive listings.
    await User.updateOne({ _id: listing.owner }, { $inc: { commissionDue: calc.total } });
  }

  await listing.save();

  await audit({
    actor: guard.session.sub,
    actorRole: guard.session.role,
    action: "listing.outcome",
    targetType: "Listing",
    targetId: listing._id,
    meta: { outcome, finalAmount, commissionId: commission?._id?.toString(), flagged: listing.reviewFlag },
  });

  return ok({
    listing: { id: listing._id.toString(), status: listing.status, reviewFlag: listing.reviewFlag },
    commission: commission
      ? { id: commission._id.toString(), total: commission.total, vatPortion: commission.vatPortion, dueDate: commission.dueDate }
      : null,
  });
}
