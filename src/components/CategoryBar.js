"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LayoutGrid } from "lucide-react";

const LINKS = [
  ["Browse", "/listings"],
  ["Requests", "/seekers"],
  ["Pricing", "/pricing"],
  ["How it works", "/#how"],
  ["Contact", "/contact"],
];

const RIGHT = [
  ["Top listings", "/listings"],
  ["List your property", "/dashboard/owner/listings/new"],
  ["Pricing", "/pricing"],
  ["Support", "/support"],
];

export default function CategoryBar() {
  const pathname = usePathname();
  const [cats, setCats] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    fetch("/api/catalog").then((r) => r.json()).then((j) => setCats(j.data?.categories || []));
  }, []);

  useEffect(() => {
    function onDoc(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  return (
    <div className="hidden bg-[#0b5f86] text-white md:block">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4">
        <div className="flex items-center">
          {/* Categories dropdown */}
          <div className="relative" ref={ref}>
            <button
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              className="flex items-center gap-2 bg-white/10 px-4 py-2.5 text-sm font-bold transition hover:bg-white/15"
            >
              <LayoutGrid className="h-4 w-4" /> Categories <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
            </button>
            {open && (
              <div className="absolute left-0 top-full z-50 w-64 overflow-hidden rounded-b-xl border border-line bg-surface py-1 text-ink shadow-lift">
                {cats.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/listings?category=${c.slug}`}
                    onClick={() => setOpen(false)}
                    className="block px-4 py-2 text-sm font-semibold hover:bg-panel hover:text-brand"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Primary links */}
          <nav className="flex items-center">
            {LINKS.map(([label, href]) => {
              const active = href === "/" ? pathname === "/" : !href.includes("#") && (pathname === href || pathname.startsWith(`${href}/`));
              return (
                <Link
                  key={label}
                  href={href}
                  className={`px-3.5 py-2.5 text-sm font-bold transition hover:bg-white/10 ${active ? "bg-white/10" : "text-white/90"}`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right utility links */}
        <div className="hidden items-center gap-1 lg:flex">
          {RIGHT.map(([label, href]) => (
            <Link key={label} href={href} className="px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-white/85 transition hover:text-white">
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
