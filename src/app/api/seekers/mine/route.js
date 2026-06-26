import { connectDB } from "@/lib/db";
import SeekerRequest from "@/models/SeekerRequest";
import { ok, requireAuth } from "@/lib/api";
import { ROLES } from "@/lib/constants";

// GET /api/seekers/mine — the current buyer's own seeker requests (with contact).
export async function GET() {
  const guard = requireAuth([ROLES.BUYER, ROLES.ADMIN]);
  if (guard.error) return guard.error;

  await connectDB();
  const requests = await SeekerRequest.find({ seeker: guard.session.sub }).sort({ createdAt: -1 });

  return ok({
    requests: requests.map((r) => ({
      ...r.toPublicJSON(),
      contactLocked: false,
      contact: r.contact,
      unlockCount: r.unlockCount,
    })),
  });
}
