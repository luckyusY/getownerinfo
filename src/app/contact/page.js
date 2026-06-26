import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata = { title: "Contact — getownerinfo" };

export default function ContactPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-14">
        <h1 className="font-display text-4xl font-bold text-ink">Get in touch</h1>
        <p className="mt-3 text-ink-soft">
          Questions about a listing, your account, or partnering with us? We&apos;re here to help.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            ["Call us", "+250 788 385 831", "tel:+250788385831"],
            ["Email", "info@getownerinfo.com", "mailto:info@getownerinfo.com"],
            ["Visit", "Kigali, Rwanda", null],
          ].map(([t, v, href]) => (
            <div key={t} className="card">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">{t}</p>
              {href ? (
                <a href={href} className="mt-1 block font-semibold text-brand">{v}</a>
              ) : (
                <p className="mt-1 font-semibold text-ink">{v}</p>
              )}
            </div>
          ))}
        </div>

        <form className="mt-8 card space-y-4" action="#">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label">Your name</label><input className="input" /></div>
            <div><label className="label">Email</label><input type="email" className="input" /></div>
          </div>
          <div><label className="label">Message</label><textarea rows={4} className="input" /></div>
          <button className="btn-primary">Send message</button>
          <p className="text-xs text-ink-faint">This demo form isn&apos;t wired to email yet.</p>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}
