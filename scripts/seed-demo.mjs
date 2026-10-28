// Demo data seeder — populates realistic fake users, listings, unlocks, seeker
// requests, commissions and chat so you can click through a populated UI.
//
// Run:  npm run seed:demo        (requires `npm run seed` first for categories)
// Re-running wipes the previous demo data (anything tied to *@demo.local users).
//
// All demo users share the password:  Demo123!
//
// Coverage is deliberate — this seed is what the readiness demo is driven from:
//   - one ACTIVE listing in every main category (token/search/filter testing)
//   - one Model A-qualified real-estate listing and one Model B-only listing
//   - one DRAFT listing that can be reopened, edited and submitted
//   - one admin, one listing manager (with listings actually assigned to them),
//     and a dual-role user who both sells and buys on the same account

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
// Ownership proof is a PRIVATE asset: identifier only, never a public URL.
const proof = (key) => ({ url: "", publicId: `getownerinfo/proof/demo-${key}`, resourceType: "image" });
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

  // Subcategories are needed so every demo listing carries a real
  // category -> subcategory -> itemType chain, like the wizard produces.
  const subcategories = await C("subcategories").find().toArray();
  const subKey = (catSlug, subSlug) => `${catSlug}/${subSlug}`;
  const subBySlug = Object.fromEntries(
    subcategories.map((s) => {
      const cat = categories.find((c) => c._id.equals(s.category));
      return [subKey(cat?.slug, s.slug), s];
    })
  );

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
    // Scope the message wipe to the demo conversations. Deleting the whole
    // messages collection would take real users' chat history with it.
    const oldConversations = await C("conversations").find({ listing: { $in: oldListingIds } }).toArray();
    const oldConversationIds = oldConversations.map((c) => c._id);
    await Promise.all([
      C("listings").deleteMany({ owner: { $in: oldIds } }),
      C("payments").deleteMany({ user: { $in: oldIds } }),
      C("tokenunlocks").deleteMany({ user: { $in: oldIds } }),
      C("commissions").deleteMany({ owner: { $in: oldIds } }),
      C("penalties").deleteMany({ user: { $in: oldIds } }),
      C("seekerrequests").deleteMany({ seeker: { $in: oldIds } }),
      C("seekerunlocks").deleteMany({ viewer: { $in: oldIds } }),
      C("favorites").deleteMany({ user: { $in: oldIds } }),
      C("messages").deleteMany({ conversation: { $in: oldConversationIds } }),
      C("conversations").deleteMany({ listing: { $in: oldListingIds } }),
      C("users").deleteMany({ _id: { $in: oldIds } }),
    ]);
  }

  // --- users ---
  const hash = await bcrypt.hash(PASSWORD, 10);
  const mkUser = (name, email, role, phone) => ({
    name, email, role, phone, passwordHash: hash,
    isVerified: true,
    kyc: { status: "approved", submittedAt: now, reviewedAt: now },
    penaltyBalance: 0, commissionDue: 0,
    isActive: true, isBlacklisted: false, createdAt: now, updatedAt: now,
  });

  // owners[0] is the dual-role demo account: it sells AND buys (favorites,
  // unlocks and a seeker request below all belong to it).
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
  const admin = mkUser("Demo Admin", "admin@demo.local", "admin", "+250788400001");

  const ownerIds = (await C("users").insertMany(owners)).insertedIds;
  const buyerIds = (await C("users").insertMany(buyers)).insertedIds;
  const managerId = (await C("users").insertOne(manager)).insertedId;
  await C("users").insertOne(admin);

  // --- listings ---
  // `key` is used instead of array indexes so unlocks/commissions below stay
  // correct when listings are added or reordered.
  const defs = [
    // Model A-qualified real estate (rent >= 1.5M threshold, single unit).
    {
      key: "re-apartment", o: 0, cat: "real-estate", sub: "residential", item: "Apartment",
      txn: "rent", price: 1_800_000, qty: 1, months: 3, status: "active", managed: true,
      title: "Modern 3-bedroom apartment in Kimironko", area: "Kimironko, Gasabo",
      attributes: {
        bedrooms: 3, bathrooms: 2, toilets: 2, floor: 2, sizeSqm: 140,
        propertyUse: "residential", furnishing: "part_furnished", parking: "2 spaces",
        availability: "Available now", leaseTerm: "12 months",
        amenities: ["Water tank", "Internet", "24/7 security"],
        specialFeatures: "Balcony with city view",
      },
    },
    {
      key: "re-house", o: 0, cat: "real-estate", sub: "residential", item: "House",
      txn: "sale", price: 75_000_000, qty: 1, months: 6, status: "pending_approval", managed: true,
      title: "4-bedroom house with garden, Nyarutarama", area: "Nyarutarama, Gasabo",
      attributes: {
        bedrooms: 4, bathrooms: 3, toilets: 4, sizeSqm: 320,
        propertyUse: "residential", furnishing: "unfurnished", parking: "4 spaces",
        availability: "Available now", amenities: ["Garden", "Borehole"],
        specialFeatures: "Standby generator",
      },
    },
    {
      key: "re-studio", o: 1, cat: "real-estate", sub: "residential", item: "Studio",
      txn: "rent", price: 800_000, qty: 1, months: 1, status: "active",
      title: "Cozy studio near downtown", area: "Nyamirambo, Nyarugenge",
      attributes: {
        bedrooms: 1, bathrooms: 1, toilets: 1, sizeSqm: 45,
        propertyUse: "residential", furnishing: "furnished",
        availability: "Available now", leaseTerm: "6 months",
        amenities: ["Water", "Internet"],
      },
    },
    // The DRAFT deliverable: reopened, completed and submitted during the demo.
    {
      key: "re-plot-draft", o: 0, cat: "real-estate", sub: "land", item: "Residential Plot",
      txn: "sale", price: 25_000_000, qty: 1, months: 1, status: "draft",
      title: "Residential plot in Kanombe (draft)", area: "Kanombe, Kicukiro",
      attributes: { sizeSqm: 600, propertyUse: "residential" },
    },
    {
      key: "veh-prado", o: 1, cat: "vehicles", sub: "cars", item: "SUV",
      txn: "sale", price: 18_000_000, qty: 1, months: 1, status: "sold",
      title: "Toyota Land Cruiser Prado 2018", area: "Kicukiro",
    },
    {
      key: "veh-vitz", o: 2, cat: "vehicles", sub: "cars", item: "Hatchback",
      txn: "sale", price: 6_500_000, qty: 1, months: 2, status: "active",
      title: "Toyota Vitz 2015, clean", area: "Remera, Gasabo",
    },
    {
      key: "app-fridge", o: 2, cat: "home-appliances", sub: "kitchen", item: "Fridge",
      txn: "sale", price: 450_000, qty: 1, months: 1, status: "active",
      title: "LG double-door fridge, barely used", area: "Kacyiru",
    },
    // Furniture at the 3M threshold -> Model A eligible.
    {
      key: "fur-desk", o: 0, cat: "home-office-furniture", sub: "office-furniture", item: "Desk",
      txn: "sale", price: 3_500_000, qty: 1, months: 1, status: "active", managed: true,
      title: "Executive office desk set", area: "Kigali Heights",
    },
    {
      key: "biz-restaurant", o: 1, cat: "business-industry", sub: "business-sale", item: "Running Business",
      txn: "sale", price: 12_000_000, qty: 1, months: 3, status: "active",
      title: "Running restaurant for sale", area: "Kimihurura",
    },
    // Model B-ONLY deliverable: resellers are forced to Model B by category rule.
    {
      key: "res-fleet", o: 2, cat: "vehicle-resellers", sub: "dealership", item: "Mixed Fleet",
      txn: "sale", price: 9_000_000, qty: 5, months: 12, status: "active",
      title: "Mixed car fleet (5 units)", area: "Gikondo",
    },
    {
      key: "mir-dining", o: 0, cat: "made-in-rwanda", sub: "crafts", item: "Furniture",
      txn: "sale", price: 1_200_000, qty: 1, months: 1, status: "active",
      title: "Handcrafted dining set", area: "Nyabugogo",
    },
  ];

  const listingDocs = defs.map((d, i) => {
    const cat = catBySlug[d.cat];
    if (!cat) throw new Error(`Unknown category slug in demo defs: ${d.cat}`);
    const sub = subBySlug[subKey(d.cat, d.sub)];
    if (!sub) throw new Error(`Unknown subcategory ${d.cat}/${d.sub} — re-run "npm run seed"`);
    if (!sub.itemTypes.includes(d.item)) {
      throw new Error(`Item type "${d.item}" is not valid for ${d.cat}/${d.sub}`);
    }

    const decision = evaluateModel(cat.modelRule, { transactionType: d.txn, quantity: d.qty, price: d.price });
    const months = d.months || 1;
    let listingFee = null;
    if (decision.model === "B") {
      const f = computeListingFee({
        baseMonthlyFee: cat.listingFeeMonthly,
        months,
        vatRate: settings.vatRate,
        durationDiscounts: settings.durationDiscounts,
      });
      listingFee = { total: f.total, vatPortion: f.vatPortion, discountRate: f.discountRate, months };
    }

    const isDraft = d.status === "draft";
    return {
      owner: ownerIds[d.o],
      // Assigned listings are what the Listing Manager dashboard is scoped to.
      assignedManager: d.managed ? managerId : null,
      category: cat._id,
      subcategory: sub._id,
      itemType: d.item,
      attributes: d.attributes || {},
      transactionType: d.txn,
      ownerType: "owner",
      quantity: d.qty,
      price: d.price,
      location: {
        country: "Rwanda",
        area: d.area,
        upi: `1/0${i}/0${i}/0${i}/${1000 + i}`,
        street: `KK ${i + 1} Ave`,
        houseNumber: `${i + 2}`,
      },
      contact: {
        ownerName: owners[d.o].name,
        ownerPhone: owners[d.o].phone,
        keysManagerName: i % 2 === 0 ? "Keys Manager" : undefined,
        keysManagerPhone: i % 2 === 0 ? "+250788500000" : undefined,
      },
      model: decision.model,
      eligibleForA: decision.eligibleForA,
      modelReason: decision.reason,
      durationMonths: months,
      expiresAt: daysFromNow(months * 30),
      title: d.title,
      description: `${d.title}. Great condition, ready now. Contact unlocks after the token fee.`,
      features: ["Verified owner", "Available now"],
      // A draft is deliberately incomplete: no images, no proof yet. That is
      // what the owner fills in when they reopen it.
      images: isDraft ? [] : [img(i, 1), img(i, 2), img(i, 3)],
      ownershipProof: isDraft ? [] : [proof(d.key)],
      listingFee,
      paymentStatus: decision.model === "B" ? (isDraft ? "not_required" : "paid") : "not_required",
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
  const insertedListingIds = (await C("listings").insertMany(listingDocs)).insertedIds;
  // key -> { id, doc } so the rest of the seed never depends on array order.
  const byKey = Object.fromEntries(
    defs.map((d, i) => [d.key, { id: insertedListingIds[i], doc: listingDocs[i] }])
  );

  // --- token unlocks (buyer pays -> reveal) ---
  async function unlock(buyer, listingKey, tier) {
    const { id: listingId, doc: listing } = byKey[listingKey];
    const cat = categories.find((c) => c._id.equals(listing.category));
    const amount = cat.tokenFee?.[tier] ?? 5000;
    const payment = (await C("payments").insertOne({
      user: buyer.id, listing: listingId, type: "token_fee",
      amount, vatPortion: Math.round(amount - amount / 1.18), tier, status: "paid",
      provider: "stub", providerRef: `stub_demo_${buyer.id}_${listingKey}`,
      createdAt: now, updatedAt: now,
    })).insertedId;
    await C("tokenunlocks").insertOne({
      user: buyer.id, listing: listingId, owner: listing.owner, payment,
      tier, amountPaid: amount,
      fieldsUnlocked: ["ownerName", "ownerPhone", "keysManagerName", "keysManagerPhone", "thirdPartyContact", "exactLocation"],
      watermark: `${buyer.name} · ${buyer.id.toString().slice(-6)}`, at: now,
    });
    await C("listings").updateOne(
      { _id: listingId },
      { $set: { underNegotiation: true, firstUnlockAt: now }, $inc: { unlockCount: 1 } }
    );
  }

  const claudine = { id: buyerIds[0], name: buyers[0].name };
  const patrick = { id: buyerIds[1], name: buyers[1].name };
  const diane = { id: buyerIds[2], name: buyers[2].name };
  // Jean is an owner who also buys — the single-account deliverable.
  const jeanAsBuyer = { id: ownerIds[0], name: owners[0].name };

  await unlock(claudine, "re-apartment", "tenant");
  await unlock(patrick, "re-apartment", "buyer");
  await unlock(claudine, "fur-desk", "buyer");
  await unlock(jeanAsBuyer, "veh-vitz", "buyer");

  // --- saved listings (buyer/tenant workspace) ---
  await C("favorites").insertMany([
    { user: claudine.id, listing: byKey["re-studio"].id, createdAt: now, updatedAt: now },
    { user: claudine.id, listing: byKey["app-fridge"].id, createdAt: now, updatedAt: now },
    { user: patrick.id, listing: byKey["veh-vitz"].id, createdAt: now, updatedAt: now },
    { user: jeanAsBuyer.id, listing: byKey["biz-restaurant"].id, createdAt: now, updatedAt: now },
  ]);

  // --- commission for the sold Model A listing ---
  const sold = byKey["veh-prado"];
  const soldCat = categories.find((c) => c._id.equals(sold.doc.category));
  const calc = computeCommission({
    amount: sold.doc.finalAmount,
    commissionPercent: soldCat.commissionPercent,
    vatRate: settings.vatRate,
  });
  await C("commissions").insertOne({
    listing: sold.id, owner: sold.doc.owner, dealOutcome: "sold", finalAmount: sold.doc.finalAmount,
    commissionPercent: calc.commissionPercent, total: calc.total, vatPortion: calc.vatPortion,
    status: "invoiced", dueDate: daysFromNow(7), payment: null, paidAt: null,
    createdAt: now, updatedAt: now,
  });
  await C("users").updateOne({ _id: sold.doc.owner }, { $inc: { commissionDue: calc.total } });

  // --- seeker requests ---
  const seekerDefs = [
    { user: claudine, cat: "real-estate", min: 700_000, max: 1_200_000, loc: "Kicukiro", details: "Looking for a 2-bedroom apartment to rent, ready by next month." },
    { user: patrick, cat: "vehicles", min: 5_000_000, max: 8_000_000, loc: "Kigali", details: "Want a fuel-efficient sedan, 2014 or newer, low mileage." },
    { user: diane, cat: "home-appliances", min: 200_000, max: 600_000, loc: "Gasabo", details: "Need a front-load washing machine in good condition." },
    // Same account as an owner above — proves one account posts requests too.
    { user: jeanAsBuyer, cat: "home-office-furniture", min: 400_000, max: 900_000, loc: "Gasabo", details: "Looking for 6 office chairs for a small startup office." },
  ];
  for (const s of seekerDefs) {
    await C("seekerrequests").insertOne({
      seeker: s.user.id, category: catBySlug[s.cat]._id, budgetMin: s.min, budgetMax: s.max,
      preferredLocation: s.loc, details: s.details, validityDays: 30, expiresAt: daysFromNow(30),
      contact: { name: s.user.name, phone: "+250788200000", preferredContactTime: "Weekdays after 5pm" },
      status: "active", postPayment: null, unlockCount: 0, createdAt: now, updatedAt: now,
    });
  }

  // --- a conversation with a blocked message (pre-unlock contact-sharing attempt) ---
  const studio = byKey["re-studio"];
  const convo = (await C("conversations").insertOne({
    listing: studio.id, buyer: diane.id, owner: studio.doc.owner,
    lastMessageAt: now, lastMessagePreview: "Is it still available?",
    createdAt: now, updatedAt: now,
  })).insertedId;
  await C("messages").insertMany([
    { conversation: convo, sender: diane.id, senderSide: "buyer", body: "Hi! Is the studio still available?", blocked: false, blockedReasons: [], onBehalfBy: null, createdAt: now, updatedAt: now },
    { conversation: convo, sender: studio.doc.owner, senderSide: "owner", body: "Yes, it is. When would you like to view it?", blocked: false, blockedReasons: [], onBehalfBy: null, createdAt: now, updatedAt: now },
    { conversation: convo, sender: diane.id, senderSide: "buyer", body: "Call me on 0788 111 222", blocked: true, blockedReasons: ["phone"], onBehalfBy: null, createdAt: now, updatedAt: now },
  ]);

  // --- summary ---
  const activeByCat = {};
  for (const [i, d] of defs.entries()) {
    if (listingDocs[i].status === "active") activeByCat[d.cat] = (activeByCat[d.cat] || 0) + 1;
  }
  const activeTotal = Object.values(activeByCat).reduce((a, b) => a + b, 0);
  const missingActive = categories.filter((c) => !activeByCat[c.slug]).map((c) => c.slug);

  console.log("\n  Demo data seeded.\n");
  console.log(`  Accounts (password: ${PASSWORD})`);
  console.log("    admin@demo.local       admin");
  console.log("    manager@demo.local     listing manager (3 listings assigned)");
  console.log("    jean@demo.local        owner + buyer on one account");
  console.log("    aline@demo.local       owner");
  console.log("    eric@demo.local        owner");
  console.log("    claudine@demo.local    buyer/tenant (2 unlocks, 2 saved)");
  console.log("    patrick@demo.local     buyer");
  console.log("    diane@demo.local       buyer (blocked chat message)");
  console.log(`\n  ${listingDocs.length} listings: ${activeTotal} active, 1 draft, 1 pending approval, 1 sold`);
  console.log(`  Model A-qualified real estate: "${byKey["re-apartment"].doc.title}" (Model ${byKey["re-apartment"].doc.model})`);
  console.log(`  Model B-only listing: "${byKey["res-fleet"].doc.title}" (Model ${byKey["res-fleet"].doc.model})`);
  console.log(`  Draft to reopen: "${byKey["re-plot-draft"].doc.title}"`);
  console.log("  4 token unlocks, 1 commission invoice, 4 seeker requests, 4 saved listings");
  if (missingActive.length) {
    console.log(`\n  WARNING: no active listing for category: ${missingActive.join(", ")}`);
  } else {
    console.log("\n  Every category has at least one active listing.");
  }
  console.log("");

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Demo seed failed:", err);
  process.exit(1);
});
