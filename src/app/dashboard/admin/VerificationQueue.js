"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { SectionHeading } from "@/components/ui/Dashboard";
import EmptyState from "@/components/ui/EmptyState";
import { BadgeCheck, CheckCircle2, Eye, Mail, Phone, ScanFace, XCircle } from "lucide-react";

export default function VerificationQueue() {
  const { toast } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/verification?status=pending");
      const j = await res.json();
      setRequests(j.data?.requests || []);
    } catch {
      /* leave list empty */
    }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  // Identity documents are private Cloudinary assets. Fetch a short-lived signed
  // URL on demand rather than ever embedding one in the page.
  async function viewDocument(publicId) {
    try {
      const res = await fetch(`/api/admin/media/signed?publicId=${encodeURIComponent(publicId)}`);
      const j = await res.json();
      if (!j.success) throw new Error(j.error);
      window.open(j.data.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      toast(err.message || "Could not open document", { type: "error" });
    }
  }

  async function review(id, action) {
    const reason = action === "reject" ? prompt("Why is this being rejected?") || "Documents could not be verified" : undefined;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/verification/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.error);
      toast(action === "approve" ? "Owner verified" : "Verification rejected", {
        type: action === "approve" ? "success" : "info",
      });
      setRequests((rs) => rs.filter((r) => r.id !== id));
    } catch (err) {
      toast(err.message, { type: "error" });
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <p className="mt-10 text-sm font-semibold text-ink-soft">Loading verification queue...</p>;

  return (
    <section className="mt-10">
      <SectionHeading
        title={`Identity verification (${requests.length})`}
        description="Confirm the declared name matches the submitted ID before granting a verified badge."
      />
      {requests.length === 0 ? (
        <EmptyState title="No verification requests" hint="Owner identity submissions will appear here." />
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="card premium-hover !p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <p className="font-display text-lg font-semibold text-ink">{r.name}</p>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-soft">
                    <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {r.email}</span>
                    {r.phone && <span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {r.phone}</span>}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-ink-soft">
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-brand">
                      <BadgeCheck className="h-3.5 w-3.5" /> Declared: {r.declaredName || "—"}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-panel px-2.5 py-1">
                      ID: {r.idNumber || "—"}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-panel px-2.5 py-1 capitalize">
                      {r.role}
                    </span>
                    {r.docType && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-panel px-2.5 py-1 capitalize">
                        {r.docType === "national_id" ? "National ID" : r.docType === "passport" ? "Passport" : "Driving Licence"}
                      </span>
                    )}
                  </div>
                  {r.rdbNumber && (
                    <p className="mt-2 text-xs font-semibold text-ink-soft">
                      RDB registration: <strong className="text-ink">{r.rdbNumber}</strong>
                    </p>
                  )}

                  <FaceCheck request={r} />

                  {/* A name mismatch is the single most common forgery signal. */}
                  {r.declaredName && r.name && r.declaredName.trim().toLowerCase() !== r.name.trim().toLowerCase() && (
                    <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                      Declared name differs from the account name — check the document carefully.
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    className="btn-outline"
                    disabled={!r.idDocumentPublicId}
                    onClick={() => viewDocument(r.idDocumentPublicId)}
                  >
                    <Eye className="h-4 w-4" /> View ID
                  </button>
                  <button
                    className="btn-outline"
                    disabled={!r.selfiePublicId}
                    onClick={() => viewDocument(r.selfiePublicId)}
                  >
                    <ScanFace className="h-4 w-4" /> View selfie
                  </button>
                  <button className="btn-primary" disabled={busyId === r.id} onClick={() => review(r.id, "approve")}>
                    <CheckCircle2 className="h-4 w-4" /> Verify
                  </button>
                  <button className="btn-outline" disabled={busyId === r.id} onClick={() => review(r.id, "reject")}>
                    <XCircle className="h-4 w-4" /> Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}


/**
 * The two images side by side with the automated verdict, so an admin can make
 * the comparison the spec asks for without opening each file separately.
 */
function FaceCheck({ request }) {
  const [urls, setUrls] = useState(null);
  const [loading, setLoading] = useState(false);

  async function loadImages() {
    setLoading(true);
    try {
      const ids = [request.idDocumentPublicId, request.selfiePublicId].filter(Boolean);
      const results = await Promise.all(
        ids.map((publicId) =>
          fetch(`/api/admin/media/signed?publicId=${encodeURIComponent(publicId)}`)
            .then((r) => r.json())
            .then((j) => (j.success ? j.data.url : null))
        )
      );
      setUrls({ id: results[0] || null, selfie: results[1] || null });
    } finally {
      setLoading(false);
    }
  }

  const tone =
    request.faceMatch?.tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : request.faceMatch?.tone === "danger"
        ? "border-red-200 bg-red-50 text-red-800"
        : request.faceMatch?.tone === "warning"
          ? "border-amber-200 bg-amber-50 text-amber-800"
          : "border-line bg-panel/60 text-ink-soft";

  if (!request.selfiePublicId) {
    return (
      <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
        No selfie was submitted — this request predates the face check. Verify the ID manually.
      </p>
    );
  }

  return (
    <div className={`mt-3 rounded-lg border px-3 py-2.5 ${tone}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-black uppercase tracking-wide">
          Face check — {request.faceMatch?.label}
        </p>
        <span className="text-[11px] font-bold opacity-80">
          Selfie {request.selfieSource === "camera" ? "taken with camera" : "uploaded from device"}
        </span>
      </div>
      <p className="mt-1 text-xs font-semibold">{request.faceMatch?.detail}</p>

      {urls ? (
        <div className="mt-3 flex flex-wrap gap-3">
          {[["ID document", urls.id], ["Live selfie", urls.selfie]].map(([label, url]) => (
            <figure key={label} className="m-0">
              {url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt={label} className="h-36 w-36 rounded-lg border border-line object-cover" />
              ) : (
                <span className="grid h-36 w-36 place-items-center rounded-lg border border-line bg-surface text-[11px] font-bold text-ink-faint">
                  Not an image
                </span>
              )}
              <figcaption className="mt-1 text-center text-[11px] font-bold">{label}</figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <button type="button" onClick={loadImages} disabled={loading} className="btn-outline mt-2 !min-h-8 !py-1 !text-xs">
          {loading ? "Loading…" : "Compare side by side"}
        </button>
      )}
    </div>
  );
}
