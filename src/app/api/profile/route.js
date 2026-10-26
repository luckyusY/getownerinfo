import { z } from "zod";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { ok, fail, requireAuth } from "@/lib/api";
import { ALL_ROLES } from "@/lib/constants";

const patchSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  phone: z.string().min(6).max(20).optional(),
});

// GET /api/profile — return the caller's own profile (safe fields only)
export async function GET() {
  const guard = requireAuth(ALL_ROLES);
  if (guard.error) return guard.error;

  await connectDB();
  const user = await User.findById(guard.session.sub).lean();
  if (!user) return fail("User not found", 404);

  return ok({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    avatarUrl: user.avatarUrl || "",
    role: user.role,
    isVerified: user.isVerified,
    kycStatus: user.kyc?.status || "none",
    penaltyBalance: user.penaltyBalance || 0,
    commissionDue: user.commissionDue || 0,
    createdAt: user.createdAt,
  });
}

// PATCH /api/profile — update name and/or phone
export async function PATCH(req) {
  const guard = requireAuth(ALL_ROLES);
  if (guard.error) return guard.error;

  let body;
  try { body = await req.json(); } catch { return fail("Invalid JSON body"); }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return fail("Validation failed", 422, { issues: parsed.error.flatten().fieldErrors });

  await connectDB();
  const user = await User.findById(guard.session.sub);
  if (!user) return fail("User not found", 404);

  if (parsed.data.name) user.name = parsed.data.name.trim();
  if (parsed.data.phone !== undefined) user.phone = parsed.data.phone.trim();
  await user.save();

  return ok({ name: user.name, phone: user.phone || "" });
}
