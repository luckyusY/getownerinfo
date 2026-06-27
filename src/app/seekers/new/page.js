"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";
import { Banknote, CalendarDays, MapPin, MessageSquareText, Phone, Tags, User } from "lucide-react";
import { FormField, FormSection, SegmentedControl, SelectInput, SubmitButton, TextareaInput, TextInput } from "@/components/ui/Form";

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
    <div className="mx-auto max-w-3xl px-4 py-10">
      <FormSection
        eyebrow="Buyer request"
        title="Post a request"
        description="Tell owners what you are looking for. Your contact stays hidden until someone pays the view token."
      >
        <form onSubmit={submit} className="space-y-5">
          <FormField label="Category" required>
            <SelectInput icon={Tags} value={form.categorySlug} onChange={(e) => setForm({ ...form, categorySlug: e.target.value })} required>
              <option value="">Select category</option>
              {catalog.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </SelectInput>
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Budget min (Rwf)">
              <TextInput icon={Banknote} type="number" value={form.budgetMin} onChange={(e) => setForm({ ...form, budgetMin: e.target.value })} />
            </FormField>
            <FormField label="Budget max (Rwf)">
              <TextInput icon={Banknote} type="number" value={form.budgetMax} onChange={(e) => setForm({ ...form, budgetMax: e.target.value })} />
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Preferred location">
              <TextInput icon={MapPin} value={form.preferredLocation} onChange={(e) => setForm({ ...form, preferredLocation: e.target.value })} />
            </FormField>
            <FormField label="Quantity / type">
              <TextInput icon={Tags} value={form.quantityType} onChange={(e) => setForm({ ...form, quantityType: e.target.value })} />
            </FormField>
          </div>

          <FormField label="What exactly do you want?" required>
            <TextareaInput icon={MessageSquareText} rows={4} value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} required />
          </FormField>

          <FormField label="Validity">
            <SegmentedControl
              value={Number(form.validityDays)}
              onChange={(validityDays) => setForm({ ...form, validityDays })}
              columns="sm:grid-cols-3"
              options={[
                { value: 7, label: "7 days", description: "Short search", icon: CalendarDays },
                { value: 14, label: "14 days", description: "Balanced", icon: CalendarDays },
                { value: 30, label: "30 days", description: "Maximum reach", icon: CalendarDays },
              ]}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Contact name" hint="Defaults to your account name if left blank.">
              <TextInput icon={User} value={form.contact.name} onChange={(e) => setForm({ ...form, contact: { ...form.contact, name: e.target.value } })} />
            </FormField>
            <FormField label="Contact phone">
              <TextInput icon={Phone} value={form.contact.phone} onChange={(e) => setForm({ ...form, contact: { ...form.contact, phone: e.target.value } })} />
            </FormField>
          </div>

          <FormField label="Preferred contact time">
            <TextInput icon={CalendarDays} value={form.contact.preferredContactTime} onChange={(e) => setForm({ ...form, contact: { ...form.contact, preferredContactTime: e.target.value } })} placeholder="e.g. weekdays after 5pm" />
          </FormField>

          <SubmitButton className="w-full" loading={loading} disabled={!form.categorySlug || form.details.length < 3}>
            {loading ? "Posting..." : "Pay post fee & publish"}
          </SubmitButton>
        </form>
      </FormSection>
    </div>
  );
}
