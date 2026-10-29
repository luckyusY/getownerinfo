// Throwaway end-to-end check of the agreement gate on draft submission.
// Run against a dev server:  node scripts/check-agreement.mjs http://localhost:3500

const base = process.argv[2] || "http://localhost:3500";
let cookie = "";

async function call(path, { method = "GET", body } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: { "Content-Type": "application/json", ...(cookie ? { cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) cookie = setCookie.split(";")[0];
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* non-JSON (an HTML error page) */
  }
  return { status: res.status, json, text };
}

function line(label, result) {
  const issues = result.json?.issues ? ` ${JSON.stringify(result.json.issues)}` : "";
  const msg = (result.json?.error || (result.json?.success ? "ok" : result.text.slice(0, 80))) + issues;
  console.log(`${label.padEnd(34)} ${String(result.status).padEnd(4)} ${msg}`);
}

const login = await call("/api/auth/login", {
  method: "POST",
  body: { email: "jean@demo.local", password: "Demo123!" },
});
line("login", login);
if (!login.json?.success) process.exit(1);

const mine = await call("/api/listings/mine");
const draft = mine.json?.data?.listings?.find((l) => l.status === "draft");
if (!draft) {
  console.log("no draft listing found — run `npm run seed:demo` first");
  process.exit(1);
}
console.log(`draft: ${draft.title} (${draft.id})`);

const full = await call(`/api/listings/${draft.id}`);
const l = full.json.data.listing;
const payload = {
  categorySlug: l.categorySlug,
  subcategoryId: l.subcategoryId,
  itemType: l.itemType,
  transactionType: l.transactionType,
  quantity: l.quantity,
  price: l.price,
  durationMonths: l.durationMonths,
  // Real estate needs a valid province/district/sector triple.
  location: {
    ...Object.fromEntries(Object.entries(l.location).filter(([, v]) => v)),
    country: "Rwanda",
    province: "City of Kigali",
    district: "Kicukiro",
    sector: "Kanombe",
    area: "Kanombe, Kicukiro",
  },
  contact: Object.fromEntries(Object.entries(l.contact).filter(([, v]) => v)),
  title: l.title,
  images: [{ url: "https://picsum.photos/seed/agr/640/400", publicId: "agr-1" }],
  ownershipProof: [{ publicId: "getownerinfo/proof/agr-1", resourceType: "image" }],
  submit: true,
};

line("submit without agreement", await call(`/api/listings/${draft.id}`, { method: "PATCH", body: payload }));

line(
  "submit unaccepted",
  await call(`/api/listings/${draft.id}`, {
    method: "PATCH",
    body: { ...payload, agreement: { accepted: false, signatoryName: "Jean Bosco", signature: "Jean Bosco" } },
  })
);

line(
  "submit signature mismatch",
  await call(`/api/listings/${draft.id}`, {
    method: "PATCH",
    body: { ...payload, agreement: { accepted: true, signatoryName: "Jean Bosco", signature: "Someone Else" } },
  })
);

const good = await call(`/api/listings/${draft.id}`, {
  method: "PATCH",
  body: { ...payload, agreement: { accepted: true, signatoryName: "Jean Bosco", signature: "jean  bosco" } },
});
line("submit signed (case/space tolerant)", good);
if (good.json?.success) {
  const d = good.json.data;
  console.log(`  -> ${d.needsPayment ? `checkout required, payment ${d.paymentId}` : `status ${d.listing?.status}`}`);
}
