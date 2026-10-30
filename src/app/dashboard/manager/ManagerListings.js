"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, FileCheck2, MapPin, Unlock } from "lucide-react";
import { formatRwf, formatDate } from "@/lib/format";
import { SectionHeading } from "@/components/ui/Dashboard";
import EmptyState from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/Badge";

const FILTERS = [
  { value: "", label: "All" },
  { value: "pending_approval", label: "Awaiting approval" },
  { value: "active", label: "Active" },
  { value: "under_negotiation", label: "Under negotiation" },
  { value: "draft", label: "Drafts" },
];

/**
 * The manager's assigned listings. Read and support only — approving a listing
 * and editing an owner's content stay with the admin and the owner.
 */
export default function ManagerListings({ listings = [] }) {
  const [filter, setFilter] = useState("");
  const visible = filter ? listings.filter((l) => l.status === filter) : listings;

  return (
    <section className="mt-10">
      <SectionHeading
        title="Assigned listings"
        description="Everything an admin has put in your scope."
        action={
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input !w-auto"
            aria-label="Filter assigned listings"
          >
            {FILTERS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        }
      />

      {visible.length === 0 ? (
        <EmptyState
          title={listings.length === 0 ? "Nothing assigned yet" : "Nothing in this view"}
          hint={
            listings.length === 0
              ? "An admin has to assign a listing to you before it appears here."
              : "Try a different status filter."
          }
        />
      ) : (
        <div className="grid gap-3">
          {visible.map((l) => (
            <div key={l.id} className="card !p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-base font-bold text-ink">{l.title}</p>
                    <StatusBadge status={l.status} />
                    <span className="rounded-full bg-panel px-2 py-0.5 text-[11px] font-black text-ink-soft">
                      Model {l.model}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs font-semibold text-ink-faint">
                    {l.categoryName} · {l.ownerName} · updated {formatDate(l.updatedAt)}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold text-ink-soft">
                    <span>{formatRwf(l.price)}{l.transactionType === "rent" ? " / month" : ""}</span>
                    {l.area && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-brand" /> {l.area}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {l.viewCount} views</span>
                    <span className="inline-flex items-center gap-1"><Unlock className="h-3.5 w-3.5" /> {l.unlockCount} unlocks</span>
                    <span className="inline-flex items-center gap-1">
                      <FileCheck2 className="h-3.5 w-3.5" /> {l.proofCount} proof file{l.proofCount === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>

                <Link href={`/listings/${l.id}`} className="btn-outline shrink-0 !py-1.5 !text-xs">
                  Open listing
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
