import { z } from "zod";
import { connectDB } from "@/lib/db";
import SeekerRequest, { SEEKER_STATUS } from "@/models/SeekerRequest";
import Category from "@/models/Category";
import User from "@/models/User";
import Payment from "@/models/Payment";
import PlatformSettings, { getSettings } from "@/models/PlatformSettings";
import { DEFAULT_SETTINGS } from "@/data/catalog";
import { safeInitiate, safeVerify } from "@/lib/payments";
import { audit } from "@/models/AuditLog";
import { ok, fail, requireAuth } from "@/lib/api";
import { ROLES, PAYMENT_TYPES, PAYMENT_STATUS } from "@/lib/constants";

const createSchema = z.object({
  categorySlug: z.string(),
  subcategoryId: z.string().optional(),
  budgetMin: z.number().nonnegative().default(0),
  budgetMax: z.number().nonnegative().default(0),
  preferredLocation: z.string().optional(),
  quantityType: z.string().optional(),
  details: z.string().min(3),
  validityDays: z.number().int().positive().default(30),
  contact: z
    .object({
      name: z.string().optional(),
      phone: z.string().optional(),
      preferredContactTime: z.string().optional(),
    })
    .default({}),
  privateNotes: z.string().optional(),
});

// POST /api/seekers — post a seeker request (charges the post fee, then activates).
export async function POST(req) {
  const guard = requireAuth([ROLES.BUYER, ROLES.ADMIN]);
  if (guard.error) return guard.error;

  let body;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body");
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return fail("Validation failed", 422, { issues: parsed.error.flatten().fieldErrors });
  const data = parsed.data;

  await connectDB();
  const category = await Category.findOne({ slug: data.categorySlug });
  if (!category) return fail("Unknown category", 404);

  // Duplicate prevention: one active request per (seeker, category) at a time.
  const dup = await SeekerRequest.findOne({
    seeker: guard.session.sub,
    category: category._id,
    status: SEEKER_STATUS.ACTIVE,
    expiresAt: { $gt: new Date() },
  });
  if (dup) return fail("You already have an active request in this category", 409);

  const settings = await getSettings(PlatformSettings, DEFAULT_SETTINGS);
  const user = await User.findById(guard.session.sub);

  const expiresAt = new Date(Date.now() + data.validityDays * 24 * 3600 * 1000);
  const request = await SeekerRequest.create({
    seeker: user._id,
    category: category._id,
    subcategory: data.subcategoryId || undefined,
    budgetMin: data.budgetMin,
    budgetMax: data.budgetMax,
    preferredLocation: data.preferredLocation,
    quantityType: data.quantityType,
    details: data.details,
    validityDays: data.validityDays,
    expiresAt,
    contact: {
      name: data.contact.name || user.name,
      phone: data.contact.phone || user.phone,
      preferredContactTime: data.contact.preferredContactTime,
    },
    privateNotes: data.privateNotes,
    status: SEEKER_STATUS.PENDING,
  });

  // Charge the post fee.
  const amount = settings.seeker?.postFee ?? 20_000;
  const init = await safeInitiate({
    amount,
    type: PAYMENT_TYPES.SEEKER_POST,
    reference: request._id.toString(),
    metadata: { seekerRequestId: request._id.toString() },
  });
  if (!init.ok) {
    // Roll back the unpaid request so it doesn't linger as a pending orphan.
    await SeekerRequest.deleteOne({ _id: request._id });
    return fail("Payment could not be processed right now. Please try again later.", 502);
  }

  const payment = await Payment.create({
    user: user._id,
    type: PAYMENT_TYPES.SEEKER_POST,
    amount,
    status: PAYMENT_STATUS.PENDING,
    provider: init.provider.name,
    providerRef: init.providerRef,
    meta: { seekerRequestId: request._id.toString() },
  });

  const verified = init.status === "paid" ? { ok: true, status: "paid" } : await safeVerify(init.providerRef);
  if (!verified.ok || verified.status !== "paid") {
    payment.status = PAYMENT_STATUS.PENDING;
    await payment.save();
    return ok({ request: request.toPublicJSON(), needsPayment: true, paymentId: payment._id.toString(), redirectUrl: init.redirectUrl }, 201);
  }

  payment.status = PAYMENT_STATUS.PAID;
  await payment.save();
  request.status = SEEKER_STATUS.ACTIVE;
  request.postPayment = payment._id;
  await request.save();

  await audit({
    actor: user._id,
    actorRole: guard.session.role,
    action: "seeker.create",
    targetType: "SeekerRequest",
    targetId: request._id,
    meta: { amount },
  });

  return ok({ request: request.toPublicJSON() }, 201);
}

// GET /api/seekers — browse active, non-expired requests (anonymized).
export async function GET(req) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const query = { status: SEEKER_STATUS.ACTIVE, expiresAt: { $gt: new Date() } };
  const categorySlug = searchParams.get("category");
  if (categorySlug) {
    const cat = await Category.findOne({ slug: categorySlug });
    if (cat) query.category = cat._id;
    else return ok({ requests: [] });
  }
  const requests = await SeekerRequest.find(query).sort({ createdAt: -1 }).limit(60);
  return ok({ requests: requests.map((r) => r.toPublicJSON()) });
}
