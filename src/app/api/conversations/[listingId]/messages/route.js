import { z } from "zod";
import { connectDB } from "@/lib/db";
import Listing from "@/models/Listing";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";
import TokenUnlock from "@/models/TokenUnlock";
import { scanMessage } from "@/lib/contentFilter";
import { audit } from "@/models/AuditLog";
import { ok, fail, requireAuth } from "@/lib/api";
import { ROLES } from "@/lib/constants";

const sendSchema = z.object({
  body: z.string().min(1).max(2000),
  buyerId: z.string().optional(), // required when owner/admin/manager sends
  asSide: z.enum(["buyer", "owner"]).optional(), // for admin/manager on-behalf
});

const STAFF = [ROLES.ADMIN, ROLES.MANAGER];

// POST /api/conversations/:listingId/messages — send a message.
export async function POST(req, { params }) {
  const guard = requireAuth([ROLES.BUYER, ROLES.OWNER, ...STAFF]);
  if (guard.error) return guard.error;

  let body;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body");
  }
  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) return fail("A non-empty message body is required", 422);
  const { role, sub } = guard.session;

  await connectDB();
  const listing = await Listing.findById(params.listingId);
  if (!listing) return fail("Listing not found", 404);

  // Resolve the conversation's buyer + which side this message is on.
  let buyerId;
  let senderSide;
  let onBehalf = false;

  if (role === ROLES.BUYER) {
    buyerId = sub;
    senderSide = "buyer";
  } else if (role === ROLES.OWNER) {
    if (listing.owner.toString() !== sub) return fail("Not your listing", 403);
    if (!parsed.data.buyerId) return fail("buyerId is required to reply", 422);
    buyerId = parsed.data.buyerId;
    senderSide = "owner";
  } else {
    // admin / manager replying on behalf
    if (!parsed.data.buyerId || !parsed.data.asSide) {
      return fail("buyerId and asSide are required for staff replies", 422);
    }
    buyerId = parsed.data.buyerId;
    senderSide = parsed.data.asSide;
    onBehalf = true;
  }

  // Find or create the thread.
  let conversation = await Conversation.findOne({ listing: listing._id, buyer: buyerId });
  if (!conversation) {
    if (senderSide !== "buyer" && !onBehalf) {
      return fail("No conversation yet — the buyer must start it", 409);
    }
    conversation = await Conversation.create({
      listing: listing._id,
      buyer: buyerId,
      owner: listing.owner,
    });
  }

  // Filter applies before token unlock — unless sent by staff (override).
  const unlocked = await TokenUnlock.exists({ user: buyerId, listing: listing._id });
  let blocked = false;
  let reasons = [];
  if (!onBehalf && !unlocked) {
    const scan = scanMessage(parsed.data.body);
    blocked = scan.blocked;
    reasons = scan.reasons;
  }

  const message = await Message.create({
    conversation: conversation._id,
    sender: sub,
    senderSide,
    body: parsed.data.body,
    blocked,
    blockedReasons: reasons,
    onBehalfBy: onBehalf ? sub : null,
    onBehalfByRole: onBehalf ? role : null,
  });

  if (blocked) {
    await audit({
      actor: sub,
      actorRole: role,
      action: "message.blocked",
      targetType: "Listing",
      targetId: listing._id,
      meta: { reasons, conversationId: conversation._id.toString() },
    });
    return ok({ blocked: true, reasons, messageId: message._id.toString() }, 200);
  }

  // Only delivered messages advance the thread preview.
  conversation.lastMessageAt = new Date();
  conversation.lastMessagePreview = parsed.data.body.slice(0, 80);
  await conversation.save();

  if (onBehalf) {
    await audit({
      actor: sub,
      actorRole: role,
      action: "message.on_behalf",
      targetType: "Conversation",
      targetId: conversation._id,
      meta: { asSide: senderSide },
    });
  }

  return ok({ message: serializeMessage(message), conversationId: conversation._id.toString() }, 201);
}

// GET /api/conversations/:listingId/messages?buyerId=... — fetch a thread.
export async function GET(req, { params }) {
  const guard = requireAuth([ROLES.BUYER, ROLES.OWNER, ...STAFF]);
  if (guard.error) return guard.error;
  const { role, sub } = guard.session;

  await connectDB();
  const listing = await Listing.findById(params.listingId);
  if (!listing) return fail("Listing not found", 404);

  const { searchParams } = new URL(req.url);
  let buyerId = role === ROLES.BUYER ? sub : searchParams.get("buyerId");
  if (!buyerId) return fail("buyerId is required", 422);

  // Authorization: buyer sees own; owner sees own listing; staff sees all.
  if (role === ROLES.OWNER && listing.owner.toString() !== sub) return fail("Forbidden", 403);
  if (role === ROLES.BUYER && buyerId !== sub) return fail("Forbidden", 403);

  const conversation = await Conversation.findOne({ listing: listing._id, buyer: buyerId });
  if (!conversation) return ok({ messages: [], unlocked: false });

  const all = await Message.find({ conversation: conversation._id }).sort({ createdAt: 1 });
  const unlocked = !!(await TokenUnlock.exists({ user: buyerId, listing: listing._id }));

  // A blocked message is visible only to its sender and to staff (audit).
  const isStaff = STAFF.includes(role);
  const visible = all.filter((m) => !m.blocked || isStaff || m.sender.toString() === sub);

  return ok({
    conversationId: conversation._id.toString(),
    unlocked,
    messages: visible.map(serializeMessage),
  });
}

function serializeMessage(m) {
  return {
    id: m._id.toString(),
    senderSide: m.senderSide,
    body: m.body,
    blocked: m.blocked,
    blockedReasons: m.blockedReasons,
    onBehalf: !!m.onBehalfBy,
    at: m.createdAt,
  };
}
