"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

const GIS_SCRIPT_ID = "google-identity-services";

export default function GoogleOneTap({ role = "buyer" }) {
  const prompted = useRef(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || prompted.current) return;
    prompted.current = true;

    function initializePrompt() {
      if (!window.google?.accounts?.id) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        auto_select: false,
        cancel_on_tap_outside: true,
        context: role === "owner" ? "signup" : "signin",
        callback: async ({ credential }) => {
          try {
            const res = await fetch("/api/auth/google/onetap", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ credential, role }),
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.error || "Google sign-in failed");
            toast("Signed in with Google.", { type: "success" });
            router.push("/dashboard");
            router.refresh();
          } catch (err) {
            toast(err.message, { type: "error" });
          }
        },
      });
      window.google.accounts.id.prompt();
    }

    const existingScript = document.getElementById(GIS_SCRIPT_ID);
    if (existingScript) {
      if (window.google?.accounts?.id) initializePrompt();
      else existingScript.addEventListener("load", initializePrompt, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = GIS_SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initializePrompt;
    document.head.appendChild(script);
  }, [role, router, toast]);

  return null;
}
