import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata = { title: "FAQ - getownerinfo" };

const FAQS = [
  ["What is the token fee?", "A small, non-refundable fee that unlocks a listing's verified owner contact and exact location. It keeps inquiries serious and protects owner privacy."],
  ["Is my contact information safe as an owner?", "Yes. Your phone and exact address stay hidden until a buyer pays the token fee, and every unlock is logged and watermarked to the viewer."],
  ["What's the difference between Model A and Model B?", "Model A is exclusive and commission-based for eligible high-value, single-unit listings. Model B is a simple pay-to-list option for everything else."],
  ["How do payments work?", "We support mobile money, card, and bank transfer. Listing fees and commissions include 18% VAT."],
  ["Can I post what I'm looking for?", "Yes. Post a seeker request. It is public but anonymized, and owners pay a view token to reach you."],
];

export default function FaqPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="page-shell max-w-4xl">
        <section className="page-hero">
          <p className="eyebrow">Support</p>
          <h1 className="mt-2 font-display text-4xl font-bold text-ink">Frequently asked questions</h1>
          <p className="mt-3 max-w-2xl text-ink-soft">Clear answers about unlocks, privacy, payments, and listing models.</p>
        </section>
        <div className="mt-8 space-y-3">
          {FAQS.map(([q, a]) => (
            <details key={q} className="card group">
              <summary className="cursor-pointer list-none font-display text-lg font-semibold text-ink marker:hidden">
                <span className="flex items-center justify-between gap-3">
                  {q}<span className="text-brand transition group-open:rotate-45">+</span>
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">{a}</p>
            </details>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
