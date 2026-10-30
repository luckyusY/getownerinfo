import { z } from "zod";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Listing from "@/models/Listing";
import TokenUnlock from "@/models/TokenUnlock";
import { audit } from "@/models/AuditLog";
import { ok, fail, requireAuth } from "@/lib/api";
import { escapeRegex } from "@/lib/listingQuery";
import { ROLES, ALL_ROLES } from "@/lib/constants";

const PAGE_SIZE = 25;

// GET /api/admin/users?role=&q=&status=&page= — directory with per-account
// activity, so an admin can see what a user actually does, not just who they are.
export async function GET(req) {
  const guard = requireAuth([ROLES.ADMIN]);
  if (guard.error) return guard.error;

  await connectDB();
  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role");
  const q = searchParams.get("q")?.trim();
  const status = searchParams.get("status");
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  const filter = {};
  if (role && ALL_ROLES.includes(role)) filter.role = role;
  if (status === "suspended") filter.isActive = false;
  if (status === "blacklisted") filter.isBlacklisted = true;
  if (status === "unverified") filter.isVerified = false;
  if (status === "kyc_pending") filter["kyc.status"] = "pending";
  if (q) {
    const rx = { $regex: escapeRegex(q), $options: "i" };
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }

  const [users, total, roleCounts] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).lean(),
    User.countDocuments(filter),
    User.aggregate([{ $group: { _id: "$role", n: { $sum: 1 } } }]),
  ]);

  // Activity counts for just this page of users, in two queries rather than
  // two per row.
  const ids = users.map((u) => u._id);
  const [listingAgg, unlockAgg] = await Promise.all([
    Listing.aggregate([{ $match: { owner: { $in: ids } } }, { $group: { _id: "$owner", n: { $sum: 1 } } }]),
    TokenUnlock.aggregate([{ $match: { user: { $in: ids } } }, { $group: { _id: "$user", n: { $sum: 1 } } }]),
  ]);
  const listingsBy = Object.fromEntries(listingAgg.map((r) => [r._id.toString(), r.n]));
  const unlocksBy = Object.fromEntries(unlockAgg.map((r) => [r._id.toString(), r.n]));

  return ok({
    users: users.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      phone: u.phone || null,
      role: u.role,
      isVerified: Boolean(u.isVerified),
      emailVerified: Boolean(u.emailVerifiedAt),
      phoneVerified: Boolean(u.phoneVerifiedAt),
      kycStatus: u.kyc?.status || "none",
      isActive: u.isActive !== false,
      isBlacklisted: Boolean(u.isBlacklisted),
      commissionDue: u.commissionDue || 0,
      penaltyBalance: u.penaltyBalance || 0,
      listings: listingsBy[u._id.toString()] || 0,
      unlocks: unlocksBy[u._id.toString()] || 0,
      createdAt: u.createdAt,
    })),
    total,
    page,
    pageSize: PAGE_SIZE,
    roleCounts: Object.fromEntries(roleCounts.map((r) => [r._id, r.n])),
  });
}

const patchSchema = z.object({
  userId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid user id"),
  role: z.enum(ALL_ROLES).optional(),
  isActive: z.boolean().optional(),
  isBlacklisted: z.boolean().optional(),
  reason: z.string().trim().max(300).optional(),
});

// PATCH /api/admin/users — change a role, or suspend / blacklist an account.
export async function PATCH(req) {
  const guard = requireAuth([ROLES.ADMIN]);
  if (guard.error) return guard.error;

  let body;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body");
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return fail("Validation failed", 422, { issues: parsed.error.flatten().fieldErrors });
  }
  const { userId, role, isActive, isBlacklisted, reason } = parsed.data;

  await connectDB();
  const user = await User.findById(userId);
  if (!user) return fail("User not found", 404);

  // An admin locking themselves out, or demoting the last admin, would leave
  // the platform unadministrable.
  if (user._id.toString() === guard.session.sub) {
    if (role && role !== ROLES.ADMIN) return fail("You cannot change your own role", 409);
    if (isActive === false || isBlacklisted === true) {
      return fail("You cannot suspend or blacklist your own account", 409);
    }
  }
  if (user.role === ROLES.ADMIN && role && role !== ROLES.ADMIN) {
    const admins = await User.countDocuments({ role: ROLES.ADMIN, isActive: { $ne: false } });
    if (admins <= 1) return fail("This is the last active admin — promote another first", 409);
  }

  const before = { role: user.role, isActive: user.isActive, isBlacklisted: user.isBlacklisted };
  if (role !== undefined) user.role = role;
  if (isActive !== undefined) user.isActive = isActive;
  if (isBlacklisted !== undefined) user.isBlacklisted = isBlacklisted;
  await user.save();

  await audit({
    actor: guard.session.sub,
    actorRole: guard.session.role,
    action: "admin.user_update",
    targetType: "User",
    targetId: user._id,
    meta: {
      before,
      after: { role: user.role, isActive: user.isActive, isBlacklisted: user.isBlacklisted },
      reason: reason || null,
    },
  });

  return ok({ user: user.toSafeJSON() });
}
