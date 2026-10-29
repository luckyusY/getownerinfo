import { z } from "zod";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { audit } from "@/models/AuditLog";
import { ok, fail, requireAuth } from "@/lib/api";
import { enforceRateLimit } from "@/lib/rateLimit";
import {
  notify, generateOtp, hashOtp, verifyOtp, emailConfigured, smsConfigured,
} from "@/lib/notify";
import { isValidRwandaPhone } from "@/lib/phone";


const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const sendSchema = z.object({ channel: z.enum(["email", "phone"]) });
const confirmSchema = z.object({
  channel: z.enum(["email", "phone"]),
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

/** Whether a code for this channel can actually be delivered right now. */
function channelDeliverable(channel) {
  return channel === "email" ? emailConfigured() : smsConfigured();
}

function targetFor(channel, user) {
  return channel === "email" ? user.email : user.phone;
}

// GET /api/verification/contact — current state of both channels.
export async function GET() {
  const guard = requireAuth();
  if (guard.error) return guard.error;

  await connectDB();
  const user = await User.findById(guard.session.sub).select("email phone emailVerifiedAt phoneVerifiedAt");
  if (!user) return fail("User not found", 404);

  return ok({
    email: {
      value: user.email,
      verified: Boolean(user.emailVerifiedAt),
      verifiedAt: user.emailVerifiedAt,
      deliverable: emailConfigured(),
    },
    phone: {
      value: user.phone || null,
      verified: Boolean(user.phoneVerifiedAt),
      verifiedAt: user.phoneVerifiedAt,
      // Phone verification is only enforced once an SMS provider exists.
      deliverable: smsConfigured(),
    },
  });
}

// POST /api/verification/contact — send a code to one channel.
export async function POST(req) {
  const guard = requireAuth();
  if (guard.error) return guard.error;

  const limited = await enforceRateLimit(req, {
    name: "contact-otp-send",
    limit: 6,
    windowMs: 60 * 60 * 1000,
    identifier: guard.session.sub,
  });
  if (limited) return limited;

  let body;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body");
  }
  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) return fail("channel must be 'email' or 'phone'", 422);
  const { channel } = parsed.data;

  await connectDB();
  const user = await User.findById(guard.session.sub).select("+contactOtp.emailCode +contactOtp.phoneCode email phone emailVerifiedAt phoneVerifiedAt");
  if (!user) return fail("User not found", 404);

  if (channel === "email" && user.emailVerifiedAt) return fail("Your email is already verified", 409);
  if (channel === "phone" && user.phoneVerifiedAt) return fail("Your phone is already verified", 409);

  const target = targetFor(channel, user);
  if (!target) {
    return fail("Add a phone number to your profile before verifying it", 422);
  }
  if (channel === "phone" && !isValidRwandaPhone(target)) {
    return fail("Your profile phone number is not a valid Rwanda mobile number", 422);
  }

  // A code we cannot deliver would strand the user at a prompt they can never
  // satisfy. Say so plainly instead of pretending it was sent.
  if (!channelDeliverable(channel) && process.env.NODE_ENV === "production") {
    return fail(
      channel === "email"
        ? "Email verification is temporarily unavailable. Please try again shortly."
        : "Phone verification is not available yet. Verify your email instead.",
      503
    );
  }

  const code = generateOtp();
  user.contactOtp = {
    ...(user.contactOtp?.toObject?.() || user.contactOtp || {}),
    [`${channel}Code`]: hashOtp(code),
    [`${channel}ExpiresAt`]: new Date(Date.now() + OTP_TTL_MS),
    [`${channel}Attempts`]: 0,
    [`${channel}Target`]: target,
  };
  await user.save();

  await notify({
    to: target,
    channel: channel === "email" ? "email" : "sms",
    subject: "Your getownerinfo verification code",
    message: `Your verification code is ${code}. It expires in 10 minutes.`,
  });

  await audit({
    actor: user._id,
    actorRole: guard.session.role,
    action: "verification.contact_code_sent",
    targetType: "User",
    targetId: user._id,
    meta: { channel },
  });

  return ok({
    sent: true,
    channel,
    expiresInMinutes: OTP_TTL_MS / 60000,
    // Outside production only, so the flow is testable without a provider.
    ...(process.env.NODE_ENV !== "production" ? { devOtp: code } : {}),
  });
}

// PUT /api/verification/contact — confirm a code.
export async function PUT(req) {
  const guard = requireAuth();
  if (guard.error) return guard.error;

  const limited = await enforceRateLimit(req, {
    name: "contact-otp-confirm",
    limit: 20,
    windowMs: 60 * 60 * 1000,
    identifier: guard.session.sub,
  });
  if (limited) return limited;

  let body;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body");
  }
  const parsed = confirmSchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.flatten().fieldErrors.code?.[0] || "Invalid request", 422);
  }
  const { channel, code } = parsed.data;

  await connectDB();
  const user = await User.findById(guard.session.sub).select(
    `+contactOtp.${channel}Code +contactOtp.${channel}ExpiresAt +contactOtp.${channel}Attempts +contactOtp.${channel}Target email phone emailVerifiedAt phoneVerifiedAt`
  );
  if (!user) return fail("User not found", 404);

  const otp = user.contactOtp || {};
  const storedHash = otp[`${channel}Code`];
  const expiresAt = otp[`${channel}ExpiresAt`];
  const attempts = otp[`${channel}Attempts`] || 0;
  const sentTo = otp[`${channel}Target`];

  if (!storedHash || !expiresAt) return fail("Request a code first", 409);
  if (expiresAt < new Date()) return fail("That code has expired. Request a new one.", 410);
  if (attempts >= MAX_ATTEMPTS) {
    return fail("Too many incorrect attempts. Request a new code.", 429);
  }
  // The code is bound to the address it was sent to, so editing the profile
  // mid-flow cannot verify a different address.
  if (sentTo && sentTo !== targetFor(channel, user)) {
    return fail("Your contact details changed. Request a new code.", 409);
  }

  if (!verifyOtp(code, storedHash)) {
    user.contactOtp[`${channel}Attempts`] = attempts + 1;
    await user.save();
    return fail(`Incorrect code. ${MAX_ATTEMPTS - attempts - 1} attempts left.`, 422);
  }

  user[`${channel}VerifiedAt`] = new Date();
  user.contactOtp[`${channel}Code`] = undefined;
  user.contactOtp[`${channel}ExpiresAt`] = undefined;
  user.contactOtp[`${channel}Attempts`] = 0;
  user.contactOtp[`${channel}Target`] = undefined;
  await user.save();

  await audit({
    actor: user._id,
    actorRole: guard.session.role,
    action: "verification.contact_verified",
    targetType: "User",
    targetId: user._id,
    meta: { channel },
  });

  return ok({
    channel,
    verified: true,
    email: Boolean(user.emailVerifiedAt),
    phone: Boolean(user.phoneVerifiedAt),
  });
}
