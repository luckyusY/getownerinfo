"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import {
  Banknote,
  Boxes,
  CheckCircle2,
  FileCheck2,
  Home,
  ImagePlus,
  ListChecks,
  MapPin,
  Phone,
  ShieldCheck,
  Tags,
  UploadCloud,
  User,
} from "lucide-react";
import {
  FileUploadBox,
  FormField,
  FormSection,
  FormStepper,
  SegmentedControl,
  SelectInput,
  SubmitButton,
  TextareaInput,
  TextInput,
} from "@/components/ui/Form";
import { RWANDA_LOCATIONS } from "@/data/locations";
import administrativeUnits from "@/data/rwandaAdministrativeUnits.json";
import { isValidRwandaPhone } from "@/lib/phone";
import { AGREEMENT_TERMS, AGREEMENT_VERSION } from "@/data/agreementTerms";

const STEPS = [
  { label: "Category", icon: Tags },
  { label: "Details", icon: Banknote },
  { label: "Location", icon: MapPin },
  { label: "Content", icon: ImagePlus },
  { label: "Agreement", icon: FileCheck2 },
  { label: "Review", icon: CheckCircle2 },
];

const EMPTY_FORM = {
  categorySlug: "",
  subcategoryId: "",
  itemType: "",
  transactionType: "sale",
  ownerType: "owner",
  representative: { name: "", phone: "", relationship: "" },
  quantity: 1,
  price: 0,
  durationMonths: 1,
  modelChoice: "",
  location: { country: "Rwanda", province: "", district: "", sector: "", area: "", famousPlace: "", upi: "", street: "", houseNumber: "" },
  contact: { ownerName: "", ownerPhone: "", keysManagerName: "", keysManagerPhone: "", thirdPartyContact: "" },
  title: "",
  description: "",
  attributes: {},
  features: [],
  images: [],
  ownershipProof: [],
  agreement: { accepted: false, signatoryName: "", signature: "" },
};

// Merge a saved listing onto EMPTY_FORM so every input stays controlled even
// when the draft was saved before that field existed.
function hydrateForm(listing) {
  return {
    ...EMPTY_FORM,
    categorySlug: listing.categorySlug || "",
    subcategoryId: listing.subcategoryId || "",
    itemType: listing.itemType || "",
    transactionType: listing.transactionType || "sale",
    ownerType: listing.ownerType || "owner",
    representative: { ...EMPTY_FORM.representative, ...(listing.representative || {}) },
    quantity: listing.quantity ?? 1,
    price: listing.price ?? 0,
    durationMonths: listing.durationMonths ?? 1,
    // Only a listing that qualifies for both models carries a real choice.
    modelChoice: listing.eligibleForA ? listing.model || "" : "",
    location: { ...EMPTY_FORM.location, ...(listing.location || {}) },
    contact: { ...EMPTY_FORM.contact, ...(listing.contact || {}) },
    title: listing.title || "",
    description: listing.description || "",
    attributes: listing.attributes || {},
    features: listing.features || [],
    images: (listing.images || []).filter((m) => m && m.url && m.publicId),
    ownershipProof: listing.ownershipProof || [],
    // Always re-signed: an agreement is signed against the values being
    // submitted now, not the ones saved when the draft was last touched.
    agreement: { accepted: false, signatoryName: "", signature: "" },
  };
}

