import { NextResponse } from "next/server";
import { getSession } from "./auth.js";

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
 * Guard a route handler. Returns { session } on success, or a NextResponse to
 * return directly on failure.
 * @param {string[]} roles - allowed roles; empty = any authenticated user
 */
export function requireAuth(roles = []) {
  const session = getSession();
  if (!session) {
    return { error: fail("Authentication required", 401) };
  }
  if (roles.length && !roles.includes(session.role)) {
    return { error: fail("Forbidden: insufficient permissions", 403) };
  }
  return { session };
}
