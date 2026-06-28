export function cloudinaryImage(url, options = {}) {
  if (!url || typeof url !== "string" || !url.includes("res.cloudinary.com") || !url.includes("/upload/")) {
    return url;
  }

  const parts = ["f_auto", "q_auto"];
  if (options.width) parts.push(`w_${options.width}`);
  if (options.height) parts.push(`h_${options.height}`);
  if (options.crop) parts.push(`c_${options.crop}`);
  if (options.gravity) parts.push(`g_${options.gravity}`);

  return url.replace("/upload/", `/upload/${parts.join(",")}/`);
}

export function cardImage(url) {
  return cloudinaryImage(url, { width: 720, height: 540, crop: "fill", gravity: "auto" });
}

export function heroImage(url) {
  return cloudinaryImage(url, { width: 1200, height: 760, crop: "fill", gravity: "auto" });
}

export function thumbImage(url) {
  return cloudinaryImage(url, { width: 240, height: 180, crop: "fill", gravity: "auto" });
}
