// Fixed-window rate limiting for sensitive routes.
//
// Backends:
//   - Upstash Redis REST when UPSTASH_REDIS_REST_URL/TOKEN are set. Durable and
//     shared across serverless instances — the correct choice in production.
//   - In-memory Map otherwise. Per-instance only, so a horizontally scaled deploy
//     multiplies the effective limit by the instance count. Weak, but non-zero,
//     and it makes local development behave the same way.

import { fail } from "./api.js";

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL || "";
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || "";
const useUpstash = Boolean(UPSTASH_URL && UPSTASH_TOKEN);

/** @type {Map<string, { count: number, resetAt: number }>} */
const buckets = new Map();

function memoryHit(key, windowMs) {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    const entry = { count: 1, resetAt: now + windowMs };
    buckets.set(key, entry);
    // Opportunistic cleanup so the map can't grow without bound.
    if (buckets.size > 5000) {
      for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
    }
    return { count: 1, resetAt: entry.resetAt };
  }
  existing.count += 1;
  return { count: existing.count, resetAt: existing.resetAt };
}

async function upstashHit(key, windowMs) {
  const seconds = Math.ceil(windowMs / 1000);
  const res = await fetch(`${UPSTASH_URL}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      ["INCR", key],
      ["EXPIRE", key, String(seconds), "NX"],
      ["PTTL", key],
    ]),
  });
  if (!res.ok) throw new Error(`Upstash ${res.status}`);
  const out = await res.json();
  const count = Number(out?.[0]?.result ?? 0);
  const pttl = Number(out?.[2]?.result ?? windowMs);
  return { count, resetAt: Date.now() + (pttl > 0 ? pttl : windowMs) };
}

/**
 * Record a hit against `key`.
 * @returns {Promise<{ ok: boolean, remaining: number, retryAfter: number }>}
 */
export async function rateLimit({ key, limit, windowMs }) {
  let hit;
  try {
    hit = useUpstash ? await upstashHit(key, windowMs) : memoryHit(key, windowMs);
  } catch (err) {
    // Never let the limiter take the site down. Log and allow.
    console.error("rateLimit backend failed, allowing request:", err?.message || err);
    return { ok: true, remaining: limit, retryAfter: 0 };
  }
  const remaining = Math.max(0, limit - hit.count);
  return {
    ok: hit.count <= limit,
    remaining,
    retryAfter: Math.max(1, Math.ceil((hit.resetAt - Date.now()) / 1000)),
  };
}

/** Best-effort client IP from proxy headers. */
export function clientIp(req) {
  const xff = req?.headers?.get?.("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req?.headers?.get?.("x-real-ip") || "unknown";
}

/**
 * Guard a route. Returns a 429 NextResponse to return directly, or null to
 * continue.
 *
 * @param {Request} req
 * @param {{ name: string, limit: number, windowMs: number, identifier?: string }} opts
 */
export async function enforceRateLimit(req, { name, limit, windowMs, identifier }) {
  const who = identifier || clientIp(req);
  const { ok, retryAfter } = await rateLimit({ key: `rl:${name}:${who}`, limit, windowMs });
  if (ok) return null;
  const res = fail("Too many requests. Please slow down and try again shortly.", 429);
  res.headers.set("Retry-After", String(retryAfter));
  return res;
}
