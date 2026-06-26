import { connectDB } from "@/lib/db";
import { ok, fail } from "@/lib/api";

export async function GET() {
  try {
    await connectDB();
    return ok({ status: "healthy", db: "connected", time: new Date().toISOString() });
  } catch (err) {
    return fail(`Database unreachable: ${err.message}`, 503);
  }
}
