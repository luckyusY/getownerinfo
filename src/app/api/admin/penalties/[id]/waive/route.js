import { connectDB } from "@/lib/db";
import Penalty from "@/models/Penalty";
import User from "@/models/User";
import { audit } from "@/models/AuditLog";
import { ok, fail, requireAuth } from "@/lib/api";
import { ROLES } from "@/lib/constants";

// POST /api/admin/penalties/:id/waive — admin waives an active penalty.
export async function POST(_req, { params }) {
  const guard = requireAuth([ROLES.ADMIN]);
  if (guard.error) return guard.error;

  await connectDB();
  const penalty = await Penalty.findById(params.id);
  if (!penalty) return fail("Penalty not found", 404);
  if (penalty.status !== "active") return fail(`Penalty is '${penalty.status}'`, 409);

  penalty.status = "waived";
  penalty.waivedAt = new Date();
  await penalty.save();

  const user = await User.findById(penalty.user);
  user.penaltyBalance = Math.max(0, (user.penaltyBalance || 0) - penalty.total);
  await user.save();

  await audit({
    actor: guard.session.sub,
    actorRole: guard.session.role,
    action: "penalty.waive",
    targetType: "Penalty",
    targetId: penalty._id,
    meta: { total: penalty.total },
  });

  return ok({ waived: true, penaltyBalance: user.penaltyBalance });
}
