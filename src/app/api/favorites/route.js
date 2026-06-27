import { connectDB } from "@/lib/db";
import Favorite from "@/models/Favorite";
import { getSession } from "@/lib/auth";
import { ok } from "@/lib/api";

// GET /api/favorites — the current user's favorited listing IDs (empty if guest).
export async function GET() {
  const session = getSession();
  if (!session) return ok({ ids: [] });

  await connectDB();
  const ids = await Favorite.find({ user: session.sub }).distinct("listing");
  return ok({ ids: ids.map((id) => id.toString()) });
}
