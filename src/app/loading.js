import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Skeleton from "@/components/ui/Skeleton";

/**
 * Root route-loading skeleton.
 *
 * This mirrors the live homepage so the transition is invisible: same light
 * surface, same max-w-7xl, same hero → categories → featured order. It
 * previously mocked the old cyan design, which made every slow load flash a
 * dark teal page before the real one painted.
 */
export default function Loading() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main>
        {/* Hero: headline, subtitle, then the tabbed search panel. */}
        <section className="relative isolate overflow-hidden bg-paper">
          <div className="relative mx-auto grid max-w-7xl gap-8 px-4 pb-8 pt-10 lg:grid-cols-[1.35fr_0.65fr] lg:pb-12 lg:pt-16">
            <div className="min-w-0 max-w-2xl">
              <Skeleton className="h-11 w-full max-w-md sm:h-14" />
              <Skeleton className="mt-3 h-11 w-3/4 max-w-sm sm:h-14" />
              <Skeleton className="mt-5 h-5 w-72 max-w-full" />

              <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-surface shadow-lift">
                <div className="flex gap-2 border-b border-line p-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-24 rounded-lg" />
                  ))}
                </div>
                <div className="grid gap-2 p-3 lg:grid-cols-[1fr_1fr_1fr_1.3fr_auto]">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-[58px] rounded-xl" />
                  ))}
                  <Skeleton className="h-[58px] w-full rounded-xl lg:w-28" />
                </div>
              </div>
            </div>

            {/* The four promises panel. */}
            <aside className="hidden min-w-0 self-center rounded-2xl border border-line bg-surface/95 p-5 shadow-lift lg:block">
              <div className="grid gap-5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
                    <div className="min-w-0 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="mt-2 h-3 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </section>

        {/* Category shortcuts. */}
        <section className="mx-auto max-w-7xl px-4 py-6">
          <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-5 lg:grid-cols-10">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-2 rounded-xl border border-line bg-surface p-3"
              >
                <Skeleton className="h-10 w-10 rounded-xl" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        </section>

        {/* Featured listings. */}
        <section className="mx-auto max-w-7xl px-4 py-6">
          <Skeleton className="h-7 w-52" />
          <Skeleton className="mt-2 h-4 w-72" />
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-line bg-surface shadow-soft">
                <Skeleton className="aspect-[4/3] w-full rounded-none" />
                <div className="p-4">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="mt-2 h-4 w-full" />
                  <Skeleton className="mt-2 h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
