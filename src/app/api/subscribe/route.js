import { z } from "zod";
import { connectDB } from "@/lib/db";
import Subscriber from "@/models/Subscriber";
import { ok, fail } from "@/lib/api";
import { enforceRateLimit } from "@/lib/rateLimit";

const schema = z.object({ email: z.string().trim().email("Enter a valid email address") });

// POST /api/subscribe — newsletter sign-up from the public footer.
export async function POST(req) {
  const limited = await enforceRateLimit(req, {
    name: "subscribe",
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (limited) return limited;

  let body;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body");
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.flatten().fieldErrors.email?.[0] || "Enter a valid email address", 422);
  }

  await connectDB();
  // Upsert so re-subscribing clears a previous opt-out instead of failing on
  // the unique index.
  await Subscriber.updateOne(
    { email: parsed.data.email.toLowerCase() },
    { $set: { unsubscribedAt: null, source: "footer" }, $setOnInsert: { email: parsed.data.email.toLowerCase() } },
    { upsert: true }
  );

  return ok({ subscribed: true }, 201);
}
