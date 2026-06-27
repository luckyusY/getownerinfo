"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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

const STEPS = [
  { label: "Category", icon: Tags },
  { label: "Details", icon: Banknote },
  { label: "Location", icon: MapPin },
  { label: "Content", icon: ImagePlus },
  { label: "Review", icon: CheckCircle2 },
];

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
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [catalog, setCatalog] = useState([]);
  const [decision, setDecision] = useState(null);
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
      toast(asDraft ? "Draft saved" : "Listing submitted for approval", { type: "success" });
      router.push("/dashboard/owner");
      router.refresh();
    } catch (err) {
      toast(err.message, { type: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  const canNext = [
    form.categorySlug && form.transactionType,
    form.price > 0 && form.quantity > 0 && form.durationMonths > 0,
    form.contact.ownerName && form.contact.ownerPhone,
    form.title.length >= 3,
    true,
  ][step];

  const missing = [
    !form.categorySlug && "Category",
    !(form.price > 0) && "Price",
    !form.contact.ownerName && "Owner name",
    !form.contact.ownerPhone && "Owner phone",
    form.title.length < 3 && "Title",
  ].filter(Boolean);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <p className="eyebrow">Owner workspace</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-ink">Create a listing</h1>
        <p className="mt-1 text-sm text-ink-soft">A guided listing flow with private owner details, document proof, and automatic model preview.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <FormStepper steps={STEPS} active={step} />

          <FormSection title={STEPS[step].label} description={step === 2 ? "Exact contact and address stay hidden until a buyer pays the token fee." : null}>
            {step === 0 && (
              <div className="space-y-4">
                <FormField label="Category" required>
                  <SelectInput icon={Tags} value={form.categorySlug}
                    onChange={(e) => set({ categorySlug: e.target.value, subcategoryId: "", itemType: "", transactionType: "sale" })}>
                    <option value="">Select category</option>
                    {catalog.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                  </SelectInput>
                </FormField>
                {category && (
                  <>
                    <FormField label="Subcategory">
                      <SelectInput icon={ListChecks} value={form.subcategoryId}
                        onChange={(e) => set({ subcategoryId: e.target.value, itemType: "" })}>
                        <option value="">Select subcategory</option>
                        {category.subcategories.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </SelectInput>
                    </FormField>
                    {subcategory && (
                      <FormField label="Item type">
                        <SelectInput icon={Boxes} value={form.itemType} onChange={(e) => set({ itemType: e.target.value })}>
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
                    <TextInput icon={Banknote} type="number" min="0" value={form.price} onChange={(e) => set({ price: e.target.value })} />
                  </FormField>
                  <FormField label="Duration">
                    <SelectInput icon={ListChecks} value={form.durationMonths} onChange={(e) => set({ durationMonths: e.target.value })}>
                      {[1, 2, 3, 6, 12].map((m) => <option key={m} value={m}>{m} month(s)</option>)}
                    </SelectInput>
                  </FormField>
                </div>

                {decision && (
                  <div className={`rounded-xl border p-4 text-sm ${decision.decision.model === "A" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
                    <p className="font-display text-lg font-bold">Model {decision.decision.model}</p>
                    <p className="mt-1">{decision.decision.reason}</p>
                    {decision.listingFee && (
                      <p className="mt-2">Listing fee: <strong>{money(decision.listingFee.total)}</strong> (VAT {money(decision.listingFee.vatPortion)})</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <FormField label="Public area" hint="Shown to everyone. Keep exact address private.">
                  <TextInput icon={MapPin} placeholder="e.g. Kicukiro, Kigali" value={form.location.area}
                    onChange={(e) => set({ location: { ...form.location, area: e.target.value } })} />
                </FormField>
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
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Owner name" required>
                    <TextInput icon={User} value={form.contact.ownerName} onChange={(e) => set({ contact: { ...form.contact, ownerName: e.target.value } })} />
                  </FormField>
                  <FormField label="Owner phone" required>
                    <TextInput icon={Phone} value={form.contact.ownerPhone} onChange={(e) => set({ contact: { ...form.contact, ownerPhone: e.target.value } })} />
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
                <FormField label="Title" required>
                  <TextInput icon={FileCheck2} value={form.title} onChange={(e) => set({ title: e.target.value })} />
                </FormField>
                <FormField label="Description">
                  <TextareaInput rows={4} value={form.description} onChange={(e) => set({ description: e.target.value })} />
                </FormField>
                <FormField label="Features" hint="Separate features with commas.">
                  <TextInput icon={ListChecks} value={form.features.join(", ")}
                    onChange={(e) => set({ features: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
                </FormField>
                <FileUploadBox label="Images" hint="Upload listing photos" accept="image/*" multiple count={form.images.length} uploading={uploading} onChange={(e) => handleUpload(e, "image")} />
                {form.images.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {form.images.map((m) => <img key={m.publicId} src={m.url} alt="" className="h-20 w-20 rounded-xl object-cover shadow-soft" />)}
                  </div>
                )}
                <FileUploadBox label="Ownership proof" hint="Admin-only proof files" accept="image/*,application/pdf" multiple count={form.ownershipProof.length} uploading={uploading} onChange={(e) => handleUpload(e, "proof")} />
              </div>
            )}

            {step === 4 && (
              <div className="space-y-2 text-sm">
                <Row k="Title" v={form.title} />
                <Row k="Category" v={category?.name} />
                <Row k="Transaction" v={form.transactionType} />
                <Row k="Price" v={money(Number(form.price))} />
                <Row k="Quantity" v={form.quantity} />
                <Row k="Duration" v={`${form.durationMonths} month(s)`} />
                <Row k="Model" v={decision ? `Model ${decision.decision.model}` : "-"} />
                {decision?.listingFee && <Row k="Listing fee" v={`${money(decision.listingFee.total)} (Model B, payable)`} />}
                <Row k="Images" v={`${form.images.length}`} />
                <Row k="Ownership proof" v={`${form.ownershipProof.length}`} />
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
                  <button className="btn-outline" disabled={submitting} onClick={() => submit(true)}>Save draft</button>
                  <SubmitButton loading={submitting} disabled={missing.length > 0} onClick={() => submit(false)}>
                    {submitting ? "Submitting..." : "Submit for approval"}
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
