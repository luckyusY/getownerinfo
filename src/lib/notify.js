// Notification dispatch. Sends real email via Resend when RESEND_API_KEY is set;
// otherwise logs server-side so dev flows still work.
//
// Callers must check the returned `delivered` flag. An OTP that was never
// delivered is not a gate — it locks the user out of a flow they paid for.

import crypto from "crypto";
import { env } from "./env.js";

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const EMAIL_FROM = process.env.EMAIL_FROM || "getownerinfo <onboarding@resend.dev>";

export const emailConfigured = () => Boolean(RESEND_API_KEY);

async function sendEmail({ to, subject, message }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: [to],
      subject: subject || "getownerinfo",
      text: message,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend ${res.status}: ${body}`);
  }
  return res.json();
}

/**
 * Dispatch a notification. Never throws.
 * @returns {{ ok: boolean, delivered: boolean, channel: string, error?: string }}
 */
export async function notify({ to, channel = "in_app", subject, message, meta }) {
  if (channel === "email" && emailConfigured() && to) {
    try {
      await sendEmail({ to, subject, message });
      return { ok: true, delivered: true, channel };
    } catch (err) {
      console.error("notify.email failed:", err?.message || err);
      return { ok: false, delivered: false, channel, error: err?.message || "Email send failed" };
    }
  }

  // No provider configured (or in-app channel): log only.
  console.log(`[notify:${channel}] -> ${to}: ${subject || message}`, meta || "");
  return { ok: true, delivered: false, channel };
}

/** Cryptographically secure 6-digit OTP. */
export function generateOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

/**
 * HMAC an OTP with the server secret before storing it, so a database-only
 * compromise does not reveal live codes.
 */
export function hashOtp(otp) {
  return crypto.createHmac("sha256", env.jwtSecret).update(String(otp)).digest("hex");
}

/** Constant-time comparison of a submitted OTP against a stored hash. */
export function verifyOtp(submitted, storedHash) {
  if (!submitted || !storedHash) return false;
  const a = Buffer.from(hashOtp(submitted), "hex");
  const b = Buffer.from(String(storedHash), "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
