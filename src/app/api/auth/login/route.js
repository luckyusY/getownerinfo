import { z } from "zod";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { verifyPassword, signToken, setAuthCookie, createSessionPayload } from "@/lib/auth";
import { ok, fail } from "@/lib/api";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body");
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return fail("Email and password are required", 422);
  }

  await connectDB();

  const user = await User.findOne({ email: parsed.data.email });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return fail("Invalid email or password", 401);
  }
  if (!user.isActive || user.isBlacklisted) {
    return fail("This account is disabled. Contact support.", 403);
  }

  const token = signToken(createSessionPayload(user));
  setAuthCookie(token);

  return ok({ user: user.toSafeJSON() });
}
