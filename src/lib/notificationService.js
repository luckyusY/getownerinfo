// One place that decides what a notification says and which channels carry it
// (spec Part 28).
//
// Before this, in-app records and emails were raised separately at each call
// site, so most events reached the bell but never an inbox, and a few reached
// neither. `dispatch` writes the in-app record and sends the outbound channels
// together, honouring the account's email preferences.

import User from "@/models/User";
import Notification, { notifyUser } from "@/models/Notification";
import { notify, emailConfigured, smsConfigured } from "@/lib/notify";
import { formatRwf } from "@/lib/format";

/**
 * Preference groups. In-app delivery is always on — it is a feed the user
 * chooses to open. Only outbound channels are opt-out, and the two that carry
 * money or access are not optional at all.
 */
export const PREF_GROUPS = {
  LISTINGS: "listings",
  PAYMENTS: "payments",
  MESSAGES: "messages",
  ACCOUNT: "account",
};

const money = (n) => formatRwf(n ?? 0);

/**
 * The event catalogue. Each entry builds its own copy from the supplied data,
 * so a call site passes facts rather than prose.
 *
 *   group     which preference toggle governs the email
 *   critical  true = always emailed, regardless of preference
 */
export const EVENTS = {
  listing_submitted: {
    group: PREF_GROUPS.LISTINGS,
    build: ({ listing }) => ({
      title: "Listing submitted for review",
      body: `“${listing.title}” is now awaiting approval. We will let you know once it has been reviewed.`,
      link: "/dashboard/listings?status=pending_approval",
    }),
  },
  listing_approved: {
    group: PREF_GROUPS.LISTINGS,
    build: ({ listing }) => ({
      title: "Listing approved",
      body: `“${listing.title}” is now live and visible to buyers.`,
      link: `/listings/${listing._id || listing.id}`,
    }),
  },
  listing_rejected: {
    group: PREF_GROUPS.LISTINGS,
    build: ({ listing, reason }) => ({
      title: "Listing needs changes",
      body: `“${listing.title}” was not approved: ${reason}. You can fix and resubmit it.`,
      link: "/dashboard/listings?status=rejected",
    }),
  },
  listing_expiring: {
    group: PREF_GROUPS.LISTINGS,
    build: ({ listing }) => ({
      title: "Listing expires soon",
      body: `“${listing.title}” expires on ${new Date(listing.expiresAt).toLocaleDateString()}. Renew it to keep it live.`,
      link: "/dashboard/listings?status=active",
    }),
  },
  listing_expired: {
    group: PREF_GROUPS.LISTINGS,
    build: ({ listing }) => ({
      title: "Your listing expired",
      body: `“${listing.title}” has reached the end of its duration and is no longer visible to buyers.`,
      link: "/dashboard/listings?status=expired",
    }),
  },
  listing_assigned: {
    group: PREF_GROUPS.LISTINGS,
    build: ({ listing }) => ({
      title: "A listing was assigned to you",
      body: `You are now managing “${listing.title}”.`,
      link: "/dashboard/manager",
    }),
  },
  draft_reminder: {
    group: PREF_GROUPS.LISTINGS,
    build: ({ listing, missing = [] }) => ({
      title: "Finish your listing",
      body: missing.length
        ? `“${listing.title}” still needs: ${missing.join(", ")}.`
        : `“${listing.title}” is complete — submit it when you are ready.`,
      link: `/dashboard/owner/listings/new?draft=${listing._id || listing.id}`,
    }),
  },

  // --- money and access: always emailed ---
  payment_successful: {
    group: PREF_GROUPS.PAYMENTS,
    critical: true,
    build: ({ payment, what }) => ({
      title: "Payment received",
      body: `We received ${money(payment.amount)} for ${what}. VAT included: ${money(payment.vatPortion)}.`,
      link: "/dashboard/payments",
    }),
  },
  unlock_received: {
    group: PREF_GROUPS.LISTINGS,
    build: ({ listing, buyerName }) => ({
      title: "A buyer unlocked your contact",
      body: `${buyerName} paid to unlock “${listing.title}”. Expect to hear from them shortly.`,
      link: `/listings/${listing._id || listing.id}`,
    }),
  },
  unlock_confirmed: {
    group: PREF_GROUPS.PAYMENTS,
    critical: true,
    // `unlockId` is the contact sheet — the copy that survives the listing
    // being sold, expiring or taken down. Without it this said the details
    // were in /dashboard/unlocks, which until now held only a field count.
    build: ({ listing, unlockId }) => ({
      title: "Contact unlocked",
      body: `You unlocked the owner's contact for “${listing.title}”. Your contact sheet keeps it, whatever happens to the listing.`,
      link: unlockId ? `/documents/unlock/${unlockId}` : "/dashboard/unlocks",
    }),
  },
  commission_invoiced: {
    group: PREF_GROUPS.PAYMENTS,
    critical: true,
    build: ({ listing, commission }) => ({
      title: "Commission invoice raised",
      body: `A commission of ${money(commission.total)} is due on “${listing.title}” by ${new Date(commission.dueDate).toLocaleDateString()}.`,
      link: "/dashboard/invoices",
    }),
  },
  commission_overdue: {
    group: PREF_GROUPS.PAYMENTS,
    critical: true,
    build: ({ listing, commission }) => ({
      title: "Commission overdue",
      body: `The commission of ${money(commission.total)} on “${listing?.title || "a listing"}” is past its due date and a penalty has been applied.`,
      link: "/dashboard/invoices",
    }),
  },
  penalty_applied: {
    group: PREF_GROUPS.PAYMENTS,
    critical: true,
    build: ({ reason }) => ({
      title: "A penalty was applied to your account",
      body: `${reason} New exclusive listings are blocked until your balance is settled.`,
      link: "/dashboard/invoices",
    }),
  },

  // --- conversations ---
  message_received: {
    group: PREF_GROUPS.MESSAGES,
    build: ({ listing, senderName, preview }) => ({
      title: `New message from ${senderName}`,
      // The preview is what makes this worth opening. Without it the reader
      // has to log in to find out whether the message needs them at all.
      body: preview
        ? `About “${listing.title}”: ${preview}`
        : `${senderName} sent you a message about “${listing.title}”.`,
      // Both sides of a thread read it at /dashboard/messages — it renders the
      // same inbox for whichever side the account is on.
      link: "/dashboard/messages",
    }),
  },

  // --- seeker requests ---
  seeker_published: {
    group: PREF_GROUPS.LISTINGS,
    build: ({ request }) => ({
      title: "Your request is live",
      body: `Your request is now visible to owners. Your contact stays hidden until someone pays the view token.`,
      link: "/dashboard/requests",
    }),
  },
  seeker_unlocked: {
    group: PREF_GROUPS.LISTINGS,
    build: () => ({
      title: "Someone responded to your request",
      body: "An owner paid to view your request and can now contact you.",
      link: "/dashboard/requests",
    }),
  },

  // --- account ---
  verification_approved: {
    group: PREF_GROUPS.ACCOUNT,
    critical: true,
    build: () => ({
      title: "Identity verified",
      body: "Your identity documents were approved. Your listings now display a verified badge.",
      link: "/dashboard/profile#verification",
    }),
  },
  verification_rejected: {
    group: PREF_GROUPS.ACCOUNT,
    critical: true,
    build: ({ reason }) => ({
      title: "Verification needs attention",
      body: `Your identity documents were not approved: ${reason}. You can submit again.`,
      link: "/dashboard/profile#verification",
    }),
  },
  report_resolved: {
    group: PREF_GROUPS.ACCOUNT,
    build: ({ outcome }) => ({
      title: "Your report was reviewed",
      body: `An admin reviewed the listing you reported. Outcome: ${outcome}.`,
      link: "/dashboard/notifications",
    }),
  },
  // An upheld report changes what the owner is allowed to have on the site, so
  // it is emailed regardless of preference — a takedown the owner only finds
  // out about by noticing is not an outcome they can respond to.
  listing_upheld_report: {
    group: PREF_GROUPS.ACCOUNT,
    critical: true,
    build: ({ listing, resolution, takedown }) => ({
      title: takedown ? "Your listing was removed" : "Your listing needs attention",
      body: `“${listing.title}”: ${resolution || "it was reported by users and found to breach our rules"}.`,
      link: takedown ? "/dashboard/listings?status=rejected" : "/dashboard/owner",
    }),
  },
};

