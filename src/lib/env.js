// Centralized env access. Throws early if a required var is missing so we fail
// loudly at startup rather than deep inside a request handler.

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  get mongodbUri() {
    return required("MONGODB_URI");
  },
  get jwtSecret() {
    return required("JWT_SECRET");
  },
  get jwtExpiresIn() {
    return process.env.JWT_EXPIRES_IN || "7d";
  },
  cloudinary: {
    get cloudName() {
      return required("CLOUDINARY_CLOUD_NAME");
    },
    get apiKey() {
      return required("CLOUDINARY_API_KEY");
    },
    get apiSecret() {
      return required("CLOUDINARY_API_SECRET");
    },
  },
  afripay: {
    baseUrl: process.env.AFRIPAY_BASE_URL || "",
    apiKey: process.env.AFRIPAY_API_KEY || "",
    secret: process.env.AFRIPAY_SECRET || "",
  },
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
};
