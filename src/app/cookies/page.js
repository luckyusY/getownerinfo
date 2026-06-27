import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import CookiePrefs from "./CookiePrefs";

export const metadata = { title: "Cookie preferences - getownerinfo" };

export default function CookiePreferencesPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="page-shell max-w-3xl">
        <section className="page-hero">
          <p className="eyebrow">Preferences</p>
          <h1 className="mt-2 font-display text-4xl font-bold text-ink">Cookie preferences</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-soft">
            Disabling optional cookies will not affect core features like login, token unlocks, or payments.
          </p>
        </section>
        <CookiePrefs />
      </main>
      <SiteFooter />
    </div>
  );
}
