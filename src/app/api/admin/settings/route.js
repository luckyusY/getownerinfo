import { connectDB } from "@/lib/db";
import PlatformSettings, { getSettings } from "@/models/PlatformSettings";
import { DEFAULT_SETTINGS } from "@/data/catalog";
import { ok, fail, requireAuth } from "@/lib/api";
import { ROLES } from "@/lib/constants";

// GET /api/admin/settings — current platform settings (admin only).
export async function GET() {
  const guard = requireAuth([ROLES.ADMIN]);
  if (guard.error) return guard.error;

  await connectDB();
  const settings = await getSettings(PlatformSettings, DEFAULT_SETTINGS);
  return ok({ settings });
}

// PATCH /api/admin/settings — update platform settings (admin only).
const ALLOWED = ["vatRate", "currency", "durationDiscounts", "seeker", "penalty", "tokenAccess"];

export async function PATCH(req) {
  const guard = requireAuth([ROLES.ADMIN]);
  if (guard.error) return guard.error;

  let body;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body");
  }

  await connectDB();
  const settings = await getSettings(PlatformSettings, DEFAULT_SETTINGS);

  for (const key of ALLOWED) {
    if (body[key] !== undefined) settings[key] = body[key];
  }
  await settings.save();

  return ok({ settings });
}
