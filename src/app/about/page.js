import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata = { title: "About — getownerinfo" };

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-14">
        <h1 className="font-display text-4xl font-bold text-ink">About getownerinfo</h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-soft">
          getownerinfo is a hybrid marketplace that connects serious buyers and tenants
          directly with verified owners across Rwanda — property, vehicles, furniture and
          more. We remove the broker layer while protecting owner privacy.
        </p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {[
            ["Our mission", "Make finding the real owner simple, direct and trustworthy."],
            ["Verified first", "Every listing is checked by our team before it goes live."],
            ["Privacy by design", "Contact and exact location stay hidden until a token fee is paid."],
            ["Fair & accountable", "Automatic commission and penalty enforcement keep deals honest."],
          ].map(([t, b]) => (
            <div key={t} className="card">
              <h2 className="font-display text-lg font-semibold text-ink">{t}</h2>
              <p className="mt-2 text-sm text-ink-soft">{b}</p>
            </div>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
