"use client";

import { useEffect, useState } from "react";
import {
  BarChart3, BellRing, FileWarning, Gavel, History, ListChecks, ShieldCheck, Users,
} from "lucide-react";

const SECTIONS = [
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "verification", label: "Verification", icon: ShieldCheck },
  { id: "reports", label: "Reports", icon: BellRing },
  { id: "moderation", label: "Moderation", icon: ListChecks },
  { id: "assignments", label: "Assignments", icon: Users },
  { id: "drafts", label: "Incomplete", icon: FileWarning },
  { id: "users", label: "Users", icon: Users },
  { id: "penalties", label: "Penalties", icon: Gavel },
  { id: "audit", label: "Audit log", icon: History },
];

/**
 * Jump between the admin sections instead of scrolling through all of them.
 * The active chip follows whichever section is currently in view.
 */
export default function AdminSectionNav() {
  const [active, setActive] = useState(SECTIONS[0].id);

  useEffect(() => {
    const nodes = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean);
    if (!nodes.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // The topmost section currently intersecting wins, so the chip does not
        // flicker between two sections that are both partly visible.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-100px 0px -60% 0px", threshold: 0 }
    );

    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, []);

  return (
    <nav
      aria-label="Admin sections"
      className="sticky top-[76px] z-20 -mx-1 mt-6 rounded-xl border border-line bg-surface/95 px-1 py-1.5 shadow-soft backdrop-blur"
    >
      <ul className="flex gap-1 overflow-x-auto">
        {SECTIONS.map(({ id, label, icon: Icon }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              aria-current={active === id ? "true" : undefined}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                active === id ? "bg-brand text-white" : "text-ink-soft hover:bg-brand-50 hover:text-brand"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
