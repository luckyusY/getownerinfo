import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata = { title: "About - getownerinfo" };

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="page-shell">
        <section className="page-hero">
          <p className="eyebrow">About getownerinfo</p>
          <h1 className="mt-2 max-w-3xl font-display text-4xl font-bold text-ink">Direct access to verified owners across Rwanda.</h1>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-ink-soft">
            getownerinfo connects serious buyers and tenants directly with verified owners across property, vehicles, furniture, and more. We remove the broker layer while protecting owner privacy.
          </p>
        </section>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {[
            ["Our mission", "Make finding the real owner simple, direct, and trustworthy."],
            ["Verified first", "Every listing is checked by our team before it goes live."],
            ["Privacy by design", "Contact and exact location stay hidden until a token fee is paid."],
            ["Fair and accountable", "Commission and penalty enforcement helps keep deals honest."],
          ].map(([t, b]) => (
            <div key={t} className="card">
              <h2 className="font-display text-lg font-semibold text-ink">{t}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{b}</p>
            </div>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
