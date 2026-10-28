import Link from "next/link";
import {
  Briefcase, Building2, Car, Grid3x3, Home, Laptop, Leaf, Sofa, Wrench,
} from "lucide-react";

/**
 * Category shortcuts under the hero. Icons are mapped by slug so a category
 * added in the admin catalog still renders with a sensible default.
 */
const ICONS = {
  "real-estate": Home,
  vehicles: Car,
  "vehicle-resellers": Car,
  "home-appliances": Laptop,
  "home-office-furniture": Sofa,
  "business-industry": Building2,
  "made-in-rwanda": Leaf,
  machinery: Wrench,
  jobs: Briefcase,
};

export default function CategoryIconRow({ categories = [], activeSlug = null }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-6">
      <ul className="grid grid-cols-4 gap-2.5 sm:grid-cols-5 lg:grid-cols-10">
        {categories.map((c) => {
          const Icon = ICONS[c.slug] || Grid3x3;
          const active = c.slug === activeSlug;
          return (
            <li key={c.slug}>
              <Link
                href={`/listings?category=${c.slug}`}
                className={`flex h-full flex-col items-center justify-center gap-2 rounded-xl border p-3 text-center transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-soft ${
                  active ? "border-brand bg-brand-50" : "border-line bg-surface"
                }`}
              >
                <span className={`grid h-10 w-10 place-items-center rounded-xl ${active ? "bg-brand text-white" : "bg-brand-50 text-brand"}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className={`text-[11px] font-bold leading-tight ${active ? "text-brand" : "text-ink-soft"}`}>
                  {c.name}
                </span>
              </Link>
            </li>
          );
        })}

        <li>
          <Link
            href="/listings"
            className="flex h-full flex-col items-center justify-center gap-2 rounded-xl border border-line bg-surface p-3 text-center transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-soft"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-panel text-ink-soft">
              <Grid3x3 className="h-5 w-5" />
            </span>
            <span className="text-[11px] font-bold leading-tight text-ink-soft">More</span>
          </Link>
        </li>
      </ul>
    </section>
  );
}
