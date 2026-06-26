import { z } from "zod";
import { connectDB } from "@/lib/db";
import Penalty, { OFFENSE_TYPES } from "@/models/Penalty";
import User from "@/models/User";
import Listing from "@/models/Listing";
import { applyPenalty } from "@/lib/penaltyService";
import { ok, fail, requireAuth } from "@/lib/api";
import { ROLES } from "@/lib/constants";

const issueSchema = z
  .object({
    userId: z.string().optional(),
    userEmail: z.string().email().optional(),
    offenseType: z.enum(Object.values(OFFENSE_TYPES)),
    reason: z.string().min(3),
    expectedAmount: z.number().nonnegative().default(0),
    listingId: z.string().optional(),
    severe: z.boolean().default(false),
  })
  .refine((d) => d.userId || d.userEmail, { message: "userId or userEmail is required" });

// POST /api/admin/penalties — issue a penalty (admin, for confirmed abuse).
export async function POST(req) {
  const guard = requireAuth([ROLES.ADMIN]);
  if (guard.error) return guard.error;

  let body;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body");
  }
  const parsed = issueSchema.safeParse(body);
  if (!parsed.success) return fail("Validation failed", 422, { issues: parsed.error.flatten().fieldErrors });

  await connectDB();
  const offender = parsed.data.userId
    ? await User.findById(parsed.data.userId)
    : await User.findOne({ email: parsed.data.userEmail });
  if (!offender) return fail("User not found", 404);

  const penalty = await applyPenalty({
    userId: offender._id,
    offenseType: parsed.data.offenseType,
    reason: parsed.data.reason,
    expectedAmount: parsed.data.expectedAmount,
    listingId: parsed.data.listingId || null,
    issuedBy: guard.session.sub,
    severe: parsed.data.severe,
  });

  return ok({ penalty: { id: penalty._id.toString(), total: penalty.total } }, 201);
}

// GET /api/admin/penalties — all penalties + outstanding summary (admin).
export async function GET(req) {
  const guard = requireAuth([ROLES.ADMIN]);
  if (guard.error) return guard.error;

  await connectDB();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const query = status ? { status } : {};

  const penalties = await Penalty.find(query)
    .sort({ createdAt: -1 })
    .populate({ path: "user", model: User, select: "name email" })
    .populate({ path: "listing", model: Listing, select: "title" });

  const summary = penalties.reduce(
    (acc, p) => {
      acc.total += p.total;
      if (p.status === "active") acc.outstanding += p.total;
      return acc;
    },
    { total: 0, outstanding: 0 }
  );

  return ok({
    summary,
    penalties: penalties.map((p) => ({
      id: p._id.toString(),
      userName: p.user?.name,
      userEmail: p.user?.email,
      listingTitle: p.listing?.title || null,
      offenseType: p.offenseType,
      reason: p.reason,
      total: p.total,
      status: p.status,
      createdAt: p.createdAt,
    })),
  });
}
