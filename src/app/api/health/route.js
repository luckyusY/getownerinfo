import { connectDB } from "@/lib/db";
import { ok, fail } from "@/lib/api";

// Reads live data from the database on every request. Marked dynamic so a
// build never depends on reaching the database — a transient Atlas blip
// should not fail a deploy.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    return ok({ status: "healthy", db: "connected", time: new Date().toISOString() });
  } catch (err) {
    return fail(`Database unreachable: ${err.message}`, 503);
  }
}
