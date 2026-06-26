import SiteHeader from "@/components/SiteHeader";
import CookiePrefs from "./CookiePrefs";

export const metadata = { title: "Cookie preferences — getownerinfo" };

export default function CookiePreferencesPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-2xl font-bold text-slate-900">Cookie preferences</h1>
        <p className="mt-1 text-sm text-slate-600">
          Disabling optional cookies won&apos;t affect core features like login, token unlocks or payments.
        </p>
        <CookiePrefs />
      </main>
    </div>
  );
}
