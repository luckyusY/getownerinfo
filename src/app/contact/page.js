import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { FormField, TextareaInput, TextInput } from "@/components/ui/Form";

export const metadata = { title: "Contact - getownerinfo" };

export default function ContactPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="page-shell">
        <section className="page-hero">
          <p className="eyebrow">Contact</p>
          <h1 className="mt-2 font-display text-4xl font-bold text-ink">Get in touch</h1>
          <p className="mt-3 max-w-2xl text-ink-soft">
            Questions about a listing, your account, or partnering with us? We are here to help.
          </p>
        </section>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            ["Call us", "+250 788 385 831", "tel:+250788385831"],
            ["Email", "info@getownerinfo.com", "mailto:info@getownerinfo.com"],
            ["Visit", "Kigali, Rwanda", null],
          ].map(([t, v, href]) => (
            <div key={t} className="card">
              <p className="eyebrow">{t}</p>
              {href ? (
                <a href={href} className="mt-2 block font-semibold text-brand">{v}</a>
              ) : (
                <p className="mt-2 font-semibold text-ink">{v}</p>
              )}
            </div>
          ))}
        </div>

        <form className="mt-8 card space-y-4" action="#">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Your name"><TextInput icon="user" /></FormField>
            <FormField label="Email"><TextInput icon="mail" type="email" /></FormField>
          </div>
          <FormField label="Message"><TextareaInput icon="message" rows={4} /></FormField>
          <button className="btn-primary magnetic-link">Send message</button>
          <p className="text-xs text-ink-faint">This demo form is not wired to email yet.</p>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}
