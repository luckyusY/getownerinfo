import { connectDB } from "@/lib/db";
import Listing from "@/models/Listing";
import SeekerRequest from "@/models/SeekerRequest";
import { LISTING_STATUS } from "@/lib/constants";

const BASE = process.env.NEXT_PUBLIC_APP_URL || "https://getownerinfo-ewgp.vercel.app";

export const dynamic = "force-dynamic";

export default async function sitemap() {
  const staticRoutes = ["", "/listings", "/seekers", "/about", "/faq", "/contact", "/terms", "/privacy"].map(
    (path) => ({ url: `${BASE}${path}`, lastModified: new Date(), changeFrequency: "weekly", priority: path === "" ? 1 : 0.7 })
  );

  let dynamicRoutes = [];
  try {
    await connectDB();
    const [listings, seekers] = await Promise.all([
      Listing.find({ status: LISTING_STATUS.ACTIVE }).select("updatedAt").limit(500).lean(),
      SeekerRequest.find({ status: "active", expiresAt: { $gt: new Date() } }).select("updatedAt").limit(500).lean(),
    ]);
    dynamicRoutes = [
      ...listings.map((l) => ({ url: `${BASE}/listings/${l._id}`, lastModified: l.updatedAt || new Date(), changeFrequency: "daily", priority: 0.6 })),
      ...seekers.map((s) => ({ url: `${BASE}/seekers/${s._id}`, lastModified: s.updatedAt || new Date(), changeFrequency: "daily", priority: 0.5 })),
    ];
  } catch {
    // If the DB is unreachable, still return the static routes.
  }

  return [...staticRoutes, ...dynamicRoutes];
}
