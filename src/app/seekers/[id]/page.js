import { cache } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Banknote, CalendarClock, Clock, Eye, MapPin, Package, Search,
} from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ShareButton from "@/components/ShareButton";
import Badge, { StatusBadge } from "@/components/ui/Badge";
import { connectDB } from "@/lib/db";
import SeekerRequest, { SEEKER_STATUS } from "@/models/SeekerRequest";
import SeekerUnlock from "@/models/SeekerUnlock";
import Category from "@/models/Category";
import Subcategory from "@/models/Subcategory";
import PlatformSettings, { getSettings } from "@/models/PlatformSettings";
import { DEFAULT_SETTINGS } from "@/data/catalog";
import { getSession } from "@/lib/auth";
import { buildSeekerContact } from "@/lib/seekerContact";
import { ROLES } from "@/lib/constants";
import { formatRwf, formatDate } from "@/lib/format";
import SeekerUnlockPanel from "./SeekerUnlockPanel";

export const dynamic = "force-dynamic";

/**
 * Who may see this request at all, and whether the contact comes with it.
 *
 * The rules deliberately mirror `GET /api/seekers/[id]`: the seeker and an
 * admin always see their own, and everyone else only sees a request that is
 * active and unexpired. Anything else is a 404 rather than a "not allowed",
 * because the existence of a request is itself information about the person
 * who posted it.
 *
 * Wrapped in React's `cache` because `generateMetadata` and the page body both
 * need it, and without that Mongoose would read the same document twice on
 * every request.
 */
const resolveView = cache(async function resolveView(id) {
  const request = await SeekerRequest.findById(id);
  if (!request) return null;

  const session = getSession();
  const isSeeker = Boolean(session) && request.seeker.toString() === session.sub;
  const isAdmin = session?.role === ROLES.ADMIN;

  if (isSeeker || isAdmin) {
    return {
      request,
      session,
      isSeeker,
      revealed: buildSeekerContact(request, isSeeker ? "your own request" : "admin"),
    };
  }

  const expired = request.expiresAt && request.expiresAt < new Date();
  if (request.status !== SEEKER_STATUS.ACTIVE || expired) return null;

  if (session) {
    const unlock = await SeekerUnlock.findOne({ viewer: session.sub, seekerRequest: request._id });
    if (unlock) {
      return { request, session, isSeeker: false, revealed: buildSeekerContact(request, unlock.watermark) };
    }
  }

  return { request, session, isSeeker: false, revealed: null };
});

export async function generateMetadata({ params }) {
  try {
    await connectDB();
    const view = await resolveView(params.id);
    if (!view) return { title: "Request not found" };
    const { details, preferredLocation } = view.request;
    const where = preferredLocation ? ` in ${preferredLocation}` : "";
    return {
      title: `Buyer request${where}`,
      // The details are public on an active request, so they are safe in a
      // description. The contact never is.
      description: String(details || "").slice(0, 155),
    };
  } catch {
    return { title: "Buyer request" };
  }
}

export default async function SeekerRequestDetail({ params }) {
  await connectDB();
  const view = await resolveView(params.id);
  if (!view) notFound();

  const { request, session, isSeeker, revealed } = view;

  const [category, subcategory, settings] = await Promise.all([
    request.category ? Category.findById(request.category).select("name slug").lean() : null,
    request.subcategory ? Subcategory.findById(request.subcategory).select("name").lean() : null,
    getSettings(PlatformSettings, DEFAULT_SETTINGS),
  ]);

  const viewToken = settings.seeker?.viewToken ?? DEFAULT_SETTINGS.seeker?.viewToken ?? 10000;
  const budget = request.budgetMin || request.budgetMax
    ? `${formatRwf(request.budgetMin)} to ${formatRwf(request.budgetMax)}`
    : "Not stated";

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="page-shell">
        <Link
          href="/seekers"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-ink-soft transition hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> All requests
        </Link>

        <div className="mt-4 grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
          <article className="card">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="brand">
                <Search className="h-3.5 w-3.5" /> {category?.name || "Request"}
              </Badge>
              {subcategory?.name && <Badge tone="neutral">{subcategory.name}</Badge>}
              <StatusBadge status={request.status} />
              {isSeeker && <Badge tone="info">Yours</Badge>}
            </div>

            <h1 className="mt-4 font-display text-2xl font-bold leading-snug text-ink sm:text-3xl">
              {request.preferredLocation
                ? `Wanted in ${request.preferredLocation}`
                : "Wanted anywhere in Rwanda"}
            </h1>

            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-ink">
              {request.details || "The seeker did not add any detail."}
            </p>

            <dl className="mt-6 grid gap-3 sm:grid-cols-2">
              <Fact icon={Banknote} label="Budget" value={budget} />
              <Fact icon={MapPin} label="Preferred location" value={request.preferredLocation || "Any location"} />
              {request.quantityType && <Fact icon={Package} label="Looking for" value={request.quantityType} />}
              <Fact icon={CalendarClock} label="Posted" value={formatDate(request.createdAt)} />
              <Fact icon={Clock} label="Expires" value={formatDate(request.expiresAt)} />
              <Fact
                icon={Eye}
                label="Unlocked by"
                value={`${request.unlockCount || 0} ${request.unlockCount === 1 ? "viewer" : "viewers"}`}
              />
            </dl>

            <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-4">
              <ShareButton title={`Buyer request — ${category?.name || "getownerinfo"}`} />
              {isSeeker && (
                <Link href="/dashboard/requests" className="btn-outline">
                  Manage my requests
                </Link>
              )}
            </div>
          </article>

          <aside className="grid gap-4 lg:sticky lg:top-[calc(var(--header-h)+1rem)]">
            <SeekerUnlockPanel
              requestId={request._id.toString()}
              loggedIn={Boolean(session)}
              isSeeker={isSeeker}
              area={request.preferredLocation}
              viewToken={viewToken}
              initialRevealed={revealed}
            />

            <div className="card !p-4">
              <p className="text-sm font-bold text-ink">How this works</p>
              <p className="mt-2 text-xs font-semibold leading-5 text-ink-soft">
                Seekers post what they are looking for without exposing their phone number.
                Pay the view token once to reveal it, then deal directly. Every reveal is
                watermarked to the account that paid for it.
              </p>
            </div>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Fact({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-panel px-3.5 py-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
      <div className="min-w-0">
        <dt className="text-[11px] font-black uppercase tracking-wide text-ink-faint">{label}</dt>
        <dd className="mt-0.5 text-sm font-bold text-ink">{value}</dd>
      </div>
    </div>
  );
}
