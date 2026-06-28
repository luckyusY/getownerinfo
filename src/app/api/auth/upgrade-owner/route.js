import { connectDB } from "@/lib/db";
import { ok, fail, requireAuth } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { createSessionPayload, setAuthCookie, signToken } from "@/lib/auth";
import User from "@/models/User";

export async function POST() {
  const guard = requireAuth();
  if (guard.error) return guard.error;

  if (guard.session.role !== ROLES.BUYER) {
    return fail("Only buyer accounts can switch to selling from this flow.", 409);
  }

  await connectDB();
  const user = await User.findById(guard.session.sub);
  if (!user) return fail("User not found", 404);
  if (!user.isActive || user.isBlacklisted) return fail("This account is disabled. Contact support.", 403);

  user.role = ROLES.OWNER;
  await user.save();

  setAuthCookie(signToken(createSessionPayload(user)));
  return ok({ user: user.toSafeJSON() });
}
