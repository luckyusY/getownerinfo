import { z } from "zod";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { audit } from "@/models/AuditLog";
import { ok, fail, requireAuth } from "@/lib/api";
import { enforceRateLimit } from "@/lib/rateLimit";
import { ROLES, SELLER_ROLES } from "@/lib/constants";

const submitSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  idNumber: z.string().min(6).max(32),
  docType: z.enum(["national_id", "passport", "driving_licence"]),
  idDocument: z.object({
    publicId: z.string().min(1),
    resourceType: z.string().optional().default("image"),
  }),
});

const SUBMITTERS = [...SELLER_ROLES, ROLES.MANAGER];

// GET /api/verification — the caller's own verification status.
// Deliberately returns status only: never the ID number or document.
export async function GET() {
  const guard = requireAuth();
  if (guard.error) return guard.error;

  await connectDB();
  const user = await User.findById(guard.session.sub).select("isVerified kyc.status kyc.submittedAt kyc.reviewedAt kyc.rejectionReason");
  if (!user) return fail("User not found", 404);

  return ok({
    isVerified: user.isVerified,
    status: user.kyc?.status || "none",
    submittedAt: user.kyc?.submittedAt || null,
    reviewedAt: user.kyc?.reviewedAt || null,
    rejectionReason: user.kyc?.rejectionReason || null,
  });
}

// POST /api/verification — submit (or re-submit) identity documents for review.
export async function POST(req) {
  const guard = requireAuth(SUBMITTERS);
  if (guard.error) return guard.error;

  const limited = await enforceRateLimit(req, {
    name: "verification",
    limit: 5,
    windowMs: 60 * 60 * 1000,
    identifier: guard.session.sub,
  });
  if (limited) return limited;

  let body;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body");
  }
  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return fail("Validation failed", 422, { issues: parsed.error.flatten().fieldErrors });
  }

  // The document must be one of our own private identity uploads.
  if (!parsed.data.idDocument.publicId.startsWith("getownerinfo/identity/")) {
    return fail("Identity document must be uploaded via /api/upload with kind=identity", 422);
  }

  await connectDB();
  const user = await User.findById(guard.session.sub).select("+kyc.idNumber +kyc.idDocumentUrl +kyc.idDocumentPublicId +kyc.fullName");
  if (!user) return fail("User not found", 404);

  if (user.kyc?.status === "approved") {
    return fail("Your account is already verified", 409);
  }
  if (user.kyc?.status === "pending") {
    return fail("A verification request is already under review", 409);
  }

  user.kyc = {
    ...(user.kyc?.toObject?.() || user.kyc || {}),
    fullName: parsed.data.fullName,
    idNumber: parsed.data.idNumber,
    docType: parsed.data.docType,
    idDocumentPublicId: parsed.data.idDocument.publicId,
    idDocumentUrl: "", // never store a public URL for an identity document
    status: "pending",
    submittedAt: new Date(),
    reviewedAt: null,
    reviewedBy: null,
    rejectionReason: null,
  };
  await user.save();

  await audit({
    actor: user._id,
    actorRole: guard.session.role,
    action: "verification.submit",
    targetType: "User",
    targetId: user._id,
    // Never log the ID number itself.
    meta: { hasDocument: true, docType: parsed.data.docType },
  });

  return ok({ status: "pending" }, 201);
}
