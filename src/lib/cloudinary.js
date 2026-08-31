import { v2 as cloudinary } from "cloudinary";
import { env } from "./env.js";

cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret,
  secure: true,
});

/**
 * Upload a file buffer / data URI to Cloudinary.
 * @param {string} file - data URI or remote URL
 * @param {object} opts - { folder, resourceType, type }
 *   type: "upload" (public, default) or "authenticated" (requires a signed URL).
 *   Identity documents and ownership proof MUST use "authenticated" — a folder
 *   name is not an access control.
 */
export async function uploadToCloudinary(file, opts = {}) {
  return cloudinary.uploader.upload(file, {
    folder: opts.folder || "getownerinfo",
    resource_type: opts.resourceType || "auto",
    type: opts.type || "upload",
  });
}

/**
 * Mint a short-lived signed URL for a private (authenticated) asset. Only ever
 * call this from an admin-guarded route.
 * @param {string} publicId
 * @param {object} opts - { resourceType, expiresInSeconds }
 */
export function signedPrivateUrl(publicId, opts = {}) {
  const expiresAt = Math.floor(Date.now() / 1000) + (opts.expiresInSeconds || 300);
  return cloudinary.url(publicId, {
    type: "authenticated",
    resource_type: opts.resourceType || "image",
    sign_url: true,
    secure: true,
    expires_at: expiresAt,
  });
}

export async function deleteFromCloudinary(publicId, resourceType = "image") {
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

export { cloudinary };
