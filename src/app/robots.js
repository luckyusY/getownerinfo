const BASE = process.env.NEXT_PUBLIC_APP_URL || "https://getownerinfo-ewgp.vercel.app";

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Keep private/authenticated areas and APIs out of the index.
      disallow: ["/dashboard/", "/api/", "/login", "/register"],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
