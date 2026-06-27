"use client";

import { useEffect, useState } from "react";
import { formatRwf } from "@/lib/format";
import { useToast } from "@/components/ui/Toast";
import { StatusBadge } from "@/components/ui/Badge";
import { SectionHeading, Table, Tr, Td } from "@/components/ui/Dashboard";
import EmptyState from "@/components/ui/EmptyState";

const REPORTABLE = ["active", "under_negotiation"];

export default function OwnerManage() {
  const { toast } = useToast();
  const [listings, setListings] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [penalties, setPenalties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportFor, setReportFor] = useState(null);
  const [outcome, setOutcome] = useState("sold");
  const [finalAmount, setFinalAmount] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    const [l, c, p] = await Promise.all([
      fetch("/api/listings/mine").then((r) => r.json()),
      fetch("/api/commissions/mine").then((r) => r.json()),
      fetch("/api/penalties/mine").then((r) => r.json()),
    ]);
    setListings(l.data?.listings || []);
    setCommissions(c.data?.commissions || []);
    setPenalties(p.data?.penalties || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function submitOutcome(id) {
    setBusy(true);
    try {
      const body = { outcome };
      if (outcome !== "not_concluded") body.finalAmount = Number(finalAmount);
      const res = await fetch(`/api/listings/${id}/outcome`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.error);
      toast("Deal outcome recorded", { type: "success" });
      setReportFor(null);
      setFinalAmount("");
      await load();
    } catch (err) {
      toast(err.message, { type: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function payCommission(id) { await payEndpoint(`/api/commissions/${id}/pay`); }
  async function payPenalty(id) { await payEndpoint(`/api/penalties/${id}/pay`); }
  async function payEndpoint(url) {
    setBusy(true);
    try {
      const res = await fetch(url, { method: "POST" });
      const j = await res.json();
      if (!j.success) throw new Error(j.error);
      toast("Payment successful", { type: "success" });
      await load();
    } catch (err) {
      toast(err.message, { type: "error" });
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="mt-8 text-sm text-ink-soft">Loading…</p>;

  return (
    <div className="mt-8 space-y-8">
      {/* Penalties */}
      {penalties.length > 0 && (
        <section>
          <SectionHeading title="Penalties" />
          <Table head={["Offense", "Reason", "Amount", "Status", ""]}>
            {penalties.map((p) => (
              <Tr key={p.id}>
                <Td className="capitalize text-ink">{p.offenseType.replace(/_/g, " ")}</Td>
                <Td className="text-ink-soft">{p.reason}</Td>
                <Td className="font-semibold text-ink">{formatRwf(p.total)}</Td>
                <Td><StatusBadge status={p.status} /></Td>
                <Td>{p.status === "active" && <button className="btn-primary" disabled={busy} onClick={() => payPenalty(p.id)}>Pay</button>}</Td>
              </Tr>
            ))}
          </Table>
        </section>
      )}

      {/* Commissions */}
      {commissions.length > 0 && (
        <section>
          <SectionHeading title="Commissions (Model A)" />
          <Table head={["Listing", "Deal", "Due", "Status", ""]}>
            {commissions.map((c) => (
              <Tr key={c.id}>
                <Td className="font-semibold text-ink">{c.listingTitle}</Td>
                <Td className="capitalize text-ink-soft">{c.dealOutcome} · {formatRwf(c.finalAmount)}</Td>
                <Td className="font-semibold text-ink">{formatRwf(c.total)}</Td>
                <Td><StatusBadge status={c.status} /></Td>
                <Td>{c.status !== "paid" && <button className="btn-primary" disabled={busy} onClick={() => payCommission(c.id)}>Pay</button>}</Td>
              </Tr>
            ))}
          </Table>
        </section>
      )}

      {/* Listings */}
      <section>
        <SectionHeading title="Listings" />
        {listings.length === 0 ? (
          <EmptyState icon="▤" title="No listings yet" hint="Create your first listing to start receiving unlocks." />
        ) : (
          <div className="space-y-3">
            {listings.map((l) => (
              <div key={l.id} className="card !p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{l.title}</p>
                    <p className="text-xs text-ink-faint">Model {l.model} · {formatRwf(l.price)} · {l.transactionType} · unlocks: {l.unlockCount ?? 0}</p>
                    {l.reviewFlag && <p className="mt-1 text-xs text-red-600">⚑ Flagged: {l.reviewReason}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={l.status} />
                    {REPORTABLE.includes(l.status) && (
                      <button className="btn-outline" onClick={() => { setReportFor(reportFor === l.id ? null : l.id); setOutcome("sold"); setFinalAmount(""); }}>
                        Report deal
                      </button>
                    )}
                  </div>
                </div>

                {reportFor === l.id && (
                  <div className="mt-3 grid gap-3 rounded-xl bg-panel p-3 sm:grid-cols-3">
                    <div>
                      <label className="label">Outcome</label>
                      <select className="input" value={outcome} onChange={(e) => setOutcome(e.target.value)}>
                        <option value="sold">Sold</option>
                        <option value="rented">Rented</option>
                        <option value="not_concluded">Not concluded</option>
                      </select>
                    </div>
                    {outcome !== "not_concluded" && (
                      <div>
                        <label className="label">Final amount (Rwf)</label>
                        <input type="number" className="input" value={finalAmount} onChange={(e) => setFinalAmount(e.target.value)} />
                      </div>
                    )}
                    <div className="flex items-end">
                      <button className="btn-primary w-full" disabled={busy || (outcome !== "not_concluded" && !finalAmount)} onClick={() => submitOutcome(l.id)}>
                        {busy ? "Submitting…" : "Submit outcome"}
                      </button>
                    </div>
                    {l.model === "A" && outcome !== "not_concluded" && (
                      <p className="text-xs text-ink-soft sm:col-span-3">A commission invoice will be generated automatically for this Model A deal.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
