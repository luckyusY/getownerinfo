import crypto from "crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { ROLES } from "@/lib/constants";

const STATE_COOKIE = "goi_google_oauth_state";
const ROLE_COOKIE = "goi_google_oauth_role";

function getRequestOrigin(req) {
  const url = new URL(req.url);
  const proto = req.headers.get("x-forwarded-proto") || url.protocol.replace(":", "");
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || url.host;
  return `${proto}://${host}`;
}

export async function GET(req) {
  const origin = getRequestOrigin(req);

  if (!env.google.clientId || !env.google.clientSecret) {
    const url = new URL("/login", origin);
    url.searchParams.set("error", "Google login is not configured yet.");
    return NextResponse.redirect(url);
  }

  const requestUrl = new URL(req.url);
  const role = requestUrl.searchParams.get("role");
  const safeRole = role === ROLES.OWNER ? ROLES.OWNER : ROLES.BUYER;
  const state = crypto.randomBytes(24).toString("hex");
  const redirectUri = new URL("/api/auth/google/callback", origin).toString();

  cookies().set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });
  cookies().set(ROLE_COOKIE, safeRole, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });

  const googleUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleUrl.searchParams.set("client_id", env.google.clientId);
  googleUrl.searchParams.set("redirect_uri", redirectUri);
  googleUrl.searchParams.set("response_type", "code");
  googleUrl.searchParams.set("scope", "openid email profile");
  googleUrl.searchParams.set("state", state);
  googleUrl.searchParams.set("prompt", "select_account");

  return NextResponse.redirect(googleUrl);
}
