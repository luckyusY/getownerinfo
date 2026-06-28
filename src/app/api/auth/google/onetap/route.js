import crypto from "crypto";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { env } from "@/lib/env";
import { hashPassword, signToken, setAuthCookie } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import User from "@/models/User";

const OneTapSchema = z.object({
  credential: z.string().min(20),
  role: z.enum([ROLES.BUYER, ROLES.OWNER]).optional(),
});

export async function POST(req) {
  if (!env.google.clientId) {
    return fail("Google login is not configured yet.", 503);
  }

  const parsed = OneTapSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return fail("Invalid Google sign-in response.", 400);
  }

  const tokenInfoRes = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(parsed.data.credential)}`,
    { cache: "no-store" }
  );
  if (!tokenInfoRes.ok) {
    return fail("Google sign-in could not be verified. Please try again.", 401);
  }

  const profile = await tokenInfoRes.json();
  if (
    profile.aud !== env.google.clientId ||
    !profile.email ||
    (profile.email_verified !== true && profile.email_verified !== "true")
  ) {
    return fail("Please use a verified Google email address.", 401);
  }

  await connectDB();
  const email = String(profile.email).toLowerCase();
  const role = parsed.data.role === ROLES.OWNER ? ROLES.OWNER : ROLES.BUYER;
  let user = await User.findOne({ email });

  if (user) {
    user.googleId = user.googleId || profile.sub;
    user.avatarUrl = user.avatarUrl || profile.picture;
    user.authProviders = Array.from(new Set([...(user.authProviders || ["password"]), "google"]));
    await user.save();
  } else {
    user = await User.create({
      name: profile.name || email.split("@")[0],
      email,
      role,
      googleId: profile.sub,
      avatarUrl: profile.picture,
      authProviders: ["google"],
      passwordHash: await hashPassword(`google:${crypto.randomUUID()}`),
    });
  }

  if (!user.isActive || user.isBlacklisted) {
    return fail("This account is disabled. Contact support.", 403);
  }

  setAuthCookie(signToken({ sub: user._id.toString(), role: user.role }));
  return ok({ user: user.toSafeJSON() });
}