/** Whether this account wants outbound mail for this group. */
function wantsEmail(user, event) {
  if (event.critical) return true;
  const prefs = user?.notificationPrefs?.email;
  if (!prefs) return true; // default on
  const value = prefs instanceof Map ? prefs.get(event.group) : prefs[event.group];
  return value !== false;
}

/**
 * Raise a notification for one user across every channel that applies.
 *
 * Never throws: a notification failing must not take down the action that
 * triggered it.
 *
 * @param {string} type  key in EVENTS
 * @param {object} args  { userId, data, channels? }
 * @returns {{ inApp: boolean, email: boolean, sms: boolean }}
 */
export async function dispatch(type, { userId, data = {} } = {}) {
  const event = EVENTS[type];
  const result = { inApp: false, email: false, sms: false };
  if (!event || !userId) return result;

  let content;
  try {
    content = event.build(data);
  } catch (err) {
    console.error(`notification ${type} could not be built:`, err?.message || err);
    return result;
  }

  // In-app always.
  await notifyUser({ user: userId, type, title: content.title, body: content.body, link: content.link });
  result.inApp = true;

  const user = await User.findById(userId).select("email phone notificationPrefs").lean().catch(() => null);
  if (!user) return result;

  if (emailConfigured() && user.email && wantsEmail(user, event)) {
    const delivery = await notify({
      to: user.email,
      channel: "email",
      subject: content.title,
      message: `${content.body}\n\nOpen it here: ${absoluteUrl(content.link)}`,
    });
    result.email = Boolean(delivery.delivered);
  }

  // SMS is reserved for the events that carry money or access, and only once a
  // provider exists.
  if (smsConfigured() && user.phone && event.critical) {
    const delivery = await notify({
      to: user.phone,
      channel: "sms",
      message: `${content.title}: ${content.body}`,
    });
    result.sms = Boolean(delivery.delivered);
  }

  return result;
}

function absoluteUrl(path) {
  const base = process.env.NEXT_PUBLIC_APP_URL || "";
  if (!path) return base;
  return path.startsWith("http") ? path : `${base}${path}`;
}

/** Unread count for a user, used by the bell and the dashboard badge. */
export async function unreadCount(userId) {
  return Notification.countDocuments({ user: userId, read: false });
}
