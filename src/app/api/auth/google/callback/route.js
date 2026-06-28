import crypto from "crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import { env } from "@/lib/env";
import { hashPassword, signToken, setAuthCookie, createSessionPayload } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import User from "@/models/User";

const STATE_COOKIE = "goi_google_oauth_state";
const ROLE_COOKIE = "goi_google_oauth_role";

function getRequestOrigin(req) {
  const url = new URL(req.url);
  const proto = req.headers.get("x-forwarded-proto") || url.protocol.replace(":", "");
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || url.host;
  return `${proto}://${host}`;
}

function redirectWithError(message, origin) {
  const url = new URL("/login", origin);
  url.searchParams.set("error", message);
  return NextResponse.redirect(url);
}

export async function GET(req) {
  const origin = getRequestOrigin(req);

  if (!env.google.clientId || !env.google.clientSecret) {
    return redirectWithError("Google login is not configured yet.", origin);
  }

  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const storedState = cookies().get(STATE_COOKIE)?.value;
  const requestedRole = cookies().get(ROLE_COOKIE)?.value;
  cookies().delete(STATE_COOKIE);
  cookies().delete(ROLE_COOKIE);

  if (!code || !state || !storedState || state !== storedState) {
    return redirectWithError("Google sign-in could not be verified. Please try again.", origin);
  }

  const redirectUri = new URL("/api/auth/google/callback", origin).toString();
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.google.clientId,
      client_secret: env.google.clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    return redirectWithError("Google sign-in failed while exchanging the authorization code.", origin);
  }

  const tokens = await tokenRes.json();
  const profileRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!profileRes.ok) {
    return redirectWithError("Google sign-in failed while reading your profile.", origin);
  }

  const profile = await profileRes.json();
  if (!profile.email || profile.email_verified === false) {
    return redirectWithError("Please use a verified Google email address.", origin);
  }

  await connectDB();
  const email = String(profile.email).toLowerCase();
  const role = requestedRole === ROLES.OWNER ? ROLES.OWNER : ROLES.BUYER;
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
    return redirectWithError("This account is disabled. Contact support.", origin);
  }

  setAuthCookie(signToken(createSessionPayload(user)));
  return NextResponse.redirect(new URL("/dashboard", origin));
}
