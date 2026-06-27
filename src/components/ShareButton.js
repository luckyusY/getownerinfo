"use client";

import { Share2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function ShareButton({ title }) {
  const { toast } = useToast();

  async function onClick() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({ title: title || "getownerinfo", url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast("Link copied to clipboard", { type: "success" });
    } catch {
      // user cancelled share — no-op
    }
  }

  return (
    <button onClick={onClick} className="btn-outline" aria-label="Share listing">
      <Share2 className="h-4 w-4" /> Share
    </button>
  );
}
