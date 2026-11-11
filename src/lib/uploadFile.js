// Browser-side preparation of a file for POST /api/upload.
//
// Uploads travel as a base64 data URI inside a JSON body, and the host caps a
// request body at about 4.5MB. Base64 adds a third, so anything over ~3MB on
// disk was rejected by the platform before our route ever ran — with an HTML
// error page the form then failed to parse as JSON. A photo straight off a
// phone camera is routinely 4-8MB, so the people most likely to list a property
// from their phone were the ones who could not attach a picture of it.
//
// Photos are therefore scaled down and re-encoded here first. Nothing visible is
// lost: listing photos are displayed far smaller than a camera's native size.

// Largest data-URI length we will send, leaving headroom under the body cap for
// the rest of the JSON.
const MAX_DATA_URL_CHARS = 3_900_000;
// Files already this small go up untouched.
const SKIP_BELOW_BYTES = 900 * 1024;
const MAX_DIMENSION = 2000;

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("That file could not be read."));
    reader.readAsDataURL(file);
  });
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That image could not be opened."));
    };
    img.src = url;
  });
}

async function shrinkImage(file) {
  const img = await loadImage(file);
  let scale = Math.min(1, MAX_DIMENSION / Math.max(img.naturalWidth, img.naturalHeight));
  let quality = 0.85;

  // Step quality down, then size, until it fits. Bounded so it always ends.
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext("2d");
    // JPEG has no transparency; without this a transparent PNG turns black.
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    if (dataUrl.length <= MAX_DATA_URL_CHARS) return dataUrl;
    if (quality > 0.6) quality -= 0.1;
    else scale *= 0.75;
  }
  throw new Error("That photo is too large to upload. Try a smaller one.");
}

/**
 * Turn a chosen File into a data URI that /api/upload will accept.
 * Images are downscaled when needed; other files (PDF proof) pass through and
 * are refused with a clear message if they cannot fit.
 *
 * @param {File} file
 * @returns {Promise<string>}
 */
export async function fileToUploadDataUrl(file) {
  const isImage = ["image/jpeg", "image/png", "image/webp"].includes(file.type);

  if (isImage && file.size > SKIP_BELOW_BYTES) {
    return shrinkImage(file);
  }

  const dataUrl = await readAsDataUrl(file);
  if (dataUrl.length > MAX_DATA_URL_CHARS) {
    throw new Error(
      isImage
        ? "That photo is too large to upload. Try a smaller one."
        : "That file is too large. Documents must be under 2.5MB — try a photo of it instead."
    );
  }
  return dataUrl;
}

/** Shrink an image that is already a data URI (e.g. an uploaded selfie). */
export async function shrinkDataUrl(dataUrl) {
  if (dataUrl.length <= MAX_DATA_URL_CHARS) return dataUrl;
  const blob = await (await fetch(dataUrl)).blob();
  return shrinkImage(blob);
}
