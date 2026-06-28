import SiteHeader from "@/components/SiteHeader";
import Skeleton from "@/components/ui/Skeleton";
import { BriefcaseBusiness, Car, Home, Refrigerator, Sofa, Store } from "lucide-react";

const CATEGORIES = [
  [Home, "Real Estate"],
  [Car, "Vehicles"],
  [Sofa, "Furniture"],
  [Refrigerator, "Appliances"],
  [Store, "Made in Rwanda"],
  [BriefcaseBusiness, "Business"],
];

export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <main>
        <section className="relative h-[clamp(520px,66vh,620px)] overflow-hidden bg-[#041c22] sm:h-[clamp(430px,38vw,520px)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_26%,rgba(22,163,204,0.32),transparent_32%),linear-gradient(120deg,#02181d,#073b4b_48%,#0b5f86)]" />
          <div className="mx-auto flex h-full max-w-6xl items-end px-5 pb-24 pt-8 sm:items-center sm:px-8 sm:pb-8">
            <div className="relative z-10 w-full max-w-xl border-l-4 border-[#16a3cc] pl-4 sm:pl-6">
              <Skeleton className="h-6 w-52 rounded-full bg-white/20" />
              <Skeleton className="mt-4 h-14 w-72 bg-white/18 sm:h-16 sm:w-96" />
              <Skeleton className="mt-3 h-14 w-64 bg-white/14 sm:w-[30rem]" />
              <div className="mt-6 flex gap-3">
                <Skeleton className="h-16 w-28 rounded-lg bg-white/16" />
                <Skeleton className="h-12 w-44 rounded-md bg-cyan-300/24" />
              </div>
            </div>
          </div>
        </section>

        <section className="relative z-20 -mt-12 bg-[#003b79] px-4 pb-4 pt-3 sm:-mt-16 sm:pb-5">
          <div className="mx-auto max-w-6xl">
            <div className="mb-3 flex items-center justify-between text-white">
              <span className="text-xs font-black uppercase tracking-[0.16em]">Shop by category</span>
              <span className="text-xs font-black uppercase tracking-wide text-cyan-100">Loading</span>
            </div>
            <div className="grid auto-cols-[152px] grid-flow-col gap-2 overflow-x-hidden sm:auto-cols-fr sm:grid-flow-row sm:grid-cols-3 lg:grid-cols-6">
              {CATEGORIES.map(([Icon, label]) => (
                <div key={label} className="relative flex min-h-[104px] flex-col justify-between overflow-hidden rounded-md bg-gradient-to-br from-[#16a3cc] via-[#0b7fa8] to-[#0b5f86] p-3 text-white ring-1 ring-white/10 sm:min-h-[118px]">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/16 ring-1 ring-white/15">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="font-display text-sm font-black">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-2 gap-3 rounded-xl border border-line bg-surface p-5 shadow-soft sm:grid-cols-4 sm:p-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center">
                <Skeleton className="h-9 w-14" />
                <Skeleton className="mt-3 h-3 w-24" />
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
