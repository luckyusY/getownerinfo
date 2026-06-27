import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata = { title: "Privacy Policy - getownerinfo" };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="page-shell max-w-4xl">
        <section className="page-hero">
          <p className="eyebrow">Legal</p>
          <h1 className="mt-2 font-display text-4xl font-bold text-ink">Privacy Policy</h1>
          <p className="mt-2 text-sm text-ink-faint">Last updated: {new Date().getFullYear()}</p>
        </section>

        <div className="mt-8 card space-y-6">
          <Section title="What we collect">
            Account details, listing and request content, payment records, token-unlock logs, messages, and audit logs.
          </Section>
          <Section title="What stays hidden">
            National ID, passport numbers, ownership certificates, and personal documents are used only for admin verification and are never shown to buyers or tenants, even after a token unlock.
          </Section>
          <Section title="Contact unlocking">
            Owner contact and exact location are revealed only to a user who has paid the token fee for that listing. Revealed details are watermarked with the viewer's identity, and every unlock is recorded.
          </Section>
          <Section title="Data security">
            Sensitive data is protected in transit and at rest. Session and consent cookies use HttpOnly, Secure, and SameSite attributes. Access to administrative data is role-restricted.
          </Section>
          <Section title="Cookies">
            We use essential cookies for core functionality and optional analytics/preference cookies. You can manage these any time on the <a href="/cookies" className="font-semibold text-brand underline">cookie preferences</a> page.
          </Section>
          <Section title="Your rights">
            You may request access to or deletion of your personal data, subject to records we must retain for dispute resolution, commission enforcement, and legal compliance.
          </Section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section>
      <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
      <p className="mt-1 leading-relaxed text-ink-soft">{children}</p>
    </section>
  );
}
