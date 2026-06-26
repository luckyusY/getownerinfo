import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { getSession } from "@/lib/auth";
import { ok, fail } from "@/lib/api";

export async function GET() {
  const session = getSession();
  if (!session) return fail("Not authenticated", 401);

  await connectDB();
  const user = await User.findById(session.sub);
  if (!user) return fail("User not found", 404);

  return ok({ user: user.toSafeJSON() });
}
