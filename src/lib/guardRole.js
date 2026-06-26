import { redirect } from "next/navigation";
import { getSession } from "./auth.js";

/** Server-component guard: redirect to the user's own dashboard if role mismatches. */
export function guardRole(requiredRole) {
  const session = getSession();
  if (!session) redirect("/login");
  if (session.role !== requiredRole) redirect("/dashboard");
  return session;
}
