import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata = { title: "Terms & Conditions - getownerinfo" };

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="page-shell max-w-4xl">
        <section className="page-hero">
          <p className="eyebrow">Legal</p>
          <h1 className="mt-2 font-display text-4xl font-bold text-ink">Terms &amp; Conditions</h1>
          <p className="mt-2 text-sm text-ink-faint">Last updated: {new Date().getFullYear()}</p>
        </section>

        <div className="mt-8 card space-y-6">
          <Section title="1. The service">
            getownerinfo connects owners with buyers and tenants. Owners list assets under a commission model (Model A) or a paid-listing model (Model B). Buyers pay a non-refundable token fee to unlock owner contact details and exact location.
          </Section>
          <Section title="2. Token fees">
            Token fees are non-refundable and grant access to contact information for a single listing. Sharing unlocked information externally is prohibited and logged.
          </Section>
          <Section title="3. Owner obligations (Model A)">
            After an off-platform deal completes, owners must report the outcome and final amount. Commission is calculated automatically. Under-reporting, late reporting, or false not-concluded claims may result in penalties.
          </Section>
          <Section title="4. Penalties">
            Confirmed abuse may incur a penalty of 50% of the expected fee/commission plus a fixed amount, and severe cases may lead to suspension. Outstanding balances block new exclusive listings.
          </Section>
          <Section title="5. Prohibited conduct">
            Bypassing token fees, sharing contact details before unlocking, posting duplicate or fraudulent listings, or misusing staff override rights is prohibited.
          </Section>
          <Section title="6. Payments & VAT">
            Listing fees and commissions are inclusive of 18% VAT. Payments are processed via supported providers such as mobile money, card, or bank transfer.
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
