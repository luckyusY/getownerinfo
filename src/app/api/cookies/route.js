import { cookies } from "next/headers";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import CookieConsent from "@/models/CookieConsent";
import { getSession } from "@/lib/auth";
import { ok, fail } from "@/lib/api";

const CONSENT_COOKIE = "goi_cookie_consent";

const schema = z.object({
  analytics: z.boolean().default(false),
  preferences: z.boolean().default(false),
});

// GET /api/cookies — current consent state (from the HttpOnly cookie).
export async function GET() {
  const raw = cookies().get(CONSENT_COOKIE)?.value;
  if (!raw) return ok({ consented: false, prefs: null });
  try {
    const prefs = JSON.parse(raw);
    return ok({ consented: true, prefs });
  } catch {
    return ok({ consented: false, prefs: null });
  }
}

// POST /api/cookies — save consent. Essential cookies cannot be disabled.
export async function POST(req) {
  let body = {};
  try {
    body = await req.json();
  } catch {
    /* defaults */
  }
  const parsed = schema.safeParse(body || {});
  if (!parsed.success) return fail("Invalid preferences", 422);

  const prefs = { essential: true, analytics: parsed.data.analytics, preferences: parsed.data.preferences };

  // Store securely: HttpOnly + Secure (in prod) + SameSite. Read back via this API.
  cookies().set(CONSENT_COOKIE, JSON.stringify(prefs), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });

  // Persist for logged-in users (audit).
  const session = getSession();
  if (session) {
    await connectDB();
    await CookieConsent.findOneAndUpdate(
      { user: session.sub },
      { user: session.sub, ...prefs },
      { upsert: true, new: true }
    );
  }

  return ok({ saved: true, prefs });
}