function money(n) {
  return n == null ? "-" : new Intl.NumberFormat("en-RW").format(n) + " Rwf";
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
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draft");
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [loadingDraft, setLoadingDraft] = useState(Boolean(draftId));
  const [draftStatus, setDraftStatus] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [decision, setDecision] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  // Reopen a saved draft (or a rejected listing the owner is fixing).
  useEffect(() => {
    if (!draftId) return;
    let cancelled = false;
    setLoadingDraft(true);
    fetch(`/api/listings/${draftId}`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        if (!j.success) throw new Error(j.error || "Could not open this draft");
        const listing = j.data?.listing;
        if (!listing) throw new Error("Could not open this draft");
        if (listing.editable === false) {
          throw new Error(`This listing is ${listing.status.replace(/_/g, " ")} and can no longer be edited`);
        }
        setForm(hydrateForm(listing));
        setDraftStatus(listing.status);
      })
      .catch((err) => {
        if (cancelled) return;
        toast(err.message, { type: "error" });
        router.replace("/dashboard/owner");
      })
      .finally(() => {
        if (!cancelled) setLoadingDraft(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftId]);

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
  const selectedProvince = administrativeUnits.provinces.find((p) => p.name === form.location.province);
  const selectedDistrict = selectedProvince?.districts.find((d) => d.name === form.location.district);
  const isRealEstate = form.categorySlug === "real-estate";
  const setAttribute = (key, value) => set({ attributes: { ...form.attributes, [key]: value } });

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
        modelChoice: form.modelChoice || undefined,
      }),
    })
      .then((r) => r.json())
      .then((j) => setDecision(j.data || null))
      .catch(() => {});
    return () => ctrl.abort();
  }, [form.categorySlug, form.transactionType, form.quantity, form.price, form.durationMonths, form.modelChoice]);

  async function handleUpload(e, kind) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
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
      toast(`Upload failed: ${err.message}`, { type: "error" });
    } finally {
      setUploading(false);
    }
  }

  async function submit(asDraft) {
    setSubmitting(true);
    try {
      // Reopened drafts are updated in place so the owner keeps one listing
      // record (and its id) instead of creating a duplicate on each save.
      const res = await fetch(draftId ? `/api/listings/${draftId}` : "/api/listings", {
        method: draftId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          quantity: Number(form.quantity),
          price: Number(form.price),
          durationMonths: Number(form.durationMonths),
          modelChoice: form.modelChoice || undefined,
          subcategoryId: form.subcategoryId || undefined,
          submit: !asDraft,
        }),
      });
      const j = await res.json();
      if (!j.success) {
        const detail = j.issues ? Object.entries(j.issues).map(([k, v]) => `${k}: ${v}`).join("; ") : j.error;
        throw new Error(detail);
      }
      if (j.data?.needsPayment) {
        if (j.data.redirectUrl) {
          window.location.assign(j.data.redirectUrl);
          return;
        }
        throw new Error("Checkout is pending, but the payment provider did not return a checkout link. Contact support before submitting again.");
      }
      toast(asDraft ? "Draft saved" : "Listing submitted for approval", { type: "success" });
      router.push("/dashboard/owner");
      router.refresh();
    } catch (err) {
      toast(err.message, { type: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  const invalidOwnerPhone = Boolean(form.contact.ownerPhone && !isValidRwandaPhone(form.contact.ownerPhone));

  // The typed signature must match the signatory name, exactly as the server
  // re-checks it before recording the agreement.
  const normalizeName = (v) => String(v || "").trim().replace(/\s+/g, " ").toLowerCase();
  const signatureMatches =
    normalizeName(form.agreement.signature) === normalizeName(form.agreement.signatoryName) &&
    normalizeName(form.agreement.signatoryName).length >= 3;
  const agreementSigned = form.agreement.accepted && signatureMatches;
  const agreementModel = decision?.decision?.model === "A" ? "A" : "B";
  const missing = [
    !form.categorySlug && "Category",
    !form.subcategoryId && "Subcategory",
    !form.itemType && "Item type",
    !(form.price > 0) && "Price",
    decision?.decision?.eligibleForA && !form.modelChoice && "Model choice",
    !form.location.area && "Public area",
    !form.contact.ownerName.trim() && "Owner name",
    (!form.contact.ownerPhone || invalidOwnerPhone) && "Valid owner phone",
    form.title.trim().length < 3 && "Title",
    form.images.length === 0 && "Listing image",
    form.ownershipProof.length === 0 && "Ownership/authorization document",
    !agreementSigned && "Signed agreement",
  ].filter(Boolean);
  const requiredCount = 11 + (decision?.decision?.eligibleForA ? 1 : 0);
  const completedCount = requiredCount - missing.length;
  const completionPercent = Math.round((completedCount / requiredCount) * 100);
  const canNext = [
    form.categorySlug && form.transactionType && form.subcategoryId && form.itemType,
    Boolean(decision) && form.price > 0 && form.quantity > 0 && form.durationMonths > 0 && (!decision?.decision?.eligibleForA || Boolean(form.modelChoice)),
    form.location.area && form.contact.ownerName.trim() && form.contact.ownerPhone && !invalidOwnerPhone,
    form.title.trim().length >= 3 && form.images.length > 0 && form.ownershipProof.length > 0,
    agreementSigned,
    true,
  ][step];

  // Hold the form back until the saved answers are in, so the owner never sees
  // an empty wizard that then repopulates under them.
  if (loadingDraft) {
    return (
      <div className="mx-auto max-w-6xl">
        <p className="eyebrow">Owner workspace</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-ink">Opening your draft</h1>
        <p className="mt-1 text-sm text-ink-soft">Loading the answers you saved earlier…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <p className="eyebrow">Owner workspace</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-ink">
          {draftId ? (draftStatus === "rejected" ? "Fix and resubmit listing" : "Continue your draft") : "Create a listing"}
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          {draftId
            ? "Your saved answers are loaded below. Complete what is missing, then submit for approval."
            : "A guided listing flow with private owner details, document proof, and automatic model preview."}
        </p>
        <div className="mt-4 max-w-xl rounded-xl border border-line bg-surface p-3">
          <div className="flex items-center justify-between text-xs font-bold text-ink-soft">
            <span>Required information completed</span>
            <span>{completionPercent}% · {missing.length} remaining</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-panel" role="progressbar" aria-valuenow={completionPercent} aria-valuemin={0} aria-valuemax={100} aria-label="Listing completion">
            <span className="block h-full rounded-full bg-brand transition-all" style={{ width: `${completionPercent}%` }} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <FormStepper steps={STEPS} active={step} />

          <FormSection title={STEPS[step].label} description={step === 2 ? "Exact contact and address stay hidden until a buyer pays the token fee." : null}>
            {step === 0 && (
              <div className="space-y-4">
                <FormField label="Category" required>
                  <SelectInput icon={Tags} required aria-invalid={!form.categorySlug} value={form.categorySlug}
                    onChange={(e) => set({ categorySlug: e.target.value, subcategoryId: "", itemType: "", transactionType: "sale" })}>
                    <option value="">Select category</option>
                    {catalog.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                  </SelectInput>
                </FormField>
                {category && (
                  <>
                    <FormField label="Subcategory" required>
                      <SelectInput icon={ListChecks} required aria-invalid={!form.subcategoryId} value={form.subcategoryId}
                        onChange={(e) => set({ subcategoryId: e.target.value, itemType: "" })}>
                        <option value="">Select subcategory</option>
                        {category.subcategories.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </SelectInput>
                    </FormField>
                    {subcategory && (
                      <FormField label="Item type" required>
                        <SelectInput icon={Boxes} required aria-invalid={!form.itemType} value={form.itemType} onChange={(e) => set({ itemType: e.target.value })}>
                          <option value="">Select item type</option>
                          {subcategory.itemTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                        </SelectInput>
                      </FormField>
                    )}
                    <FormField label="Transaction type">
                      <SegmentedControl
                        value={form.transactionType}
                        onChange={(transactionType) => set({ transactionType })}
                        options={category.transactionTypes.map((t) => ({
                          value: t,
                          label: t === "rent" ? "For rent" : "For sale",
                          description: t === "rent" ? "Monthly or periodic deal" : "One-time sale",
                          icon: Home,
                        }))}
                      />
                    </FormField>
                  </>
                )}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <FormField label="You are the">
                  <SegmentedControl
                    value={form.ownerType}
                    onChange={(ownerType) => set({ ownerType })}
                    columns="sm:grid-cols-3"
                    options={[
                      { value: "owner", label: "Owner", icon: User },
                      { value: "manager", label: "Manager", icon: User },
                      { value: "third_party", label: "Third party", icon: User },
                    ]}
                  />
                </FormField>
                {form.ownerType !== "owner" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label="Representative name">
                      <TextInput icon={User} value={form.representative.name}
                        onChange={(e) => set({ representative: { ...form.representative, name: e.target.value } })} />
                    </FormField>
                    <FormField label="Representative phone">
                      <TextInput icon={Phone} value={form.representative.phone}
                        onChange={(e) => set({ representative: { ...form.representative, phone: e.target.value } })} />
                    </FormField>
                  </div>
                )}
                <div className="grid gap-4 sm:grid-cols-3">
                  <FormField label="Quantity / units" required>
                    <TextInput icon={Boxes} type="number" min="1" value={form.quantity} onChange={(e) => set({ quantity: e.target.value })} />
                  </FormField>
                  <FormField label="Price (Rwf)" required>
                    <TextInput icon={Banknote} type="number" min="1" required aria-invalid={!(form.price > 0)} value={form.price} onChange={(e) => set({ price: e.target.value })} />
                  </FormField>
                  <FormField label="Duration">
                    <SelectInput icon={ListChecks} value={form.durationMonths} onChange={(e) => set({ durationMonths: e.target.value })}>
                      {[1, 2, 3, 6, 12].map((m) => <option key={m} value={m}>{m} month(s)</option>)}
                    </SelectInput>
                  </FormField>
                </div>

                {isRealEstate && (
                  <div className="space-y-4 rounded-xl border border-line bg-panel/60 p-4">
                    <div>
                      <h3 className="font-display font-bold text-ink">Real estate details</h3>
                      <p className="mt-1 text-xs text-ink-soft">Fields specific to properties; other categories won’t ask for these details.</p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      {[["bedrooms", "Bedrooms"], ["bathrooms", "Bathrooms"], ["toilets", "Toilets"], ["floor", "Floor"], ["sizeSqm", "Size (m²)"]].map(([key, label]) => (
                        <FormField key={key} label={label}>
                          <TextInput type="number" min="0" value={form.attributes[key] ?? ""} onChange={(e) => setAttribute(key, e.target.value === "" ? "" : Number(e.target.value))} />
                        </FormField>
                      ))}
                      <FormField label="Property use">
                        <SelectInput value={form.attributes.propertyUse || ""} onChange={(e) => setAttribute("propertyUse", e.target.value)}>
                          <option value="">Select use</option><option value="residential">Residential</option><option value="commercial">Commercial</option><option value="agricultural">Agricultural</option><option value="mixed">Mixed use</option>
                        </SelectInput>
                      </FormField>
                      <FormField label="Furnishing">
                        <SelectInput value={form.attributes.furnishing || ""} onChange={(e) => setAttribute("furnishing", e.target.value)}>
                          <option value="">Select furnishing</option><option value="furnished">Furnished</option><option value="part_furnished">Part furnished</option><option value="unfurnished">Unfurnished</option>
                        </SelectInput>
                      </FormField>
                      <FormField label="Parking">
                        <TextInput value={form.attributes.parking || ""} onChange={(e) => setAttribute("parking", e.target.value)} placeholder="e.g. 2 spaces" />
                      </FormField>
                      <FormField label="Availability">
                        <TextInput value={form.attributes.availability || ""} onChange={(e) => setAttribute("availability", e.target.value)} placeholder="e.g. Available now" />
                      </FormField>
                      {form.transactionType === "rent" && (
                        <FormField label="Lease term">
                          <TextInput value={form.attributes.leaseTerm || ""} onChange={(e) => setAttribute("leaseTerm", e.target.value)} placeholder="e.g. 12 months" />
                        </FormField>
                      )}
                    </div>
                    <FormField label="Amenities" hint="Separate amenities with commas.">
                      <TextInput value={(form.attributes.amenities || []).join(", ")} onChange={(e) => setAttribute("amenities", e.target.value.split(",").map((v) => v.trim()).filter(Boolean))} placeholder="Water, internet, security" />
                    </FormField>
                    <FormField label="Special features">
                      <TextareaInput rows={2} value={form.attributes.specialFeatures || ""} onChange={(e) => setAttribute("specialFeatures", e.target.value)} />
                    </FormField>
                  </div>
                )}

                {decision && (
                  <div className={`rounded-xl border p-4 text-sm ${decision.decision.model === "A" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
                    <p className="font-display text-lg font-bold">Model {decision.decision.model}</p>
                    <p className="mt-1">{decision.decision.reason}</p>
                    {decision.listingFee && (
                      <p className="mt-2">Listing fee: <strong>{money(decision.listingFee.total)}</strong> (VAT {money(decision.listingFee.vatPortion)})</p>
                    )}
                  </div>
                )}
                {decision?.decision?.eligibleForA && (
                  <FormField label="Choose a listing model" hint="This listing qualifies for both options. Choose how you want to list it.">
                    <SegmentedControl
                      value={form.modelChoice}
                      onChange={(modelChoice) => set({ modelChoice })}
                      options={[
                        { value: "A", label: "Model A", description: "Exclusive listing; commission is due if a deal closes.", icon: ShieldCheck },
                        { value: "B", label: "Model B", description: "Pay the listing fee shown at checkout.", icon: Banknote },
                      ]}
                    />
                  </FormField>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                {isRealEstate ? (
                  <div className="space-y-4 rounded-xl border border-line bg-panel/60 p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-brand">GENERAL PUBLIC INFORMATION</p>
                    <p className="text-sm font-bold text-ink">Property location · Rwanda</p>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <FormField label="Province / City" required>
                        <SelectInput icon={MapPin} required value={form.location.province} onChange={(e) => set({ location: { ...form.location, province: e.target.value, district: "", sector: "", area: "" } })}>
                          <option value="">Select province / city</option>{administrativeUnits.provinces.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
                        </SelectInput>
                      </FormField>
                      <FormField label="District" required>
                        <SelectInput required disabled={!selectedProvince} value={form.location.district} onChange={(e) => set({ location: { ...form.location, district: e.target.value, sector: "", area: "" } })}>
                          <option value="">Select district</option>{(selectedProvince?.districts || []).map((d) => <option key={d.name} value={d.name}>{d.name}</option>)}
                        </SelectInput>
                      </FormField>
                      <FormField label="Sector" required>
                        <SelectInput required disabled={!selectedDistrict} value={form.location.sector} onChange={(e) => set({ location: { ...form.location, sector: e.target.value, area: e.target.value ? `${e.target.value}, ${form.location.district}` : "" } })}>
                          <option value="">Select sector</option>{(selectedDistrict?.sectors || []).map((sector) => <option key={sector} value={sector}>{sector}</option>)}
                        </SelectInput>
                      </FormField>
                    </div>
                    <FormField label="Famous place (optional)" hint="Enter a nearby landmark or custom place.">
                      <TextInput value={form.location.famousPlace} onChange={(e) => set({ location: { ...form.location, famousPlace: e.target.value, area: e.target.value || (form.location.sector ? `${form.location.sector}, ${form.location.district}` : "") } })} />
                    </FormField>
                    <p className="pt-2 text-xs font-black uppercase tracking-wide text-brand">INFORMATION AVAILABLE AFTER TOKEN PAYMENT</p>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <FormField label="UPI">
                        <TextInput value={form.location.upi} onChange={(e) => set({ location: { ...form.location, upi: e.target.value } })} />
                      </FormField>
                      <FormField label="Street">
                        <TextInput value={form.location.street} onChange={(e) => set({ location: { ...form.location, street: e.target.value } })} />
                      </FormField>
                      <FormField label="House no.">
                        <TextInput value={form.location.houseNumber} onChange={(e) => set({ location: { ...form.location, houseNumber: e.target.value } })} />
                      </FormField>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs font-black uppercase tracking-wide text-brand">GENERAL PUBLIC INFORMATION</p>
                    <FormField label="Public area" hint="Shown to everyone. Keep exact address private." required>
                    <SelectInput icon={MapPin} required aria-invalid={!form.location.area} value={form.location.area} onChange={(e) => set({ location: { ...form.location, area: e.target.value } })}>
                      <option value="">Choose public area</option>{RWANDA_LOCATIONS.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
                    </SelectInput>
                    </FormField>
                  </div>
                )}
                <p className="text-xs font-black uppercase tracking-wide text-brand">INFORMATION AVAILABLE AFTER TOKEN PAYMENT</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Owner name" required>
                    <TextInput icon={User} required aria-invalid={!form.contact.ownerName.trim()} value={form.contact.ownerName} onChange={(e) => set({ contact: { ...form.contact, ownerName: e.target.value } })} />
                  </FormField>
                  <FormField label="Owner phone" required>
                    <TextInput icon={Phone} type="tel" placeholder="+250 7XX XXX XXX" aria-invalid={invalidOwnerPhone} value={form.contact.ownerPhone} onChange={(e) => set({ contact: { ...form.contact, ownerPhone: e.target.value } })} />
                    {invalidOwnerPhone && <p role="alert" className="text-xs font-semibold text-red-700">Enter a valid Rwanda mobile number.</p>}
                  </FormField>
                  <FormField label="Keys manager name">
                    <TextInput icon={User} value={form.contact.keysManagerName} onChange={(e) => set({ contact: { ...form.contact, keysManagerName: e.target.value } })} />
                  </FormField>
                  <FormField label="Keys manager phone">
                    <TextInput icon={Phone} value={form.contact.keysManagerPhone} onChange={(e) => set({ contact: { ...form.contact, keysManagerPhone: e.target.value } })} />
                  </FormField>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <p className="text-xs font-black uppercase tracking-wide text-brand">GENERAL PUBLIC INFORMATION</p>
                <FormField label="Title" required>
                  <TextInput icon={FileCheck2} required minLength={3} aria-invalid={form.title.trim().length < 3} value={form.title} onChange={(e) => set({ title: e.target.value })} />
                </FormField>
                <FormField label="Description">
                  <TextareaInput rows={4} value={form.description} onChange={(e) => set({ description: e.target.value })} />
                </FormField>
                <FormField label="Features" hint="Separate features with commas.">
                  <TextInput icon={ListChecks} value={form.features.join(", ")}
                    onChange={(e) => set({ features: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
                </FormField>
                <FileUploadBox label="Images" hint="Upload at least one listing photo" accept="image/*" multiple count={form.images.length} uploading={uploading} onChange={(e) => handleUpload(e, "image")} />
                {form.images.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {form.images.map((m) => <img key={m.publicId} src={m.url} alt="" className="h-20 w-20 rounded-xl object-cover shadow-soft" />)}
                  </div>
                )}
                <p className="pt-2 text-xs font-black uppercase tracking-wide text-brand">ADMIN-ONLY / NON-SHAREABLE INFORMATION</p>
                <FileUploadBox label="Ownership or authorization document" hint="Required for review; private and admin-only" accept="image/*,application/pdf" multiple count={form.ownershipProof.length} uploading={uploading} onChange={(e) => handleUpload(e, "proof")} />
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div className={`rounded-xl border p-4 ${agreementModel === "A" ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
                  <p className="font-display text-lg font-bold text-ink">
                    {agreementModel === "A" ? "Model A — Exclusive listing agreement" : "Model B — Paid listing agreement"}
                  </p>
                  <div className="mt-2 grid gap-1 text-sm font-semibold text-ink-soft sm:grid-cols-2">
                    {agreementModel === "A" ? (
                      <>
                        <span>Commission: <strong className="text-ink">{decision?.commissionPercent != null ? `${(decision.commissionPercent * 100).toFixed(1)}%` : "-"}</strong> of the final deal</span>
                        <span>Exclusivity period: <strong className="text-ink">{form.durationMonths} month(s)</strong></span>
                        <span>Listing fee: <strong className="text-ink">None</strong></span>
                      </>
                    ) : (
                      <>
                        <span>Listing fee: <strong className="text-ink">{decision?.listingFee ? money(decision.listingFee.total) : "-"}</strong> (VAT inclusive)</span>
                        <span>Duration: <strong className="text-ink">{form.durationMonths} month(s)</strong></span>
                        <span>Commission on a deal: <strong className="text-ink">None</strong></span>
                      </>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-line bg-surface p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-brand">Agreement terms</p>
                  <ol className="mt-3 grid gap-2.5 text-sm leading-relaxed text-ink-soft">
                    {(AGREEMENT_TERMS[agreementModel] || []).map((term, i) => (
                      <li key={term} className="flex gap-2.5">
                        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-panel text-[11px] font-black text-ink-soft">{i + 1}</span>
                        <span>{term}</span>
                      </li>
                    ))}
                  </ol>
                  <p className="mt-3 border-t border-line pt-2 text-[11px] font-bold text-ink-faint">Agreement version {AGREEMENT_VERSION}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Name of the person signing" required hint="The owner, or the representative authorised to sign.">
                    <TextInput
                      icon={User}
                      required
                      aria-invalid={!form.agreement.signatoryName.trim()}
                      value={form.agreement.signatoryName}
                      onChange={(e) => set({ agreement: { ...form.agreement, signatoryName: e.target.value } })}
                    />
                  </FormField>
                  <FormField label="Digital signature" required hint="Type the same name exactly to sign.">
                    <TextInput
                      icon={FileCheck2}
                      required
                      aria-invalid={Boolean(form.agreement.signature) && !signatureMatches}
                      value={form.agreement.signature}
                      onChange={(e) => set({ agreement: { ...form.agreement, signature: e.target.value } })}
                    />
                    {form.agreement.signature && !signatureMatches && (
                      <p role="alert" className="mt-1 text-xs font-semibold text-red-700">Your signature must match the signatory name exactly.</p>
                    )}
                    {signatureMatches && <p className="mt-1 text-xs font-semibold text-emerald-700">Signature matches.</p>}
                  </FormField>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-panel/60 px-4 py-3 text-sm">
                  <span className="font-bold text-ink-soft">Date of signature</span>
                  <span className="font-bold text-ink">{new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>
                </div>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-surface p-4">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
                    checked={form.agreement.accepted}
                    onChange={(e) => set({ agreement: { ...form.agreement, accepted: e.target.checked } })}
                  />
                  <span className="text-sm font-semibold text-ink-soft">
                    I have read and accept the agreement above, and I confirm I am authorised to sign it.
                    A copy will be emailed to this account.
                  </span>
                </label>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-2 text-sm">
                <Row k="Title" v={form.title} />
                <Row k="Category" v={category?.name} />
                <Row k="Transaction" v={form.transactionType} />
                <Row k="Price" v={money(Number(form.price))} />
                <Row k="Quantity" v={form.quantity} />
                <Row k="Duration" v={`${form.durationMonths} month(s)`} />
                <Row k="Model" v={decision ? `Model ${decision.decision.model}` : "-"} />
                {decision?.listingFee && <Row k="Listing fee" v={`${money(decision.listingFee.total)} (Model B, payable)`} />}
                {decision?.decision?.model === "A" && decision?.commissionPercent != null && <Row k="Commission rate" v={`${(decision.commissionPercent * 100).toFixed(1)}% if a deal closes`} />}
                <Row k="Images" v={`${form.images.length}`} />
                <Row k="Ownership proof" v={`${form.ownershipProof.length}`} />
                <Row k="Agreement" v={agreementSigned ? `Signed by ${form.agreement.signatoryName}` : "Not signed"} />
                {missing.length > 0 && (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-800">
                    <p className="font-bold">Missing before submit</p>
                    <p className="mt-1 text-xs">{missing.join(", ")}</p>
                  </div>
                )}
              </div>
            )}
          </FormSection>

          <div className="flex items-center justify-between gap-3">
            <button className="btn-outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>Back</button>
            <div className="flex gap-2">
              {step < STEPS.length - 1 ? (
                <button className="btn-primary" disabled={!canNext} onClick={() => setStep((s) => s + 1)}>Next</button>
              ) : (
                <>
                  <button className="btn-outline" disabled={submitting} onClick={() => submit(true)}>{draftId ? "Save changes" : "Save draft"}</button>
                  <SubmitButton loading={submitting} disabled={missing.length > 0 || invalidOwnerPhone || !decision} onClick={() => submit(false)}>
                    {submitting ? "Processing..." : decision?.decision?.model === "B" ? "Continue to checkout" : "Submit for approval"}
                  </SubmitButton>
                </>
              )}
            </div>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card premium-hover space-y-4">
            <div>
              <p className="eyebrow">Live summary</p>
              <h2 className="mt-1 font-display text-xl font-bold text-ink">{form.title || "Untitled listing"}</h2>
            </div>
            <div className="space-y-2 text-sm">
              <Row k="Category" v={category?.name || "-"} />
              <Row k="Price" v={form.price ? money(Number(form.price)) : "-"} />
              <Row k="Area" v={form.location.area || "-"} />
              <Row k="Images" v={String(form.images.length)} />
              <Row k="Proof" v={String(form.ownershipProof.length)} />
            </div>
            {decision && (
              <div className={`rounded-xl p-3 text-sm ${decision.decision.model === "A" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>
                <p className="font-bold">Model {decision.decision.model}</p>
                <p className="mt-1 text-xs">{decision.decision.reason}</p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line py-2">
      <span className="text-ink-faint">{k}</span>
      <span className="text-right font-semibold text-ink">{v ?? "-"}</span>
    </div>
  );
}
