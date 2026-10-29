import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { ok, requireAuth } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { describeFaceMatch } from "@/lib/faceMatch";

// GET /api/admin/verification?status=pending — verification review queue.
export async function GET(req) {
  const guard = requireAuth([ROLES.ADMIN]);
  if (guard.error) return guard.error;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "pending";

  await connectDB();
  const users = await User.find({ "kyc.status": status })
    .select(
      "+kyc.idNumber +kyc.idDocumentPublicId +kyc.fullName +kyc.docType " +
        "+kyc.selfiePublicId +kyc.selfieCapturedAt +kyc.selfieSource +kyc.rdbNumber " +
        "+kyc.faceMatch.status +kyc.faceMatch.score +kyc.faceMatch.provider +kyc.faceMatch.checkedAt"
    )
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
      docType: u.kyc?.docType,
      idDocumentPublicId: u.kyc?.idDocumentPublicId,
      // Face check (spec Part 13): both images and the comparison verdict.
      selfiePublicId: u.kyc?.selfiePublicId || null,
      selfieCapturedAt: u.kyc?.selfieCapturedAt || null,
      selfieSource: u.kyc?.selfieSource || null,
      rdbNumber: u.kyc?.rdbNumber || null,
      faceMatch: {
        status: u.kyc?.faceMatch?.status || "not_configured",
        score: u.kyc?.faceMatch?.score ?? null,
        provider: u.kyc?.faceMatch?.provider || null,
        checkedAt: u.kyc?.faceMatch?.checkedAt || null,
        ...describeFaceMatch(u.kyc?.faceMatch),
      },
    })),
  });
}
