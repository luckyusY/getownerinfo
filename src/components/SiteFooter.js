import Link from "next/link";
import { Globe, MapPin } from "lucide-react";
import NewsletterForm from "@/components/public/NewsletterForm";

const COLUMNS = [
  {
    title: "Marketplace",
    links: [
      ["Buy", "/listings?type=sale"],
      ["Rent", "/listings?type=rent"],
      ["Sell", "/dashboard/owner/listings/new"],
      ["Post a Request", "/seekers/new"],
      ["Browse All Listings", "/listings"],
    ],
  },
  {
    title: "Information",
    links: [
      ["How It Works", "/#how"],
      ["Pricing", "/pricing"],
      ["Terms of Use", "/terms"],
      ["Privacy Policy", "/privacy"],
      ["FAQs", "/faq"],
    ],
  },
  {
    title: "Support",
    links: [
      ["Contact Us", "/contact"],
      ["Help Center", "/faq"],
      ["Report a Listing", "/contact"],
      ["Cookie Preferences", "/cookies"],
    ],
  },
  {
    title: "For Business",
    links: [
      ["List Your Property", "/dashboard/owner/listings/new"],
      ["List Your Vehicle", "/dashboard/owner/listings/new"],
      ["Business Solutions", "/contact"],
      ["Partnerships", "/contact"],
    ],
  },
];

// Real brand icons (lucide removed brand glyphs). Paths from simple-icons.
const SOCIALS = [
  { label: "Facebook", href: "https://facebook.com/getownerinfo", path: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" },
  { label: "Instagram", href: "https://instagram.com/getownerinfo", path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" },
  { label: "X", href: "https://x.com/getownerinfo", path: "M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" },
  { label: "LinkedIn", href: "https://linkedin.com/company/getownerinfo", path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" },
  { label: "YouTube", href: "https://youtube.com/@getownerinfo", path: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" },
];

export default function SiteFooter() {
  return (
    <footer className="mt-16 bg-navy text-white/75">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_2fr_1.1fr]">
          <div>
            <Link href="/" className="inline-flex items-center" aria-label="Get Owner Info home">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/logo-getownerinfo-transparent.png"
                alt="Get Owner Info"
                className="h-11 w-auto object-contain brightness-0 invert"
              />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-6">
              A trusted classifieds platform that connects buyers, tenants and clients directly with
              the owners themselves.
            </p>
            <ul className="mt-5 flex gap-3">
              {SOCIALS.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={s.label}
                    className="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition hover:bg-brand active:scale-95"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                      <path d={s.path} />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h3 className="text-sm font-bold text-white">{col.title}</h3>
                <ul className="mt-1 grid">
                  {col.links.map(([label, href]) => (
                    <li key={label}>
                      <Link href={href} className="flex min-h-11 items-center text-sm transition hover:text-white active:text-white">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div>
            <h3 className="text-sm font-bold text-white">Subscribe to our newsletter</h3>
            <p className="mt-2 text-sm leading-6">Get the latest listings, tips and updates.</p>
            <NewsletterForm />
          </div>
        </div>
      </div>

      <div className="border-t border-navy-line">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 text-xs font-semibold">
          <p>© {new Date().getFullYear()} GetOwnerInfo. All rights reserved.</p>
          <p className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> Rwanda
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" /> English
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
