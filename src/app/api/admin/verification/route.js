import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { ok, requireAuth } from "@/lib/api";
import { ROLES } from "@/lib/constants";

// GET /api/admin/verification?status=pending — verification review queue.
export async function GET(req) {
  const guard = requireAuth([ROLES.ADMIN]);
  if (guard.error) return guard.error;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "pending";

  await connectDB();
  const users = await User.find({ "kyc.status": status })
    .select("+kyc.idNumber +kyc.idDocumentPublicId +kyc.fullName")
    .sort({ "kyc.submittedAt": 1 })
    .limit(100);

  return ok({
    requests: users.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      isVerified: u.isVerified,
      status: u.kyc?.status,
      submittedAt: u.kyc?.submittedAt,
      // Admin-only review payload.
      declaredName: u.kyc?.fullName,
      idNumber: u.kyc?.idNumber,
      idDocumentPublicId: u.kyc?.idDocumentPublicId,
    })),
  });
}
