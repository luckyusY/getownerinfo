"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";

export default function NewSeekerPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [catalog, setCatalog] = useState([]);
  const [form, setForm] = useState({
    categorySlug: "",
    budgetMin: "",
    budgetMax: "",
    preferredLocation: "",
    quantityType: "",
    details: "",
    validityDays: 30,
    contact: { name: "", phone: "", preferredContactTime: "" },
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/catalog").then((r) => r.json()).then((j) => setCatalog(j.data?.categories || []));
  }, []);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/seekers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          budgetMin: Number(form.budgetMin) || 0,
          budgetMax: Number(form.budgetMax) || 0,
          validityDays: Number(form.validityDays),
        }),
      });
      const j = await res.json();
      if (!j.success) {
        const detail = j.issues ? Object.values(j.issues).flat().join(", ") : j.error;
        throw new Error(detail);
      }
      toast("Request posted", { type: "success" });
      router.push("/dashboard/buyer");
      router.refresh();
    } catch (err) {
      toast(err.message, { type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="font-display text-2xl font-bold text-ink">Post a request</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Tell owners what you&apos;re looking for. A non-refundable post fee applies; your
        contact stays hidden until someone pays the view token.
      </p>

      <form onSubmit={submit} className="mt-5 card space-y-4">
        <div>
          <label className="label">Category</label>
          <select className="input" value={form.categorySlug} onChange={(e) => setForm({ ...form, categorySlug: e.target.value })} required>
            <option value="">Select…</option>
            {catalog.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Budget min (Rwf)</label>
            <input type="number" className="input" value={form.budgetMin} onChange={(e) => setForm({ ...form, budgetMin: e.target.value })} /></div>
          <div><label className="label">Budget max (Rwf)</label>
            <input type="number" className="input" value={form.budgetMax} onChange={(e) => setForm({ ...form, budgetMax: e.target.value })} /></div>
        </div>
        <div><label className="label">Preferred location</label>
          <input className="input" value={form.preferredLocation} onChange={(e) => setForm({ ...form, preferredLocation: e.target.value })} /></div>
        <div><label className="label">Quantity / type</label>
          <input className="input" value={form.quantityType} onChange={(e) => setForm({ ...form, quantityType: e.target.value })} /></div>
        <div><label className="label">What exactly do you want? *</label>
          <textarea className="input" rows={3} value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} required /></div>
        <div><label className="label">Validity</label>
          <select className="input" value={form.validityDays} onChange={(e) => setForm({ ...form, validityDays: e.target.value })}>
            {[7, 14, 30].map((d) => <option key={d} value={d}>{d} days</option>)}
          </select></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Contact name</label>
            <input className="input" value={form.contact.name} onChange={(e) => setForm({ ...form, contact: { ...form.contact, name: e.target.value } })} placeholder="(defaults to your name)" /></div>
          <div><label className="label">Contact phone</label>
            <input className="input" value={form.contact.phone} onChange={(e) => setForm({ ...form, contact: { ...form.contact, phone: e.target.value } })} /></div>
        </div>
        <div><label className="label">Preferred contact time</label>
          <input className="input" value={form.contact.preferredContactTime} onChange={(e) => setForm({ ...form, contact: { ...form.contact, preferredContactTime: e.target.value } })} placeholder="e.g. weekdays after 5pm" /></div>

        <button className="btn-primary w-full" disabled={loading || !form.categorySlug || form.details.length < 3}>
          {loading ? "Posting…" : "Pay post fee & publish"}
        </button>
      </form>
    </div>
  );
}
