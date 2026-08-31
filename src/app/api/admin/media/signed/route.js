import { signedPrivateUrl } from "@/lib/cloudinary";
import { ok, fail, requireAuth } from "@/lib/api";
import { audit } from "@/models/AuditLog";
import { connectDB } from "@/lib/db";
import { ROLES } from "@/lib/constants";

// GET /api/admin/media/signed?publicId=...&resourceType=image
//
// Trades a private asset identifier for a short-lived signed Cloudinary URL.
// This is the ONLY path to an identity document or ownership-proof file, and it
// is admin/manager-gated and audited — viewing someone's national ID should
// leave a trail.
export async function GET(req) {
  const guard = requireAuth([ROLES.ADMIN, ROLES.MANAGER]);
  if (guard.error) return guard.error;

  const { searchParams } = new URL(req.url);
  const publicId = searchParams.get("publicId");
  const resourceType = searchParams.get("resourceType") || "image";
  if (!publicId) return fail("publicId is required", 422);

  // Only ever sign assets from our own private folders — never an arbitrary id.
  if (!/^getownerinfo\/(ownership-proof|identity)\//.test(publicId)) {
    return fail("Not a private asset", 403);
  }
  if (!["image", "raw", "video"].includes(resourceType)) {
    return fail("Invalid resourceType", 422);
  }

  await connectDB();
  await audit({
    actor: guard.session.sub,
    actorRole: guard.session.role,
    action: "media.view_private",
    targetType: "Media",
    meta: { publicId },
  });

  return ok({ url: signedPrivateUrl(publicId, { resourceType, expiresInSeconds: 300 }) });
}
