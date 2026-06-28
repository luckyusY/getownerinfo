"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Store } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function StartSellingButton({ className = "btn-primary", children = "Start selling", compact = false }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function upgrade() {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/upgrade-owner", { method: "POST" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Could not switch to selling.");
      toast("Seller tools are ready. Create your first listing.", { type: "success" });
      router.push("/dashboard/owner/listings/new");
      router.refresh();
    } catch (err) {
      toast(err.message, { type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <button type="button" onClick={upgrade} disabled={loading} className={`${className} disabled:opacity-70`}>
      {!compact && <Store className="h-4 w-4" />}
      {loading ? "Switching..." : children}
    </button>
  );
}
