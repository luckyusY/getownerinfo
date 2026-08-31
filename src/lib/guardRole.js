import { redirect } from "next/navigation";
import { getSession } from "./auth.js";
import { ROLES } from "./constants.js";

/**
 * Server-component guard: redirect to the user's own dashboard if the role
 * doesn't match.
 *
 * @param {string|string[]} required - one role, or any-of.
 * Admins pass every guard: bouncing an admin out of a page they are meant to
 * be able to inspect is never the useful behaviour.
 */
export function guardRole(required) {
  const session = getSession();
  if (!session) redirect("/login");
  const allowed = Array.isArray(required) ? required : [required];
  if (session.role !== ROLES.ADMIN && !allowed.includes(session.role)) {
    redirect("/dashboard");
  }
  return session;
}
