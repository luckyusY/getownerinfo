import { z } from "zod";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { verifyPassword, signToken, setAuthCookie, createSessionPayload } from "@/lib/auth";
import { ok, fail } from "@/lib/api";
import { enforceRateLimit, resetRateLimit } from "@/lib/rateLimit";

const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export async function POST(req) {
  // Coarse per-IP cap, generous because shared/NAT addresses are the norm here.
  // A blunt backstop against floods, NOT the brute-force defence -- the
  // per-account limit below is what protects an individual inbox.
  const limited = await enforceRateLimit(req, { name: "login", limit: 60, windowMs: 10 * 60 * 1000 });
  if (limited) return limited;

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

  // The real defence: per-account, so an attacker cannot spread attempts across
  // many IPs against one high-value inbox. Kept tight on purpose -- a genuine
  // user needs nowhere near 10 tries in 10 minutes.
  const accountKey = `rl:login:acct:${parsed.data.email}`;
  const perAccount = await enforceRateLimit(req, {
    name: "login:acct",
    limit: 10,
    windowMs: 10 * 60 * 1000,
    identifier: parsed.data.email,
  });
  if (perAccount) return perAccount;

  await connectDB();

  const user = await User.findOne({ email: parsed.data.email });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return fail("Invalid email or password", 401);
  }
  // Count failed attempts, not normal successful sign-ins, against the
  // per-account brute-force limit.
  await resetRateLimit(accountKey);
  if (!user.isActive || user.isBlacklisted) {
    return fail("This account is disabled. Contact support.", 403);
  }

  const token = signToken(createSessionPayload(user));
  setAuthCookie(token);

  return ok({ user: user.toSafeJSON() });
}
