// End-to-end check of notification coverage (spec Part 28).
// Run against a seeded dev server:  node scripts/check-notifications.mjs http://localhost:3900

const base = process.argv[2] || "http://localhost:3900";
let cookie = "";

async function call(path, { method = "GET", body } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: { "Content-Type": "application/json", ...(cookie ? { cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });
  const set = res.headers.get("set-cookie");
  if (set) cookie = set.split(";")[0];
  const text = await res.text();
  try {
    return { status: res.status, json: JSON.parse(text) };
  } catch {
    return { status: res.status, json: null, text };
  }
}

async function loginAs(email) {
  cookie = "";
  const r = await call("/api/auth/login", { method: "POST", body: { email, password: "Demo123!" } });
  if (!r.json?.success) throw new Error(`login failed for ${email}`);
}

async function notificationsFor(email) {
  await loginAs(email);
  const r = await call("/api/notifications");
  return r.json?.data?.notifications || [];
}

function report(label, before, after) {
  const fresh = after.filter((n) => !before.some((b) => b.id === n.id));
  console.log(`\n${label}`);
  if (!fresh.length) {
    console.log("  (no new notification)");
    return;
  }
  for (const n of fresh) console.log(`  [${n.type}] ${n.title} — ${n.body}`);
}

// --- baseline ---
const jeanBefore = await notificationsFor("jean@demo.local");
const adminBefore = await notificationsFor("admin@demo.local");

// --- 1. submit a listing -> owner is told it is in review ---------------
await loginAs("jean@demo.local");
const cat = await call("/api/catalog");
const re = cat.json?.data?.categories?.find((c) => c.slug === "real-estate");
const created = await call("/api/listings", {
  method: "POST",
  body: {
    categorySlug: "real-estate",
    subcategoryId: re?.subcategories?.[0]?.id,
    itemType: re?.subcategories?.[0]?.itemTypes?.[0],
    transactionType: "rent",
    quantity: 1,
    price: 2400000,
    durationMonths: 1,
    modelChoice: "A",
    title: "Notification probe apartment in Kacyiru",
    location: { country: "Rwanda", province: "City of Kigali", district: "Gasabo", sector: "Kacyiru", area: "Kacyiru, Gasabo" },
    contact: { ownerName: "Jean Bosco", ownerPhone: "+250788100001" },
    images: [{ url: "https://picsum.photos/seed/notif/640/400", publicId: "notif-1" }],
    ownershipProof: [{ publicId: "getownerinfo/proof/notif-1", resourceType: "image" }],
    agreement: { accepted: true, signatoryName: "Jean Bosco", signature: "Jean Bosco" },
    submit: true,
  },
});
const listingId = created.json?.data?.listing?.id || created.json?.data?.listingId;
console.log(`submit listing: ${created.status} ${created.json?.error || "ok"}`);
report("owner after submitting", jeanBefore, await notificationsFor("jean@demo.local"));

// --- 2. admin approves -> owner is told -----------------------------------
if (listingId) {
  await loginAs("admin@demo.local");
  const mod = await call(`/api/listings/${listingId}/moderate`, {
    method: "POST",
    body: { action: "approve" },
  });
  console.log(`\napprove: ${mod.status} ${mod.json?.error || "ok"}`);
  const jeanMid = await notificationsFor("jean@demo.local");
  report("owner after approval", jeanBefore, jeanMid);

  // --- 3. a buyer unlocks -> owner AND buyer are told --------------------
  const claudineBefore = await notificationsFor("claudine@demo.local");
  await loginAs("claudine@demo.local");
  const unlock = await call(`/api/listings/${listingId}/unlock`, {
    method: "POST",
    body: { tier: "tenant" },
  });
  console.log(`\nunlock: ${unlock.status} ${unlock.json?.error || (unlock.json?.data?.needsOtp ? "otp required" : "ok")}`);

  if (unlock.json?.data?.needsOtp && unlock.json.data.devOtp) {
    const v = await call(`/api/payments/${unlock.json.data.paymentId}/verify`, {
      method: "POST",
      body: { otp: unlock.json.data.devOtp },
    });
    console.log(`verify otp: ${v.status} ${v.json?.error || "ok"}`);
  }

  report("buyer after unlocking", claudineBefore, await notificationsFor("claudine@demo.local"));
  report("owner after the unlock", jeanMid, await notificationsFor("jean@demo.local"));
}

// --- 4. preferences round-trip -------------------------------------------
await loginAs("jean@demo.local");
const before = (await call("/api/profile")).json?.data?.emailNotifications;
const off = await call("/api/profile", { method: "PATCH", body: { emailNotifications: { listings: false } } });
const after = off.json?.data?.emailNotifications;
console.log(`\nprefs: listings ${before?.listings} -> ${after?.listings}  (payments stays ${after?.payments})`);
await call("/api/profile", { method: "PATCH", body: { emailNotifications: { listings: true } } });
