"use client";

import { useState } from "react";
import Link from "next/link";

const NAV = [
  ["Home", "/"],
  ["Browse", "/listings"],
  ["Requests", "/seekers"],
  ["How it works", "/#how"],
  ["About", "/about"],
  ["FAQ", "/faq"],
  ["Contact", "/contact"],
];

export default function MobileMenu({ loggedIn, dashboardPath }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        aria-label="Menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-surface text-ink shadow-soft"
      >
        <span className="relative block h-3 w-4">
          <span className={`absolute left-0 top-0 h-0.5 w-4 bg-current transition ${open ? "translate-y-[5px] rotate-45" : ""}`} />
          <span className={`absolute left-0 top-[5px] h-0.5 w-4 bg-current transition ${open ? "opacity-0" : ""}`} />
          <span className={`absolute left-0 top-[10px] h-0.5 w-4 bg-current transition ${open ? "-translate-y-[5px] -rotate-45" : ""}`} />
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 top-[57px] z-40 bg-ink/30" onClick={() => setOpen(false)} />
          <nav className="absolute inset-x-0 top-full z-50 border-b border-line bg-surface px-4 py-3 shadow-lift">
            <div className="flex flex-col">
              {NAV.map(([label, href]) => (
                <Link key={label} href={href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-bold text-ink-soft hover:bg-panel hover:text-ink">
                  {label}
                </Link>
              ))}
              <div className="mt-2 flex gap-2 border-t border-line pt-3">
                {loggedIn ? (
                  <Link href={dashboardPath} onClick={() => setOpen(false)} className="btn-primary flex-1">Dashboard</Link>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setOpen(false)} className="btn-outline flex-1">Log in</Link>
                    <Link href="/register" onClick={() => setOpen(false)} className="btn-primary flex-1">Get started</Link>
                  </>
                )}
              </div>
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
