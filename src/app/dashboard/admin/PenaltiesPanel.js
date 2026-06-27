"use client";

import { useEffect, useState } from "react";
import { formatRwf } from "@/lib/format";
import { useToast } from "@/components/ui/Toast";
import { StatusBadge } from "@/components/ui/Badge";
import { SectionHeading, Table, Tr, Td } from "@/components/ui/Dashboard";
import EmptyState from "@/components/ui/EmptyState";

const OFFENSES = [
  "late_status_update", "under_reporting", "early_withdrawal", "false_not_concluded",
  "commission_delay", "token_bypass", "contact_sharing", "override_misuse",
];

export default function PenaltiesPanel() {
  const { toast } = useToast();
  const [penalties, setPenalties] = useState([]);
  const [summary, setSummary] = useState({ total: 0, outstanding: 0 });
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ userEmail: "", offenseType: "under_reporting", reason: "", expectedAmount: "" });
  const [showForm, setShowForm] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/penalties");
    const j = await res.json();
    setPenalties(j.data?.penalties || []);
    setSummary(j.data?.summary || { total: 0, outstanding: 0 });
  }
  useEffect(() => { load(); }, []);

  async function issue() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/penalties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail: form.userEmail,
          offenseType: form.offenseType,
          reason: form.reason,
          expectedAmount: Number(form.expectedAmount) || 0,
        }),
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.error);
      toast("Penalty issued", { type: "success" });
      setForm({ userEmail: "", offenseType: "under_reporting", reason: "", expectedAmount: "" });
      setShowForm(false);
      await load();
    } catch (err) {
      toast(err.message, { type: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function waive(id) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/penalties/${id}/waive`, { method: "POST" });
      const j = await res.json();
      if (!j.success) throw new Error(j.error);
      toast("Penalty waived", { type: "info" });
      await load();
    } catch (err) {
      toast(err.message, { type: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-10">
      <SectionHeading
        title={`Penalties - outstanding ${formatRwf(summary.outstanding)}`}
        action={<button className="btn-outline" onClick={() => setShowForm((s) => !s)}>{showForm ? "Cancel" : "Issue penalty"}</button>}
      />

      {showForm && (
        <div className="mb-4 grid gap-3 rounded-xl border border-line bg-surface p-5 shadow-soft sm:grid-cols-2">
          <div>
            <label className="label">Offender email</label>
            <input className="input" value={form.userEmail} onChange={(e) => setForm({ ...form, userEmail: e.target.value })} />
          </div>
          <div>
            <label className="label">Offense</label>
            <select className="input" value={form.offenseType} onChange={(e) => setForm({ ...form, offenseType: e.target.value })}>
              {OFFENSES.map((o) => <option key={o} value={o}>{o.replace(/_/g, " ")}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Expected amount (Rwf, basis for 50%)</label>
            <input type="number" className="input" value={form.expectedAmount} onChange={(e) => setForm({ ...form, expectedAmount: e.target.value })} />
          </div>
          <div>
            <label className="label">Reason</label>
            <input className="input" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <button className="btn-primary" disabled={busy || !form.userEmail || form.reason.length < 3} onClick={issue}>
              {busy ? "Issuing..." : "Issue penalty"}
            </button>
          </div>
        </div>
      )}

      {penalties.length === 0 ? (
        <EmptyState title="No penalties issued" hint="Confirmed abuse and waived penalties will appear here." />
      ) : (
        <Table head={["User", "Offense", "Amount", "Status", ""]}>
          {penalties.map((p) => (
            <Tr key={p.id}>
              <Td><div className="font-semibold text-ink">{p.userName}</div><div className="text-xs text-ink-faint">{p.userEmail}</div></Td>
              <Td className="capitalize text-ink-soft">{p.offenseType.replace(/_/g, " ")}</Td>
              <Td className="font-semibold text-ink">{formatRwf(p.total)}</Td>
              <Td><StatusBadge status={p.status} /></Td>
              <Td>{p.status === "active" && <button className="btn-outline" disabled={busy} onClick={() => waive(p.id)}>Waive</button>}</Td>
            </Tr>
          ))}
        </Table>
      )}
    </section>
  );
}
