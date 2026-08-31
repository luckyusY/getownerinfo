import { z } from "zod";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { hashPassword, signToken, setAuthCookie, createSessionPayload } from "@/lib/auth";
import { ok, fail } from "@/lib/api";
import { enforceRateLimit } from "@/lib/rateLimit";
import { ROLES, PUBLIC_SIGNUP_ROLES } from "@/lib/constants";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7).optional(),
  password: z.string().min(8),
  // Public signup is limited to owner/agent/buyer. admin/manager are seeded.
  role: z.enum(PUBLIC_SIGNUP_ROLES).default(ROLES.BUYER),
});

export async function POST(req) {
  // Keyed by IP. Rwanda has heavy carrier-grade NAT -- a whole mobile network
  // or an office shares one address -- so this has to stay well above what a
  // legitimate burst of signups looks like. Scripted abuse is still capped.
  const limited = await enforceRateLimit(req, { name: "register", limit: 30, windowMs: 60 * 60 * 1000 });
  if (limited) return limited;

  let body;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body");
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return fail("Validation failed", 422, {
      issues: parsed.error.flatten().fieldErrors,
    });
  }

  await connectDB();

  const { name, email, phone, password, role } = parsed.data;
  const existing = await User.findOne({ email });
  if (existing) {
    return fail("An account with this email already exists", 409);
  }

  const user = await User.create({
    name,
    email,
    phone,
    role,
    passwordHash: await hashPassword(password),
  });

  const token = signToken(createSessionPayload(user));
  setAuthCookie(token);

  return ok({ user: user.toSafeJSON() }, 201);
}
