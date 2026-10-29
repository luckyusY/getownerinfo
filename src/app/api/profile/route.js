import { z } from "zod";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { ok, fail, requireAuth } from "@/lib/api";
import { ALL_ROLES } from "@/lib/constants";
import { optionalRwandaPhone } from "@/lib/phone";

const prefsSchema = z
  .object({
    listings: z.boolean().optional(),
    payments: z.boolean().optional(),
    messages: z.boolean().optional(),
    account: z.boolean().optional(),
  })
  .optional();

const patchSchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    // An empty phone is allowed so a user can remove an existing number.
    phone: z.string().trim().max(20).refine(optionalRwandaPhone, "Enter a valid Rwanda phone number, such as +250 7XX XXX XXX").optional(),
    emailNotifications: prefsSchema,
  })
  .refine(
    (value) => value.name !== undefined || value.phone !== undefined || value.emailNotifications !== undefined,
    { message: "Provide a name, phone number or notification preference to update" }
  );

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
    emailNotifications: {
      listings: user.notificationPrefs?.email?.listings !== false,
      payments: user.notificationPrefs?.email?.payments !== false,
      messages: user.notificationPrefs?.email?.messages !== false,
      account: user.notificationPrefs?.email?.account !== false,
    },
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

  if (parsed.data.name !== undefined) user.name = parsed.data.name;
  if (parsed.data.phone !== undefined) user.phone = parsed.data.phone;
  if (parsed.data.emailNotifications) {
    user.notificationPrefs = user.notificationPrefs || {};
    user.notificationPrefs.email = {
      ...(user.notificationPrefs.email?.toObject?.() || user.notificationPrefs.email || {}),
      ...parsed.data.emailNotifications,
    };
  }
  await user.save();

  return ok({
    name: user.name,
    phone: user.phone || "",
    emailNotifications: {
      listings: user.notificationPrefs?.email?.listings !== false,
      payments: user.notificationPrefs?.email?.payments !== false,
      messages: user.notificationPrefs?.email?.messages !== false,
      account: user.notificationPrefs?.email?.account !== false,
    },
  });
}
