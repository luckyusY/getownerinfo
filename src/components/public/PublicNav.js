"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

/**
 * Primary public navigation. Each menu opens on hover (pointer) and on click
 * or Enter (keyboard/touch), and closes on Escape or an outside click.
 */
const MENUS = [
  {
    label: "Buy",
    href: "/listings?type=sale",
    groups: [
      {
        title: "Property",
        links: [
          ["Houses for sale", "/listings?category=real-estate&type=sale"],
          ["Apartments", "/listings?category=real-estate&type=sale&item=Apartment"],
          ["Land & plots", "/listings?category=real-estate&type=sale&sub=land"],
        ],
      },
      {
        title: "Vehicles & assets",
        links: [
          ["Cars", "/listings?category=vehicles"],
          ["Motorcycles", "/listings?category=vehicles&sub=motorcycles"],
          ["Machinery", "/listings?category=business-industry"],
        ],
      },
      {
        title: "Home & office",
        links: [
          ["Furniture", "/listings?category=home-office-furniture"],
          ["Appliances", "/listings?category=home-appliances"],
          ["Made in Rwanda", "/listings?category=made-in-rwanda"],
        ],
      },
    ],
  },
  {
    label: "Rent",
    href: "/listings?type=rent",
    groups: [
      {
        title: "Residential",
        links: [
          ["Apartments to rent", "/listings?category=real-estate&type=rent"],
          ["Houses to rent", "/listings?category=real-estate&type=rent&item=House"],
          ["Studios", "/listings?category=real-estate&type=rent&item=Studio"],
        ],
      },
      {
        title: "Commercial",
        links: [
          ["Offices", "/listings?category=real-estate&type=rent&sub=commercial"],
          ["Shops", "/listings?category=real-estate&type=rent&item=Shop"],
          ["Warehouses", "/listings?category=real-estate&type=rent&item=Warehouse"],
        ],
      },
      {
        title: "Popular areas",
        links: [
          ["Kacyiru", "/listings?location=Kacyiru"],
          ["Nyarutarama", "/listings?location=Nyarutarama"],
          ["Kimironko", "/listings?location=Kimironko"],
        ],
      },
    ],
  },
  {
    label: "Sell",
    href: "/register?role=owner",
    groups: [
      {
        title: "Start listing",
        links: [
          ["List your property", "/dashboard/owner/listings/new"],
          ["List your vehicle", "/dashboard/owner/listings/new"],
          ["Business solutions", "/contact"],
        ],
      },
      {
        title: "How selling works",
        links: [
          ["Pricing & fees", "/pricing"],
          ["Model A vs Model B", "/pricing#models"],
          ["Owner verification", "/faq"],
        ],
      },
    ],
  },
  { label: "Post a Request", href: "/seekers/new" },
  { label: "How It Works", href: "/#how" },
  {
    label: "Explore",
    href: "/listings",
    groups: [
      {
        title: "Discover",
        links: [
          ["All listings", "/listings"],
          ["Buyer requests", "/seekers"],
          ["Popular locations", "/#locations"],
        ],
      },
      {
        title: "About us",
        links: [
          ["About GetOwnerInfo", "/about"],
          ["FAQs", "/faq"],
          ["Contact us", "/contact"],
        ],
      },
    ],
  },
];

export default function PublicNav() {
  const [open, setOpen] = useState(null);
  const navRef = useRef(null);

  useEffect(() => {
    function onClick(e) {
      if (navRef.current && !navRef.current.contains(e.target)) setOpen(null);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(null);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <nav ref={navRef} onMouseLeave={() => setOpen(null)} className="relative hidden lg:block">
      <ul className="flex items-center gap-0.5">
        {MENUS.map((menu) => (
          <li key={menu.label}>
            <Link
              href={menu.href}
              onMouseEnter={() => setOpen(menu.groups ? menu.label : null)}
              onClick={(e) => {
                if (!menu.groups) return;
                // First tap opens the menu; the "See all" link inside navigates.
                if (open !== menu.label) {
                  e.preventDefault();
                  setOpen(menu.label);
                }
              }}
              aria-expanded={menu.groups ? open === menu.label : undefined}
              aria-haspopup={menu.groups ? "true" : undefined}
              className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-bold transition ${
                open === menu.label ? "bg-brand-50 text-brand" : "text-ink-soft hover:bg-panel hover:text-ink"
              }`}
            >
              {menu.label}
              {menu.groups && (
                <ChevronDown className={`h-3.5 w-3.5 transition ${open === menu.label ? "rotate-180" : ""}`} />
              )}
            </Link>
          </li>
        ))}
      </ul>

      {MENUS.filter((m) => m.groups && m.label === open).map((menu) => (
        <div
          key={menu.label}
          className="absolute left-0 top-full z-50 mt-1 w-[min(680px,calc(100vw-48px))] rounded-2xl border border-line bg-surface p-5 shadow-lift"
        >
          <div className="flex items-center justify-between pb-3">
            <p className="font-display text-base font-bold text-ink">{menu.label}</p>
            <Link href={menu.href} onClick={() => setOpen(null)} className="text-sm font-bold text-brand hover:text-brand-dark">
              See all
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {menu.groups.map((group) => (
              <div key={group.title}>
                <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-ink-faint">{group.title}</p>
                <ul className="grid gap-1">
                  {group.links.map(([label, href]) => (
                    <li key={label}>
                      <Link
                        href={href}
                        onClick={() => setOpen(null)}
                        className="block rounded-lg px-2.5 py-2 text-sm font-semibold text-ink-soft transition hover:bg-brand-50 hover:text-brand"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}
