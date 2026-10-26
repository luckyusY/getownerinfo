"use client";

import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { BadgeCheck, Clock, ShieldAlert, Upload, XCircle } from "lucide-react";

const MAX_BYTES = 10 * 1024 * 1024;

function fileToDataUri(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function VerificationCard() {
  const { toast } = useToast();
  const fileRef = useRef(null);
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [fullName, setFullName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [docType, setDocType] = useState("national_id");
  const [fileName, setFileName] = useState("");

  async function load() {
    try {
      const res = await fetch("/api/verification");
      const j = await res.json();
      if (j.success) setState(j.data);
    } catch {
      /* ignore */
    }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function submit(e) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return toast("Attach a photo or PDF of your ID", { type: "error" });
    if (file.size > MAX_BYTES) return toast("File must be 10MB or smaller", { type: "error" });

    setBusy(true);
    try {
      // Upload as a private "identity" asset first — the API only accepts a
      // publicId from that folder.
      const dataUri = await fileToDataUri(file);
      const up = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file: dataUri, kind: "identity" }),
      });
      const upJson = await up.json();
      if (!upJson.success) throw new Error(upJson.error);

      const res = await fetch("/api/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          idNumber,
          docType,
          idDocument: { publicId: upJson.data.publicId, resourceType: upJson.data.resourceType },
        }),
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.error);
      toast("Submitted for review", { type: "success" });
      setFullName(""); setIdNumber(""); setFileName(""); setDocType("national_id");
      if (fileRef.current) fileRef.current.value = "";
      load();
    } catch (err) {
      toast(err.message || "Submission failed", { type: "error" });
    } finally {
      setBusy(false);
    }
  }

  if (loading) return null;

  const status = state?.status || "none";

  if (status === "approved") {
    return (
      <section className="card !p-5">
        <p className="inline-flex items-center gap-2 text-sm font-black text-emerald-700">
          <BadgeCheck className="h-5 w-5" /> Identity verified
        </p>
        <p className="mt-2 text-sm text-ink-soft">
          Your listings show a verified badge to buyers. Verified owners get noticeably more unlocks.
        </p>
      </section>
    );
  }

  if (status === "pending") {
    return (
      <section className="card !p-5">
        <p className="inline-flex items-center gap-2 text-sm font-black text-brand">
          <Clock className="h-5 w-5" /> Verification under review
        </p>
        <p className="mt-2 text-sm text-ink-soft">
          Submitted {state?.submittedAt ? new Date(state.submittedAt).toLocaleDateString() : "recently"}.
          We&apos;ll notify you as soon as an admin has reviewed it.
        </p>
      </section>
    );
  }

  return (
    <section className="card !p-5">
      <p className="inline-flex items-center gap-2 text-sm font-black text-ink">
        {status === "rejected" ? <XCircle className="h-5 w-5 text-red-600" /> : <ShieldAlert className="h-5 w-5 text-amber-600" />}
        {status === "rejected" ? "Verification rejected" : "Get verified"}
      </p>
      {status === "rejected" && state?.rejectionReason && (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-800">{state.rejectionReason}</p>
      )}
      <p className="mt-2 text-sm text-ink-soft">
        Submit your national ID so buyers see a verified badge on your listings. Your document is stored privately and is
        only ever visible to our review team.
      </p>

      <form onSubmit={submit} className="mt-4 grid gap-3">
        <label className="grid gap-1">
          <span className="text-xs font-bold uppercase tracking-wide text-ink-faint">Full name as on ID</span>
          <input
            required minLength={2} value={fullName} onChange={(e) => setFullName(e.target.value)}
            className="rounded-lg border border-line bg-surface px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-brand"
          />
        </label>
        {(() => {
          const idLabel = docType === "passport" ? "Passport number" : docType === "driving_licence" ? "Licence number" : "National ID number";
          return (
            <>
              <label className="grid gap-1">
                <span className="text-xs font-bold uppercase tracking-wide text-ink-faint">Document type</span>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="rounded-lg border border-line bg-surface px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-brand"
                >
                  <option value="national_id">National ID</option>
                  <option value="passport">Passport</option>
                  <option value="driving_licence">Driving Licence</option>
                </select>
              </label>
              <label className="grid gap-1">
                <span className="text-xs font-bold uppercase tracking-wide text-ink-faint">{idLabel}</span>
                <input
                  required minLength={6} value={idNumber} onChange={(e) => setIdNumber(e.target.value)}
                  className="rounded-lg border border-line bg-surface px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-brand"
                />
              </label>
            </>
          );
        })()}
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-line bg-panel px-3 py-3 text-sm font-semibold text-ink-soft hover:border-brand/40">
          <Upload className="h-4 w-4 text-brand" />
          {fileName || "Attach ID photo or PDF (max 10MB)"}
          <input
            ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden" onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}
          />
        </label>
        <button className="btn-primary justify-self-start" disabled={busy}>
          {busy ? "Submitting…" : "Submit for verification"}
        </button>
      </form>
    </section>
  );
}
