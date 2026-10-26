"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { SectionHeading } from "@/components/ui/Dashboard";
import EmptyState from "@/components/ui/EmptyState";
import { BadgeCheck, CheckCircle2, Eye, Mail, Phone, XCircle } from "lucide-react";

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
