import { NextResponse } from "next/server";
import { env } from "@/lib/env";

// GET|POST /api/payments/return — where AfriPay sends the buyer back to after
// checkout (the return_url we post in src/app/api/payments/[id]/checkout).
//
// This route deliberately changes NO state. A browser redirect is attacker-
// controllable — anyone can open this URL with any query string — so it must
// never mark a payment paid. Settlement belongs to the webhook.
//
// What AfriPay appends to return_url is not documented, and the DASIA site this
// integration was reverse-engineered from ignores it entirely. So the handler
// logs the full inbound shape: the first few real returns will show the actual
// contract, and the webhook/verify path can then be written against fact rather
// than guesswork.
export const dynamic = "force-dynamic";

async function handle(req) {
  const url = new URL(req.url);
  const query = Object.fromEntries(url.searchParams.entries());

  let body = null;
  if (req.method === "POST") {
    try {
      const raw = await req.text();
      body = raw.slice(0, 2000);
    } catch {
      /* body is best-effort; never fail the redirect over it */
    }
  }

  // TODO: once these logs show AfriPay's real return contract, replace this with
  // a proper status lookup. Until then it is the only record of what they send.
  console.info(
    "payments.afripay.return:",
    JSON.stringify({ method: req.method, query, body })
  );

  const ref = query.ref || "";
  const dest = new URL("/dashboard", env.appUrl);
  dest.searchParams.set("payment", "returned");
  if (ref) dest.searchParams.set("ref", ref);

  return NextResponse.redirect(dest, { status: 303 });
}

export async function GET(req) {
  return handle(req);
}

export async function POST(req) {
  return handle(req);
}
