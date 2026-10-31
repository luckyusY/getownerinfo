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
    // AfriPay's hosted checkout is a form POST authenticated by an app_id /
    // app_secret pair, not a REST base URL + bearer key. See
    // src/lib/payments/afripay.js for the probed contract.
    appId: process.env.AFRIPAY_APP_ID || "",
    appSecret: process.env.AFRIPAY_APP_SECRET || "",
    // Reserved for webhook signature verification, if AfriPay ever documents
    // one. Unused until then.
    secret: process.env.AFRIPAY_SECRET || "",
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  },
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
};
