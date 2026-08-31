import { z } from "zod";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { ok, fail, requireAuth } from "@/lib/api";
import { enforceRateLimit } from "@/lib/rateLimit";
import { ROLES, SELLER_ROLES } from "@/lib/constants";

const MAX_BYTES = 10 * 1024 * 1024; // 10MB
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
// Ownership proof is frequently a scanned PDF.
const PROOF_TYPES = [...IMAGE_TYPES, "application/pdf"];

const schema = z.object({
  // data URI (e.g. "data:image/jpeg;base64,....")
  file: z.string().startsWith("data:"),
  kind: z.enum(["image", "proof", "identity"]).default("image"),
});

/** Pull the MIME type and decoded byte length out of a base64 data URI. */
function inspectDataUri(uri) {
  const match = /^data:([a-zA-Z0-9!#$&^_.+-]+\/[a-zA-Z0-9!#$&^_.+-]+);base64,(.*)$/s.exec(uri);
  if (!match) return null;
  const [, mime, b64] = match;
  // 4 base64 chars -> 3 bytes, minus padding.
  const padding = (b64.endsWith("==") && 2) || (b64.endsWith("=") && 1) || 0;
  return { mime, bytes: Math.floor((b64.length * 3) / 4) - padding };
}

// POST /api/upload — upload a single file to Cloudinary. Owners/managers/admin.
export async function POST(req) {
  const guard = requireAuth([...SELLER_ROLES, ROLES.MANAGER, ROLES.ADMIN]);
  if (guard.error) return guard.error;

  const limited = await enforceRateLimit(req, {
    name: "upload",
    limit: 40,
    windowMs: 10 * 60 * 1000,
    identifier: guard.session.sub,
  });
  if (limited) return limited;

  let body;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body");
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return fail("A valid data-URI 'file' is required", 422);
  }

  // Never hand an unvalidated blob to Cloudinary: `resource_type: "auto"` will
  // happily accept whatever it is given.
  const info = inspectDataUri(parsed.data.file);
  if (!info) return fail("File must be a base64 data URI", 422);
  const isPrivate = parsed.data.kind === "proof" || parsed.data.kind === "identity";
  const allowed = isPrivate ? PROOF_TYPES : IMAGE_TYPES;
  if (!allowed.includes(info.mime)) {
    return fail(`Unsupported file type "${info.mime}". Allowed: ${allowed.join(", ")}`, 415);
  }
  if (info.bytes > MAX_BYTES) {
    return fail(`File is too large (${Math.round(info.bytes / 1024 / 1024)}MB). Maximum is 10MB.`, 413);
  }

  // Ownership proof and identity documents are uploaded as "authenticated"
  // assets — their URLs are not publicly fetchable, so leaking a link does not
  // leak the document. Listing photos stay public.
  const folder =
    parsed.data.kind === "proof"
      ? "getownerinfo/ownership-proof"
      : parsed.data.kind === "identity"
        ? "getownerinfo/identity"
        : "getownerinfo/listings";

  try {
    const res = await uploadToCloudinary(parsed.data.file, {
      folder,
      type: isPrivate ? "authenticated" : "upload",
    });
    return ok({
      // For private assets the raw URL is useless without a signature; the
      // publicId is what admin review resolves through signedPrivateUrl().
      url: isPrivate ? "" : res.secure_url,
      publicId: res.public_id,
      resourceType: res.resource_type,
      private: isPrivate,
    });
  } catch (err) {
    return fail(`Upload failed: ${err.message}`, 502);
  }
}

// Allow larger payloads for base64 images.
export const maxDuration = 30;
