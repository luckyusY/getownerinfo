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
 * @param {object} opts - { folder, resourceType }
 */
export async function uploadToCloudinary(file, opts = {}) {
  return cloudinary.uploader.upload(file, {
    folder: opts.folder || "getownerinfo",
    resource_type: opts.resourceType || "auto",
  });
}

export async function deleteFromCloudinary(publicId, resourceType = "image") {
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

export { cloudinary };
