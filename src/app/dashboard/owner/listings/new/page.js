"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const STEPS = ["Category", "Details", "Location & contact", "Content", "Review"];

function money(n) {
  return n == null ? "—" : new Intl.NumberFormat("en-RW").format(n) + " Rwf";
}

async function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export default function NewListingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [catalog, setCatalog] = useState([]);
  const [decision, setDecision] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    categorySlug: "",
    subcategoryId: "",
    itemType: "",
    transactionType: "sale",
    ownerType: "owner",
    representative: { name: "", phone: "", relationship: "" },
    quantity: 1,
    price: 0,
    durationMonths: 1,
    location: { area: "", upi: "", street: "", houseNumber: "" },
    contact: { ownerName: "", ownerPhone: "", keysManagerName: "", keysManagerPhone: "", thirdPartyContact: "" },
    title: "",
    description: "",
    features: [],
    images: [],
    ownershipProof: [],
  });

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  useEffect(() => {
    fetch("/api/catalog")
      .then((r) => r.json())
      .then((j) => setCatalog(j.data?.categories || []));
  }, []);

  const category = useMemo(
    () => catalog.find((c) => c.slug === form.categorySlug),
    [catalog, form.categorySlug]
  );
  const subcategory = useMemo(
    () => category?.subcategories.find((s) => s.id === form.subcategoryId),
    [category, form.subcategoryId]
  );

  // Live Model A/B preview whenever inputs that affect it change.
  useEffect(() => {
    if (!form.categorySlug || !form.price) {
      setDecision(null);
      return;
    }
    const ctrl = new AbortController();
    fetch("/api/eligibility", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: ctrl.signal,
      body: JSON.stringify({
        categorySlug: form.categorySlug,
        transactionType: form.transactionType,
        quantity: Number(form.quantity),
        price: Number(form.price),
        months: Number(form.durationMonths),
      }),
    })
      .then((r) => r.json())
      .then((j) => setDecision(j.data || null))
      .catch(() => {});
    return () => ctrl.abort();
  }, [form.categorySlug, form.transactionType, form.quantity, form.price, form.durationMonths]);

  async function handleUpload(e, kind) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    setError("");
    try {
      const uploaded = [];
      for (const file of files) {
        const dataUrl = await fileToDataUrl(file);
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file: dataUrl, kind }),
        });
        const j = await res.json();
        if (!j.success) throw new Error(j.error);
        uploaded.push({ url: j.data.url, publicId: j.data.publicId });
      }
      if (kind === "image") set({ images: [...form.images, ...uploaded] });
      else set({ ownershipProof: [...form.ownershipProof, ...uploaded] });
    } catch (err) {
      setError(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  }

  async function submit(asDraft) {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          quantity: Number(form.quantity),
          price: Number(form.price),
          durationMonths: Number(form.durationMonths),
          subcategoryId: form.subcategoryId || undefined,
          submit: !asDraft,
        }),
      });
      const j = await res.json();
      if (!j.success) {
        const detail = j.issues ? Object.entries(j.issues).map(([k, v]) => `${k}: ${v}`).join("; ") : j.error;
        throw new Error(detail);
      }
      router.push("/dashboard/owner");
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const canNext = [
    form.categorySlug && form.transactionType, // step 0
    form.price > 0 && form.quantity > 0 && form.durationMonths > 0, // step 1
    form.contact.ownerName && form.contact.ownerPhone, // step 2
    form.title.length >= 3, // step 3
    true, // step 4
  ][step];

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900">Create a listing</h1>

      {/* stepper */}
      <ol className="mt-4 flex flex-wrap gap-2 text-xs">
        {STEPS.map((s, i) => (
          <li
            key={s}
            className={`rounded-full px-3 py-1 ${
              i === step ? "bg-brand text-white" : i < step ? "bg-brand/10 text-brand" : "bg-slate-100 text-slate-500"
            }`}
          >
            {i + 1}. {s}
          </li>
        ))}
      </ol>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-5 card space-y-4">
        {step === 0 && (
          <>
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.categorySlug}
                onChange={(e) => set({ categorySlug: e.target.value, subcategoryId: "", itemType: "", transactionType: "sale" })}>
                <option value="">Select…</option>
                {catalog.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
            </div>
            {category && (
              <>
                <div>
                  <label className="label">Subcategory</label>
                  <select className="input" value={form.subcategoryId}
                    onChange={(e) => set({ subcategoryId: e.target.value, itemType: "" })}>
                    <option value="">Select…</option>
                    {category.subcategories.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                {subcategory && (
                  <div>
                    <label className="label">Item type</label>
                    <select className="input" value={form.itemType} onChange={(e) => set({ itemType: e.target.value })}>
                      <option value="">Select…</option>
                      {subcategory.itemTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label className="label">Transaction type</label>
                  <select className="input" value={form.transactionType} onChange={(e) => set({ transactionType: e.target.value })}>
                    {category.transactionTypes.map((t) => (
                      <option key={t} value={t}>{t === "rent" ? "For rent" : "For sale"}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </>
        )}

        {step === 1 && (
          <>
            <div>
              <label className="label">You are the…</label>
              <select className="input" value={form.ownerType} onChange={(e) => set({ ownerType: e.target.value })}>
                <option value="owner">Owner</option>
                <option value="manager">Manager</option>
                <option value="third_party">Third party</option>
              </select>
            </div>
            {form.ownerType !== "owner" && (
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Representative name</label>
                  <input className="input" value={form.representative.name}
                    onChange={(e) => set({ representative: { ...form.representative, name: e.target.value } })} /></div>
                <div><label className="label">Representative phone</label>
                  <input className="input" value={form.representative.phone}
                    onChange={(e) => set({ representative: { ...form.representative, phone: e.target.value } })} /></div>
              </div>
            )}
            <div className="grid grid-cols-3 gap-3">
              <div><label className="label">Quantity / units</label>
                <input type="number" min="1" className="input" value={form.quantity} onChange={(e) => set({ quantity: e.target.value })} /></div>
              <div><label className="label">Price (Rwf)</label>
                <input type="number" min="0" className="input" value={form.price} onChange={(e) => set({ price: e.target.value })} /></div>
              <div><label className="label">Duration (months)</label>
                <select className="input" value={form.durationMonths} onChange={(e) => set({ durationMonths: e.target.value })}>
                  {[1, 2, 3, 6, 12].map((m) => <option key={m} value={m}>{m}</option>)}
                </select></div>
            </div>

            {decision && (
              <div className={`rounded-lg p-3 text-sm ${decision.decision.model === "A" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>
                <strong>Model {decision.decision.model}</strong> — {decision.decision.reason}
                {decision.listingFee && (
                  <div className="mt-1">Listing fee: <strong>{money(decision.listingFee.total)}</strong> (incl. VAT {money(decision.listingFee.vatPortion)})</div>
                )}
              </div>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <p className="text-xs text-slate-500">Exact location and contact stay hidden until a buyer pays the token fee.</p>
            <div><label className="label">Public area (shown to everyone)</label>
              <input className="input" placeholder="e.g. Kicukiro, Kigali" value={form.location.area}
                onChange={(e) => set({ location: { ...form.location, area: e.target.value } })} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="label">UPI</label>
                <input className="input" value={form.location.upi} onChange={(e) => set({ location: { ...form.location, upi: e.target.value } })} /></div>
              <div><label className="label">Street</label>
                <input className="input" value={form.location.street} onChange={(e) => set({ location: { ...form.location, street: e.target.value } })} /></div>
              <div><label className="label">House no.</label>
                <input className="input" value={form.location.houseNumber} onChange={(e) => set({ location: { ...form.location, houseNumber: e.target.value } })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Owner name *</label>
                <input className="input" value={form.contact.ownerName} onChange={(e) => set({ contact: { ...form.contact, ownerName: e.target.value } })} /></div>
              <div><label className="label">Owner phone *</label>
                <input className="input" value={form.contact.ownerPhone} onChange={(e) => set({ contact: { ...form.contact, ownerPhone: e.target.value } })} /></div>
              <div><label className="label">Keys manager name</label>
                <input className="input" value={form.contact.keysManagerName} onChange={(e) => set({ contact: { ...form.contact, keysManagerName: e.target.value } })} /></div>
              <div><label className="label">Keys manager phone</label>
                <input className="input" value={form.contact.keysManagerPhone} onChange={(e) => set({ contact: { ...form.contact, keysManagerPhone: e.target.value } })} /></div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div><label className="label">Title *</label>
              <input className="input" value={form.title} onChange={(e) => set({ title: e.target.value })} /></div>
            <div><label className="label">Description</label>
              <textarea className="input" rows={4} value={form.description} onChange={(e) => set({ description: e.target.value })} /></div>
            <div><label className="label">Features (comma-separated)</label>
              <input className="input" value={form.features.join(", ")}
                onChange={(e) => set({ features: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} /></div>
            <div>
              <label className="label">Images</label>
              <input type="file" accept="image/*" multiple onChange={(e) => handleUpload(e, "image")} />
              <div className="mt-2 flex flex-wrap gap-2">
                {form.images.map((m) => <img key={m.publicId} src={m.url} alt="" className="h-16 w-16 rounded object-cover" />)}
              </div>
            </div>
            <div>
              <label className="label">Ownership proof (admin-only)</label>
              <input type="file" accept="image/*,application/pdf" multiple onChange={(e) => handleUpload(e, "proof")} />
              <p className="mt-1 text-xs text-slate-500">{form.ownershipProof.length} file(s) attached.</p>
            </div>
            {uploading && <p className="text-sm text-slate-500">Uploading…</p>}
          </>
        )}

        {step === 4 && (
          <div className="space-y-2 text-sm">
            <Row k="Title" v={form.title} />
            <Row k="Category" v={category?.name} />
            <Row k="Transaction" v={form.transactionType} />
            <Row k="Price" v={money(Number(form.price))} />
            <Row k="Quantity" v={form.quantity} />
            <Row k="Duration" v={`${form.durationMonths} month(s)`} />
            <Row k="Model" v={decision ? `Model ${decision.decision.model}` : "—"} />
            {decision?.listingFee && <Row k="Listing fee" v={`${money(decision.listingFee.total)} (Model B, payable)`} />}
            <Row k="Images" v={`${form.images.length}`} />
            <Row k="Ownership proof" v={`${form.ownershipProof.length}`} />
            <p className="pt-2 text-xs text-slate-500">
              Submitting sends the listing for admin verification (status: pending approval).
              {decision?.decision.model === "B" && " Model B listings require payment before activation (next phase)."}
            </p>
          </div>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between">
        <button className="btn-outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>Back</button>
        <div className="flex gap-2">
          {step < STEPS.length - 1 ? (
            <button className="btn-primary" disabled={!canNext} onClick={() => setStep((s) => s + 1)}>Next</button>
          ) : (
            <>
              <button className="btn-outline" disabled={submitting} onClick={() => submit(true)}>Save draft</button>
              <button className="btn-primary" disabled={submitting} onClick={() => submit(false)}>
                {submitting ? "Submitting…" : "Submit for approval"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex justify-between border-b border-slate-100 py-1">
      <span className="text-slate-500">{k}</span>
      <span className="font-medium text-slate-900">{v ?? "—"}</span>
    </div>
  );
}
