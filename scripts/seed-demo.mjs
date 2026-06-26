// Demo data seeder — populates realistic fake users, listings, unlocks, seeker
// requests, commissions and chat so you can click through a populated UI.
//
// Run:  npm run seed:demo        (requires `npm run seed` first for categories)
// Re-running wipes the previous demo data (anything tied to *@demo.local users).
//
// All demo users share the password:  Demo123!

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { evaluateModel } from "../src/lib/eligibility.js";
import { computeListingFee, computeCommission } from "../src/lib/pricing.js";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI not set. Run via `npm run seed:demo`.");
  process.exit(1);
}

const PASSWORD = "Demo123!";
const img = (key, n) => ({ url: `https://picsum.photos/seed/goi-${key}-${n}/640/400`, publicId: `demo-${key}-${n}` });
const now = new Date();
const daysFromNow = (d) => new Date(Date.now() + d * 86400000);

async function main() {
  await mongoose.connect(uri);
  const db = mongoose.connection;
  const C = (name) => db.collection(name);

  // --- categories must already be seeded ---
  const categories = await C("categories").find().toArray();
  if (!categories.length) {
    console.error("No categories found. Run `npm run seed` first.");
    process.exit(1);
  }
  const catBySlug = Object.fromEntries(categories.map((c) => [c.slug, c]));
  const settings = (await C("platformsettings").findOne({ key: "global" })) || {
    vatRate: 0.18,
    durationDiscounts: { 1: 0, 2: 0.2, 3: 0.3, 6: 0.4, 12: 0.5 },
  };

  // --- wipe previous demo data ---
  const oldUsers = await C("users").find({ email: /@demo\.local$/ }).toArray();
  const oldIds = oldUsers.map((u) => u._id);
  if (oldIds.length) {
    const oldListings = await C("listings").find({ owner: { $in: oldIds } }).toArray();
    const oldListingIds = oldListings.map((l) => l._id);
    await Promise.all([
      C("listings").deleteMany({ owner: { $in: oldIds } }),
      C("payments").deleteMany({ user: { $in: oldIds } }),
      C("tokenunlocks").deleteMany({ user: { $in: oldIds } }),
      C("commissions").deleteMany({ owner: { $in: oldIds } }),
      C("penalties").deleteMany({ user: { $in: oldIds } }),
      C("seekerrequests").deleteMany({ seeker: { $in: oldIds } }),
      C("seekerunlocks").deleteMany({ viewer: { $in: oldIds } }),
      C("conversations").deleteMany({ listing: { $in: oldListingIds } }),
      C("messages").deleteMany({}),
      C("users").deleteMany({ _id: { $in: oldIds } }),
    ]);
  }

  // --- users ---
  const hash = await bcrypt.hash(PASSWORD, 10);
  const mkUser = (name, email, role, phone) => ({
    name, email, role, phone, passwordHash: hash,
    isVerified: true, penaltyBalance: 0, commissionDue: 0,
    isActive: true, isBlacklisted: false, createdAt: now, updatedAt: now,
  });

  const owners = [
    mkUser("Jean Bosco", "jean@demo.local", "owner", "+250788100001"),
    mkUser("Aline Uwase", "aline@demo.local", "owner", "+250788100002"),
    mkUser("Eric Mugisha", "eric@demo.local", "owner", "+250788100003"),
  ];
  const buyers = [
    mkUser("Claudine Ingabire", "claudine@demo.local", "buyer", "+250788200001"),
    mkUser("Patrick Niyonzima", "patrick@demo.local", "buyer", "+250788200002"),
    mkUser("Diane Mukamana", "diane@demo.local", "buyer", "+250788200003"),
  ];
  const manager = mkUser("Manager Mike", "manager@demo.local", "platform_listing_manager", "+250788300001");

  const ownerIds = (await C("users").insertMany(owners)).insertedIds;
  const buyerIds = (await C("users").insertMany(buyers)).insertedIds;
  await C("users").insertOne(manager);

  // --- listings ---
  const defs = [
    { o: 0, cat: "real-estate", txn: "rent", price: 1_800_000, qty: 1, title: "Modern 3-bedroom apartment in Kimironko", area: "Kimironko, Gasabo", status: "active" },
    { o: 0, cat: "real-estate", txn: "sale", price: 75_000_000, qty: 1, title: "4-bedroom house with garden, Nyarutarama", area: "Nyarutarama, Gasabo", status: "pending_approval" },
    { o: 1, cat: "real-estate", txn: "rent", price: 800_000, qty: 1, title: "Cozy studio near downtown", area: "Nyamirambo, Nyarugenge", status: "active" },
    { o: 1, cat: "vehicles", txn: "sale", price: 18_000_000, qty: 1, title: "Toyota Land Cruiser Prado 2018", area: "Kicukiro", status: "sold" },
    { o: 2, cat: "vehicles", txn: "sale", price: 6_500_000, qty: 1, title: "Toyota Vitz 2015, clean", area: "Remera, Gasabo", status: "active" },
    { o: 2, cat: "home-appliances", txn: "sale", price: 450_000, qty: 1, title: "LG double-door fridge, barely used", area: "Kacyiru", status: "active" },
    { o: 0, cat: "home-office-furniture", txn: "sale", price: 3_500_000, qty: 1, title: "Executive office desk set", area: "Kigali Heights", status: "active" },
    { o: 1, cat: "business-industry", txn: "sale", price: 12_000_000, qty: 1, title: "Running restaurant for sale", area: "Kimihurura", status: "active" },
    { o: 2, cat: "vehicle-resellers", txn: "sale", price: 9_000_000, qty: 5, title: "Mixed car fleet (5 units)", area: "Gikondo", status: "active" },
    { o: 0, cat: "made-in-rwanda", txn: "sale", price: 1_200_000, qty: 1, title: "Handcrafted dining set", area: "Nyabugogo", status: "active" },
  ];

  const listingDocs = defs.map((d, i) => {
    const cat = catBySlug[d.cat];
    const decision = evaluateModel(cat.modelRule, { transactionType: d.txn, quantity: d.qty, price: d.price });
    let listingFee = null;
    if (decision.model === "B") {
      const f = computeListingFee({ baseMonthlyFee: cat.listingFeeMonthly, months: 1, vatRate: settings.vatRate, durationDiscounts: settings.durationDiscounts });
      listingFee = { total: f.total, vatPortion: f.vatPortion, discountRate: f.discountRate, months: 1 };
    }
    const ownerId = ownerIds[d.o];
    return {
      owner: ownerId,
      category: cat._id,
      itemType: (cat.slug === "vehicles" ? "Sedan" : cat.slug === "real-estate" ? "Apartment" : "Item"),
      transactionType: d.txn,
      ownerType: "owner",
      quantity: d.qty,
      price: d.price,
      location: { area: d.area, upi: `1/0${i}/0${i}/0${i}/${1000 + i}`, street: `KK ${i + 1} Ave`, houseNumber: `${i + 2}` },
      contact: {
        ownerName: owners[d.o].name,
        ownerPhone: owners[d.o].phone,
        keysManagerName: i % 2 === 0 ? "Keys Manager" : undefined,
        keysManagerPhone: i % 2 === 0 ? "+250788500000" : undefined,
      },
      model: decision.model,
      eligibleForA: decision.eligibleForA,
      modelReason: decision.reason,
      durationMonths: 1,
      expiresAt: daysFromNow(30),
      title: d.title,
      description: `${d.title}. Great condition, ready now. Contact unlocks after the token fee.`,
      features: ["Verified owner", "Available now"],
      images: [img(i, 1), img(i, 2), img(i, 3)],
      ownershipProof: [],
      listingFee,
      paymentStatus: decision.model === "B" ? "paid" : "not_required",
      status: d.status,
      underNegotiation: false,
      unlockCount: 0,
      dealOutcome: d.status === "sold" ? "sold" : null,
      finalAmount: d.status === "sold" ? Math.round(d.price * 0.97) : null,
      dealCompletedAt: d.status === "sold" ? now : null,
      reviewFlag: false,
      createdAt: now,
      updatedAt: now,
    };
  });
  const listingIds = (await C("listings").insertMany(listingDocs)).insertedIds;

  // --- token unlocks (buyer pays -> reveal) ---
  async function unlock(buyerIdx, listingIdx, tier) {
    const listing = listingDocs[listingIdx];
    const cat = categories.find((c) => c._id.equals(listing.category));
    const amount = cat.tokenFee?.[tier] ?? 5000;
    const payment = (await C("payments").insertOne({
      user: buyerIds[buyerIdx], listing: listingIds[listingIdx], type: "token_fee",
      amount, vatPortion: Math.round(amount - amount / 1.18), tier, status: "paid",
      provider: "stub", providerRef: `stub_demo_${buyerIdx}_${listingIdx}`, createdAt: now, updatedAt: now,
    })).insertedId;
    await C("tokenunlocks").insertOne({
      user: buyerIds[buyerIdx], listing: listingIds[listingIdx], owner: listing.owner, payment,
      tier, amountPaid: amount,
      fieldsUnlocked: ["ownerName", "ownerPhone", "keysManagerName", "keysManagerPhone", "thirdPartyContact", "exactLocation"],
      watermark: `${buyers[buyerIdx].name} · ${buyerIds[buyerIdx].toString().slice(-6)}`, at: now,
    });
    await C("listings").updateOne({ _id: listingIds[listingIdx] }, { $set: { underNegotiation: true, firstUnlockAt: now }, $inc: { unlockCount: 1 } });
  }
  await unlock(0, 0, "tenant"); // Claudine unlocks apartment
  await unlock(1, 0, "buyer");  // Patrick unlocks apartment
  await unlock(0, 6, "buyer");  // Claudine unlocks office desk

  // --- commission for the sold Model A listing (#3 -> Prado) ---
  const sold = listingDocs[3];
  const soldCat = categories.find((c) => c._id.equals(sold.category));
  const calc = computeCommission({ amount: sold.finalAmount, commissionPercent: soldCat.commissionPercent, vatRate: settings.vatRate });
  await C("commissions").insertOne({
    listing: listingIds[3], owner: ownerIds[1], dealOutcome: "sold", finalAmount: sold.finalAmount,
    commissionPercent: calc.commissionPercent, total: calc.total, vatPortion: calc.vatPortion,
    status: "invoiced", dueDate: daysFromNow(7), payment: null, paidAt: null, createdAt: now, updatedAt: now,
  });
  await C("users").updateOne({ _id: ownerIds[1] }, { $inc: { commissionDue: calc.total } });

  // --- seeker requests ---
  const seekerDefs = [
    { b: 0, cat: "real-estate", min: 700_000, max: 1_200_000, loc: "Kicukiro", details: "Looking for a 2-bedroom apartment to rent, ready by next month." },
    { b: 1, cat: "vehicles", min: 5_000_000, max: 8_000_000, loc: "Kigali", details: "Want a fuel-efficient sedan, 2014 or newer, low mileage." },
    { b: 2, cat: "home-appliances", min: 200_000, max: 600_000, loc: "Gasabo", details: "Need a front-load washing machine in good condition." },
  ];
  for (const s of seekerDefs) {
    await C("seekerrequests").insertOne({
      seeker: buyerIds[s.b], category: catBySlug[s.cat]._id, budgetMin: s.min, budgetMax: s.max,
      preferredLocation: s.loc, details: s.details, validityDays: 30, expiresAt: daysFromNow(30),
      contact: { name: buyers[s.b].name, phone: buyers[s.b].phone, preferredContactTime: "Weekdays after 5pm" },
      status: "active", postPayment: null, unlockCount: 0, createdAt: now, updatedAt: now,
    });
  }

  // --- a conversation with a blocked message (Diane <-> studio owner, pre-unlock) ---
  const convo = (await C("conversations").insertOne({
    listing: listingIds[2], buyer: buyerIds[2], owner: ownerIds[1],
    lastMessageAt: now, lastMessagePreview: "Is it still available?", createdAt: now, updatedAt: now,
  })).insertedId;
  await C("messages").insertMany([
    { conversation: convo, sender: buyerIds[2], senderSide: "buyer", body: "Hi! Is the studio still available?", blocked: false, blockedReasons: [], onBehalfBy: null, createdAt: now, updatedAt: now },
    { conversation: convo, sender: ownerIds[1], senderSide: "owner", body: "Yes, it is. When would you like to view it?", blocked: false, blockedReasons: [], onBehalfBy: null, createdAt: now, updatedAt: now },
    { conversation: convo, sender: buyerIds[2], senderSide: "buyer", body: "Call me on 0788 111 222", blocked: true, blockedReasons: ["phone"], onBehalfBy: null, createdAt: now, updatedAt: now },
  ]);

  console.log("\n  Demo data seeded:");
  console.log(`   - ${owners.length} owners, ${buyers.length} buyers, 1 manager  (password: ${PASSWORD})`);
  console.log(`   - ${listingDocs.length} listings (mix of Model A/B, incl. 1 pending, 1 sold)`);
  console.log(`   - 3 token unlocks, 1 commission, 3 seeker requests, 1 chat with a blocked message`);
  console.log("\n  Log in as e.g.  jean@demo.local  (owner)  or  claudine@demo.local  (buyer)\n");

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Demo seed failed:", err);
  process.exit(1);
});
