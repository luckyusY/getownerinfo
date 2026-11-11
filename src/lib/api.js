import { NextResponse } from "next/server";
import { getSession } from "./auth.js";
import { connectDB } from "./db.js";
import User from "@/models/User";

export function ok(data, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function fail(message, status = 400, extra = {}) {
  return NextResponse.json(
    { success: false, error: message, ...extra },
    { status }
  );
}

/**
 * The caller's session, checked against the account as it is NOW.
 *
 * The cookie is a 7-day JWT that carries the role it was signed with. Trusting
 * it alone meant a blacklisted or suspended account kept working until the
 * token expired, and a demoted admin kept admin powers for up to a week. One
 * indexed lookup per request closes both: a disabled or deleted account has no
 * session, and the role is always the one in the database.
 *
 * @returns {Promise<null | (object & { role: string })>}
 */
export async function getLiveSession() {
  const session = getSession();
  if (!session?.sub) return null;

  await connectDB();
  const user = await User.findById(session.sub).select("role isActive isBlacklisted").lean();
  if (!user || user.isActive === false || user.isBlacklisted) return null;

  return { ...session, role: user.role };
}

/**
 * Guard a route handler. Returns { session } on success, or a NextResponse to
 * return directly on failure.
 * @param {string[]} roles - allowed roles; empty = any authenticated user
 */
export async function requireAuth(roles = []) {
  const session = await getLiveSession();
  if (!session) {
    return { error: fail("Authentication required", 401) };
  }
  if (roles.length && !roles.includes(session.role)) {
    return { error: fail("Forbidden: insufficient permissions", 403) };
  }
  return { session };
}
