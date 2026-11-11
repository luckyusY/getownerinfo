import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { env } from "@/lib/env";
import {
  getSession,
  signToken,
  setAuthCookie,
  clearAuthCookie,
  createSessionPayload,
} from "@/lib/auth";

// GET /api/auth/refresh — bring the session cookie back in line with the account.
//
// The dashboard layout sends the browser here when the cookie no longer matches
// the database: the role was changed by an admin, or the account was suspended
// or blacklisted. A server component cannot write cookies, so this route does
// it: a live account gets a freshly signed cookie and goes back to the
// dashboard; a disabled or deleted one is signed out.
export const dynamic = "force-dynamic";

export async function GET() {
  const session = getSession();
  const login = new URL("/login", env.appUrl);
  if (!session?.sub) return NextResponse.redirect(login);

  await connectDB();
  const user = await User.findById(session.sub);
  if (!user || !user.isActive || user.isBlacklisted) {
    clearAuthCookie();
    login.searchParams.set("error", "This account is disabled. Contact support.");
    return NextResponse.redirect(login);
  }

  setAuthCookie(signToken(createSessionPayload(user)));
  return NextResponse.redirect(new URL("/dashboard", env.appUrl));
}
