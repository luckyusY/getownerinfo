import { z } from "zod";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { audit } from "@/models/AuditLog";
import { notifyUser } from "@/models/Notification";
import { ok, fail, requireAuth } from "@/lib/api";
import { ROLES } from "@/lib/constants";

const schema = z.object({
  action: z.enum(["approve", "reject"]),
  reason: z.string().optional(),
});

// POST /api/admin/verification/:id — approve or reject an identity submission.
export async function POST(req, { params }) {
  const guard = requireAuth([ROLES.ADMIN]);
  if (guard.error) return guard.error;

  let body;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body");
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail("action must be approve or reject", 422);
  const { action, reason } = parsed.data;

  await connectDB();
  const user = await User.findById(params.id);
  if (!user) return fail("User not found", 404);
  if (user.kyc?.status !== "pending") {
    return fail("No pending verification for this user", 409);
  }

  const approved = action === "approve";
  user.kyc.status = approved ? "approved" : "rejected";
  user.kyc.reviewedAt = new Date();
  user.kyc.reviewedBy = guard.session.sub;
  user.kyc.rejectionReason = approved ? null : reason || "Documents could not be verified";
  user.isVerified = approved;
  await user.save();

  await audit({
    actor: guard.session.sub,
    actorRole: guard.session.role,
    action: approved ? "verification.approve" : "verification.reject",
    targetType: "User",
    targetId: user._id,
    meta: approved ? {} : { reason: user.kyc.rejectionReason },
  });

  await notifyUser({
    user: user._id,
    type: approved ? "verification_approved" : "verification_rejected",
    title: approved ? "You're verified" : "Verification needs attention",
    body: approved
      ? "Your identity has been verified. Your listings now show a verified badge."
      : user.kyc.rejectionReason,
    link: "/dashboard/owner",
  });

  return ok({ status: user.kyc.status, isVerified: user.isVerified });
}
