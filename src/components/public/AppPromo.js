import { Home, KeyRound, MapPin, Search, Smartphone, Tag } from "lucide-react";

/**
 * "Take GetOwnerInfo with you" panel.
 *
 * The apps are not published yet, so the store buttons are rendered as a
 * disabled notice rather than links to a store page that does not exist.
 */
export default function AppPromo() {
  return (
    <aside className="flex flex-col gap-5 overflow-hidden rounded-2xl border border-line bg-brand-50 p-5 lg:flex-row lg:items-center xl:flex-col">
      <div className="min-w-0 flex-1">
        <h2 className="font-display text-xl font-bold text-ink">
          Take <span className="text-brand">GetOwnerInfo</span> with you
        </h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-ink-soft">
          Find, save and contact owners anytime, anywhere.
        </p>

        <div className="mt-4 grid gap-2">
          <span className="inline-flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-2.5 text-left opacity-70">
            <Smartphone className="h-5 w-5 shrink-0 text-ink-soft" />
            <span>
              <span className="block text-[10px] font-bold uppercase tracking-wide text-ink-faint">Coming soon to</span>
              <span className="block text-sm font-black text-ink">Google Play &amp; App Store</span>
            </span>
          </span>
          <p className="text-xs font-semibold text-ink-faint">
            The mobile site works on every phone today — add it to your home screen.
          </p>
        </div>
      </div>

      {/* A stylised phone preview of the home screen. */}
      <div className="mx-auto w-[190px] shrink-0">
        <div className="rounded-[26px] border-[6px] border-ink bg-surface p-2 shadow-lift">
          <div className="flex items-center justify-center gap-1 pb-2">
            <span className="h-1 w-10 rounded-full bg-ink/20" />
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-getownerinfo-cropped-white.png" alt="" className="mx-auto h-6 w-auto object-contain" />
          <div className="mt-2 grid grid-cols-3 gap-1 text-[8px] font-bold">
            {[["Buy", Home], ["Rent", KeyRound], ["Sell", Tag]].map(([label, Icon]) => (
              <span key={label} className="flex flex-col items-center gap-0.5 rounded-md bg-brand-50 py-1.5 text-brand">
                <Icon className="h-3 w-3" />
                {label}
              </span>
            ))}
          </div>
          <div className="mt-1.5 flex items-center gap-1 rounded-md border border-line px-1.5 py-1 text-[8px] font-semibold text-ink-faint">
            <Search className="h-2.5 w-2.5" /> Search listings
          </div>
          <div className="mt-1.5 flex items-center gap-1 rounded-md border border-line px-1.5 py-1 text-[8px] font-semibold text-ink-faint">
            <MapPin className="h-2.5 w-2.5" /> Kigali, Rwanda
          </div>
          <div className="mt-1.5 grid gap-1">
            <span className="h-10 rounded-md bg-panel" />
            <span className="h-2 w-3/4 rounded-full bg-panel" />
            <span className="h-2 w-1/2 rounded-full bg-panel" />
          </div>
          <div className="mt-2 flex justify-center">
            <span className="h-1 w-12 rounded-full bg-ink/30" />
          </div>
        </div>
      </div>
    </aside>
  );
}
