"use client";

import { useCallback, useEffect, useState } from "react";
import { UserCog } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { SectionHeading, Table, Tr, Td } from "@/components/ui/Dashboard";
import EmptyState from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/Badge";

const SCOPES = [
  { value: "pending_approval", label: "Pending approval" },
  { value: "active", label: "Active" },
  { value: "under_negotiation", label: "Under negotiation" },
];

/**
 * Assign listings to listing managers. A manager only ever sees the listings
 * assigned to them, so this is what gives them a workload at all.
 */
export default function AssignmentsPanel() {
  const { toast } = useToast();
  const [scope, setScope] = useState("pending_approval");
  const [listings, setListings] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [l, m] = await Promise.all([
        fetch(`/api/admin/listings?status=${scope}`).then((r) => r.json()),
        fetch("/api/admin/users?role=platform_listing_manager").then((r) => r.json()),
      ]);
      setListings(l.data?.listings || []);
      setManagers((m.data?.users || []).filter((u) => u.isActive && !u.isBlacklisted));
    } finally {
      setLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    load();
  }, [load]);

  async function assign(listing, managerId) {
    setBusyId(listing.id);
    try {
      const res = await fetch("/api/admin/listings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id, assignedManager: managerId || null }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast(
        json.data.assignedManagerName
          ? `Assigned to ${json.data.assignedManagerName}`
          : "Assignment cleared",
        { type: "success" }
      );
      setListings((ls) =>
        ls.map((l) =>
          l.id === listing.id
            ? { ...l, assignedManagerId: json.data.assignedManagerId, assignedManagerName: json.data.assignedManagerName }
            : l
        )
      );
    } catch (err) {
      toast(err.message, { type: "error" });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="mt-10">
      <SectionHeading
        title="Listing manager assignments"
        description="A manager's dashboard is scoped to the listings assigned to them here."
        action={
          <select value={scope} onChange={(e) => setScope(e.target.value)} className="input !w-auto" aria-label="Listing status">
            {SCOPES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        }
      />

      {managers.length === 0 && !loading && (
        <p className="mb-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900">
          There are no active listing managers yet. Promote an account from the Users section below first.
        </p>
      )}

      {loading ? (
        <p className="text-sm font-semibold text-ink-faint">Loading listings…</p>
      ) : listings.length === 0 ? (
        <EmptyState title="Nothing in this view" hint="No listings currently have this status." />
      ) : (
        <Table head={["Listing", "Owner", "Status", "Assigned manager"]}>
          {listings.map((l) => (
            <Tr key={l.id}>
              <Td>
                <p className="font-semibold text-ink">{l.title}</p>
                <p className="text-xs text-ink-faint">{l.categoryName} · Model {l.model}</p>
              </Td>
              <Td>
                <p className="text-sm text-ink">{l.ownerName}</p>
                <p className="text-xs text-ink-faint">{l.ownerEmail}</p>
              </Td>
              <Td><StatusBadge status={l.status} /></Td>
              <Td>
                <div className="flex items-center gap-2">
                  <UserCog className="h-4 w-4 shrink-0 text-ink-faint" />
                  <select
                    value={l.assignedManagerId || ""}
                    disabled={busyId === l.id || managers.length === 0}
                    onChange={(e) => assign(l, e.target.value)}
                    className="input !w-auto !py-1 !text-base lg:!text-xs"
                    aria-label={`Assign a manager to ${l.title}`}
                  >
                    <option value="">Unassigned</option>
                    {managers.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </Td>
            </Tr>
          ))}
        </Table>
      )}
    </section>
  );
}
