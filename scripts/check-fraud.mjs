// End-to-end check of commission enforcement and fraud detection (spec Part 24).
// Run against a seeded dev server:  node scripts/check-fraud.mjs http://localhost:3900

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
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* HTML error page */
  }
  return { status: res.status, json, text };
}

function line(label, result, extra = "") {
  const msg = result.json?.error || (result.json?.success ? "ok" : result.text.slice(0, 70));
  console.log(`${label.padEnd(38)} ${String(result.status).padEnd(4)} ${msg}${extra}`);
}

async function loginAs(email) {
  cookie = "";
  const r = await call("/api/auth/login", { method: "POST", body: { email, password: "Demo123!" } });
  if (!r.json?.success) throw new Error(`login failed for ${email}: ${r.json?.error}`);
}

// --- under-reporting on a Model A deal -------------------------------------
await loginAs("jean@demo.local");
const mine = await call("/api/listings/mine");
const active = (mine.json?.data?.listings || []).find((l) => l.status === "active" && l.model === "A");
if (!active) {
  console.log("no active Model A listing owned by jean — run `npm run seed:demo`");
  process.exit(1);
}
console.log(`listing: ${active.title}  listed at ${active.price}`);

// Report it closed at 40% below the listed price — past the 30% tolerance.
const under = Math.round(active.price * 0.6);
const res = await call(`/api/listings/${active.id}/outcome`, {
  method: "POST",
  body: { outcome: "sold", finalAmount: under },
});
line(`report sold at ${under} (−40%)`, res);
if (res.json?.success) {
  const d = res.json.data;
  console.log(`  flags      : ${d.flags.join(" | ") || "none"}`);
  console.log(`  penalties  : ${d.penalties.map((p) => `${p.offenseType} ${p.total} Rwf`).join(", ") || "none"}`);
  console.log(`  commission : ${d.commission ? `${d.commission.total} Rwf due ${new Date(d.commission.dueDate).toDateString()}` : "none"}`);
  console.log(`  reviewFlag : ${d.listing.reviewFlag}`);
}

// --- the penalty must now block a new Model A listing ----------------------
const cat = await call("/api/catalog");
const realEstate = cat.json?.data?.categories?.find((c) => c.slug === "real-estate");
const blocked = await call("/api/listings", {
  method: "POST",
  body: {
    categorySlug: "real-estate",
    subcategoryId: realEstate?.subcategories?.[0]?.id,
    itemType: realEstate?.subcategories?.[0]?.itemTypes?.[0],
    transactionType: "rent",
    quantity: 1,
    price: 2000000,
    durationMonths: 1,
    modelChoice: "A",
    title: "Another exclusive listing attempt",
    location: { country: "Rwanda", province: "City of Kigali", district: "Kicukiro", sector: "Kanombe", area: "Kanombe, Kicukiro" },
    contact: { ownerName: "Jean Bosco", ownerPhone: "+250788100001" },
    images: [{ url: "https://picsum.photos/seed/blk/640/400", publicId: "blk-1" }],
    ownershipProof: [{ publicId: "getownerinfo/proof/blk-1", resourceType: "image" }],
    agreement: { accepted: true, signatoryName: "Jean Bosco", signature: "Jean Bosco" },
    submit: true,
  },
});
line("new Model A listing while in debt", blocked);

// --- duplicate detection ---------------------------------------------------
const stillRef = (await call("/api/listings/mine")).json?.data?.listings?.find((l) => l.status === "active");
// The list payload carries category ids; the detail payload carries the slug,
// which is what a duplicate must match on.
const still = stillRef ? (await call(`/api/listings/${stillRef.id}`)).json?.data?.listing : null;
if (still) {
  const dupCat = cat.json?.data?.categories?.find((c) => c.slug === still.categorySlug);
  const dup = await call("/api/listings", {
    method: "POST",
    body: {
      categorySlug: still.categorySlug,
      subcategoryId: still.subcategoryId || dupCat?.subcategories?.[0]?.id,
      itemType: still.itemType || dupCat?.subcategories?.[0]?.itemTypes?.[0],
      transactionType: still.transactionType,
      quantity: 1,
      price: still.price,
      durationMonths: 1,
      modelChoice: "B",
      title: still.title,
      location: { country: "Rwanda", province: "City of Kigali", district: "Kicukiro", sector: "Kanombe", area: "Kanombe, Kicukiro" },
      contact: { ownerName: "Jean Bosco", ownerPhone: "+250788100001" },
      images: [{ url: "https://picsum.photos/seed/dup/640/400", publicId: "dup-1" }],
      ownershipProof: [{ publicId: "getownerinfo/proof/dup-1", resourceType: "image" }],
      agreement: { accepted: true, signatoryName: "Jean Bosco", signature: "Jean Bosco" },
      submit: true,
    },
  });
  line(`re-post "${still.title.slice(0, 22)}…" (${still.categorySlug})`, dup);
}

// --- the penalty is visible to the owner -----------------------------------
const penalties = await call("/api/penalties/mine");
const rows = penalties.json?.data?.penalties || [];
console.log(`owner sees ${rows.length} penalty row(s): ${rows.map((p) => `${p.offenseType} ${p.total}`).join(", ") || "none"}`);
