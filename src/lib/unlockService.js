import Listing from "@/models/Listing";
import TokenUnlock from "@/models/TokenUnlock";
import { audit } from "@/models/AuditLog";
import { notifyUser } from "@/models/Notification";
import { PAYMENT_STATUS } from "@/lib/constants";

// Fields a token unlock reveals (spec). National ID / ownership docs are NEVER here.
export const UNLOCKED_FIELDS = [
  "ownerName",
  "ownerPhone",
  "keysManagerName",
  "keysManagerPhone",
  "thirdPartyContact",
  "exactLocation",
];

/**
 * Finalize an unlock after a verified payment. Idempotent: if a TokenUnlock
 * already exists for (user, listing) it is returned without double-charging.
 */
export async function finalizeUnlock({ payment, listing, user }) {
  payment.status = PAYMENT_STATUS.PAID;
  await payment.save();

  let unlock = await TokenUnlock.findOne({ user: user._id, listing: listing._id });
  if (!unlock) {
    const watermark = `${user.name} · ${user._id.toString().slice(-6)}`;
    unlock = await TokenUnlock.create({
      user: user._id,
      listing: listing._id,
      owner: listing.owner,
      payment: payment._id,
      tier: payment.tier,
      amountPaid: payment.amount,
      fieldsUnlocked: UNLOCKED_FIELDS,
      watermark,
    });

    // Mark the listing as under negotiation (flag only — stays browsable).
    const update = { $inc: { unlockCount: 1 }, $set: { underNegotiation: true } };
    if (!listing.firstUnlockAt) update.$set.firstUnlockAt = new Date();
    await Listing.updateOne({ _id: listing._id }, update);

    await audit({
      actor: user._id,
      actorRole: "buyer",
      action: "listing.unlock",
      targetType: "Listing",
      targetId: listing._id,
      meta: { paymentId: payment._id.toString(), tier: payment.tier, amount: payment.amount },
    });

    await notifyUser({
      user: listing.owner,
      type: "unlock",
      title: "A buyer unlocked your contact",
      body: `${user.name} unlocked “${listing.title}”.`,
      link: `/listings/${listing._id.toString()}`,
    });
  }
  return unlock;
}

/** Build the revealed contact + exact location payload, stamped with a watermark. */
export function buildRevealedContact(listing, watermark) {
  return {
    watermark,
    contact: {
      ownerName: listing.contact?.ownerName,
      ownerPhone: listing.contact?.ownerPhone,
      keysManagerName: listing.contact?.keysManagerName,
      keysManagerPhone: listing.contact?.keysManagerPhone,
      thirdPartyContact: listing.contact?.thirdPartyContact,
    },
    exactLocation: {
      area: listing.location?.area,
      upi: listing.location?.upi,
      street: listing.location?.street,
      houseNumber: listing.location?.houseNumber,
      mapsPin: listing.location?.mapsPin,
    },
  };
}
