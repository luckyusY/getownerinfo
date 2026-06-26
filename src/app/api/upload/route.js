import { z } from "zod";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { ok, fail, requireAuth } from "@/lib/api";
import { ROLES } from "@/lib/constants";

const schema = z.object({
  // data URI (e.g. "data:image/jpeg;base64,....")
  file: z.string().startsWith("data:"),
  kind: z.enum(["image", "proof"]).default("image"),
});

// POST /api/upload — upload a single file to Cloudinary. Owners/managers/admin.
export async function POST(req) {
  const guard = requireAuth([ROLES.OWNER, ROLES.MANAGER, ROLES.ADMIN]);
  if (guard.error) return guard.error;

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

  // Ownership proof goes to a private-ish folder; images to a public folder.
  const folder =
    parsed.data.kind === "proof"
      ? "getownerinfo/ownership-proof"
      : "getownerinfo/listings";

  try {
    const res = await uploadToCloudinary(parsed.data.file, { folder });
    return ok({ url: res.secure_url, publicId: res.public_id });
  } catch (err) {
    return fail(`Upload failed: ${err.message}`, 502);
  }
}

// Allow larger payloads for base64 images.
export const maxDuration = 30;
