import { env } from "./env.js";

/**
 * The origin the visitor is actually using: scheme + host of this request.
 *
 * Links that carry a signed-in visitor from one page of ours to another must
 * stay on the host they are signed in on. The session cookie belongs to that
 * host alone, and the site answers on several (the custom domain, its www
 * form, the vercel.app address). Building such links from NEXT_PUBLIC_APP_URL
 * sent anyone browsing on a different host to an address where they had no
 * session: the payment handoff answered "Authentication required" and the
 * payment could not be started at all.
 *
 * Behind the platform's proxy the real host arrives in x-forwarded-host, so
 * that is read first. Falls back to the configured URL if a request somehow
 * carries no host.
 */
export function requestOrigin(req) {
  try {
    const url = new URL(req.url);
    const proto = req.headers.get("x-forwarded-proto")?.split(",")[0].trim() || url.protocol.replace(":", "");
    const host = req.headers.get("x-forwarded-host")?.split(",")[0].trim() || req.headers.get("host") || url.host;
    if (host && /^[a-z0-9.-]+(:\d+)?$/i.test(host)) return `${proto}://${host}`;
  } catch {
    /* fall through */
  }
  return env.appUrl;
}
