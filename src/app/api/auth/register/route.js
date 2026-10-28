import { z } from "zod";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { hashPassword, signToken, setAuthCookie, createSessionPayload } from "@/lib/auth";
import { ok, fail } from "@/lib/api";
import { enforceRateLimit } from "@/lib/rateLimit";
import { isValidRwandaPhone } from "@/lib/phone";
import { ROLES, PUBLIC_SIGNUP_ROLES } from "@/lib/constants";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email(),
  phone: z.string().trim().max(20).refine((value) => !value || isValidRwandaPhone(value), "Enter a valid Rwanda phone number, such as +250 7XX XXX XXX").optional(),
  password: z.string().min(8).regex(/[A-Z]/, "Password needs an uppercase letter").regex(/[a-z]/, "Password needs a lowercase letter").regex(/[0-9]/, "Password needs a number").regex(/[^A-Za-z0-9]/, "Password needs a special character"),
  passwordConfirm: z.string().min(1, "Confirm your password"),
  // Public signup is limited to owner/agent/buyer. admin/manager are seeded.
  role: z.enum(PUBLIC_SIGNUP_ROLES).default(ROLES.BUYER),
}).refine((data) => data.password === data.passwordConfirm, {
  message: "Passwords do not match",
  path: ["passwordConfirm"],
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
