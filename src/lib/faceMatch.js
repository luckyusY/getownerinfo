// Automated face comparison between an ID document and a live selfie
// (spec Part 13: "automated face/image comparison where technically supported").
//
// No provider is wired up. Rather than pretend a comparison happened, this
// reports `not_configured` and leaves the decision entirely with the admin,
// who sees both images side by side. Point FACE_MATCH_URL at a service that
// accepts two image URLs and returns a similarity score to switch it on.

const PROVIDER_URL = process.env.FACE_MATCH_URL || "";
const PROVIDER_KEY = process.env.FACE_MATCH_API_KEY || "";
const PROVIDER_NAME = process.env.FACE_MATCH_PROVIDER || "custom";

// Similarity at or above this is reported as a match. Deliberately high: a
// false "match" is far worse here than a false "no match", because the whole
// point is to stop someone verifying with another person's ID.
const MATCH_THRESHOLD = Number(process.env.FACE_MATCH_THRESHOLD || 0.85);

export const faceMatchConfigured = () => Boolean(PROVIDER_URL);

/**
 * Compare a document photo against a selfie.
 *
 * Never throws — a provider outage must not block a submission. It records an
 * `error` status and the admin reviews manually, exactly as they would when no
 * provider is configured at all.
 *
 * @param {object} args
 *   - idImageUrl      short-lived signed URL of the ID document
 *   - selfieImageUrl  short-lived signed URL of the selfie
 * @returns {{ status: string, score: number|null, provider: string|null, checkedAt: Date }}
 */
export async function compareFaces({ idImageUrl, selfieImageUrl }) {
  const checkedAt = new Date();

  if (!PROVIDER_URL) {
    return { status: "not_configured", score: null, provider: null, checkedAt };
  }
  if (!idImageUrl || !selfieImageUrl) {
    return { status: "error", score: null, provider: PROVIDER_NAME, checkedAt };
  }

  try {
    const res = await fetch(PROVIDER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(PROVIDER_KEY ? { Authorization: `Bearer ${PROVIDER_KEY}` } : {}),
      },
      body: JSON.stringify({ source: idImageUrl, target: selfieImageUrl }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      console.error(`face match provider returned ${res.status}`);
      return { status: "error", score: null, provider: PROVIDER_NAME, checkedAt };
    }

    const body = await res.json();
    const score = Number(body.similarity ?? body.score);
    if (!Number.isFinite(score)) {
      return { status: "error", score: null, provider: PROVIDER_NAME, checkedAt };
    }

    return {
      status: score >= MATCH_THRESHOLD ? "match" : "no_match",
      score,
      provider: PROVIDER_NAME,
      checkedAt,
    };
  } catch (err) {
    console.error("face match failed:", err?.message || err);
    return { status: "error", score: null, provider: PROVIDER_NAME, checkedAt };
  }
}

/** Human-readable summary for the admin review panel. */
export function describeFaceMatch(faceMatch) {
  if (!faceMatch || faceMatch.status === "not_configured") {
    return {
      label: "Manual check required",
      detail: "No automated face comparison is configured — compare the two images yourself.",
      tone: "neutral",
    };
  }
  const pct = faceMatch.score != null ? `${Math.round(faceMatch.score * 100)}% similarity` : "no score";
  switch (faceMatch.status) {
    case "match":
      return { label: "Likely match", detail: `${pct}. Still confirm visually.`, tone: "success" };
    case "no_match":
      return { label: "Likely mismatch", detail: `${pct}. Review carefully before approving.`, tone: "danger" };
    case "error":
      return {
        label: "Check failed",
        detail: "The comparison service could not be reached — compare the two images yourself.",
        tone: "warning",
      };
    default:
      return { label: "Pending", detail: "The comparison has not run yet.", tone: "neutral" };
  }
}
