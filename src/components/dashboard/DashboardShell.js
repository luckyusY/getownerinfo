"use client";

import { Suspense, useState } from "react";
import DashboardTopbar from "./DashboardTopbar";
import DashboardSidebar from "./DashboardSidebar";

/**
 * Dashboard chrome: fixed top bar, a sidebar that becomes a slide-over on
 * small screens, and the page content. Holds the only piece of state the
 * chrome needs — whether the mobile sidebar is open.
 */
export default function DashboardShell({ user, counts, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-paper">
      <DashboardTopbar
        user={user}
        unreadCount={counts.notifications}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
      />

      <div className="mx-auto flex max-w-[1600px] gap-6 px-3 py-4 sm:px-4 sm:py-6">
        {/* Backdrop for the mobile slide-over. */}
        {sidebarOpen && (
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-30 bg-ink/40 lg:hidden"
          />
        )}

        <aside
          className={`fixed inset-y-0 left-0 z-40 w-[272px] overflow-y-auto bg-paper p-3 transition-transform duration-200 lg:static lg:z-auto lg:w-60 lg:shrink-0 lg:overflow-visible lg:bg-transparent lg:p-0 lg:transition-none ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          {/*
            On desktop the sidebar is its own scroll container pinned below the
            top bar. Without this the wheel falls through to the document and
            scrolls the whole page — and a nav taller than the viewport could
            not be reached at all. `overscroll-contain` stops the scroll
            chaining to the page once the nav hits its end.
          */}
          <div
            className="lg:sticky lg:top-[76px] lg:max-h-[calc(100vh-92px)] lg:overflow-y-auto lg:overscroll-contain"
            onClick={() => setSidebarOpen(false)}
          >
            <Suspense fallback={<div className="h-96 rounded-2xl border border-line bg-surface shadow-soft" />}>
              <DashboardSidebar role={user.role} counts={counts} />
            </Suspense>
          </div>
        </aside>

        <main className="min-w-0 flex-1 pb-12">{children}</main>
      </div>
    </div>
  );
}
