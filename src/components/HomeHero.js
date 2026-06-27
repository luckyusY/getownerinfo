import Link from "next/link";

const PROMOS = [
  {
    eyebrow: "Real Estate",
    title: "Houses, apartments & land — direct from verified owners.",
    href: "/listings?category=real-estate",
    image: "https://picsum.photos/seed/goi-realestate/700/500",
    tone: "image",
  },
  {
    eyebrow: "Vehicles",
    title: "Cars, bikes & trucks, straight from the owner.",
    href: "/listings?category=vehicles",
    tone: "blue",
  },
];

export default function HomeHero({ heroImage, heroHref = "/listings" }) {
  const bg = heroImage || "https://picsum.photos/seed/goi-hero-feature/1100/760";

  return (
    <section className="bg-[#0b5f86]">
      <div className="mx-auto grid max-w-6xl gap-3 px-4 py-4 lg:grid-cols-3 lg:py-5">
        {/* Featured panel */}
        <Link
          href={heroHref}
          className="group relative col-span-1 flex min-h-[340px] flex-col justify-end overflow-hidden rounded-xl bg-ink lg:col-span-2 lg:min-h-[440px]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={bg} alt="" loading="eager" className="absolute inset-0 h-full w-full object-cover opacity-70 transition duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />
          <div className="relative p-6 sm:p-9">
            <span className="badge bg-[#e6492d] text-white">Verified owners</span>
            <p className="mt-3 text-sm font-bold uppercase tracking-wide text-white/80">getownerinfo Rwanda</p>
            <h1 className="mt-1 max-w-xl font-display text-4xl font-extrabold leading-[1.04] text-white sm:text-5xl lg:text-6xl">
              Find the real owner. Skip the brokers.
            </h1>
            <p className="mt-3 max-w-md text-sm text-white/85 sm:text-base">
              Property, vehicles and assets across Rwanda — unlock direct contact and exact location in seconds.
            </p>
            <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#0b5f86] transition group-hover:bg-[#ffcf57]">
              Browse listings →
            </span>
          </div>
        </Link>

        {/* Stacked promo cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {PROMOS.map((p) => (
            <Link
              key={p.eyebrow}
              href={p.href}
              className={`group relative flex min-h-[160px] flex-col justify-start overflow-hidden rounded-xl p-5 lg:min-h-[214px] ${p.tone === "blue" ? "bg-[#0a4f6b]" : "bg-ink"}`}
            >
              {p.tone === "image" && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-65 transition duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/10" />
                </>
              )}
              <div className="relative">
                <p className="text-xs font-extrabold uppercase tracking-wide text-[#ffcf57]">{p.eyebrow}</p>
                <p className="mt-1.5 max-w-[16rem] font-display text-lg font-bold leading-snug text-white">{p.title}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
