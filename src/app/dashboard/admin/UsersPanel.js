"use client";

import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, Ban, Search, ShieldCheck, UserCog, UserX } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { SectionHeading, Table, Tr, Td } from "@/components/ui/Dashboard";
import EmptyState from "@/components/ui/EmptyState";
import Badge from "@/components/ui/Badge";

const ROLE_LABELS = {
  admin: "Administrator",
  platform_listing_manager: "Listing Manager",
  owner: "Owner",
  agent: "Agent",
  buyer: "Buyer / Tenant",
};

const ROLE_FILTERS = [
  { value: "", label: "All roles" },
  { value: "owner", label: "Owners" },
  { value: "agent", label: "Agents" },
  { value: "buyer", label: "Buyers / Tenants" },
  { value: "platform_listing_manager", label: "Listing Managers" },
  { value: "admin", label: "Admins" },
];

const STATUS_FILTERS = [
  { value: "", label: "Any status" },
  { value: "kyc_pending", label: "KYC pending" },
  { value: "unverified", label: "Unverified" },
  { value: "suspended", label: "Suspended" },
  { value: "blacklisted", label: "Blacklisted" },
];

export default function UsersPanel() {
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (role) params.set("role", role);
    if (status) params.set("status", status);
    if (q.trim()) params.set("q", q.trim());
    try {
      const res = await fetch(`/api/admin/users?${params}`);
      const json = await res.json();
      if (json.success) setData(json.data);
    } finally {
      setLoading(false);
    }
  }, [role, status, q]);

  useEffect(() => {
    load();
  }, [role, status]); // eslint-disable-line react-hooks/exhaustive-deps

  async function update(userId, patch, label) {
    setBusyId(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...patch }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast(label, { type: "success" });
      await load();
    } catch (err) {
      toast(err.message, { type: "error" });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="mt-10">
      <SectionHeading
        title="Users"
        description="Every account on the platform. Change a role, promote a listing manager, or restrict an account."
      />

      <div className="mb-3 flex flex-wrap gap-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load();
          }}
          className="input-wrap !min-h-10 max-w-xs flex-1"
        >
          <Search className="h-4 w-4 shrink-0 text-ink-faint" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name, email or phone"
            aria-label="Search users"
            className="w-full bg-transparent text-sm font-semibold text-ink outline-none"
          />
        </form>
        <select value={role} onChange={(e) => setRole(e.target.value)} className="input !w-auto" aria-label="Filter by role">
          {ROLE_FILTERS.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="input !w-auto" aria-label="Filter by status">
          {STATUS_FILTERS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {data && (
        <div className="mb-3 flex flex-wrap gap-2 text-xs font-bold text-ink-soft">
          {Object.entries(data.roleCounts || {}).map(([r, n]) => (
            <span key={r} className="rounded-full bg-panel px-2.5 py-1">
              {ROLE_LABELS[r] || r}: {n}
            </span>
          ))}
        </div>
      )}

      {loading ? (
        <p className="text-sm font-semibold text-ink-faint">Loading users…</p>
      ) : !data?.users?.length ? (
        <EmptyState title="No users match" hint="Try a different role, status or search term." />
      ) : (
        <>
          <Table head={["User", "Role", "Verification", "Activity", "Owes", "Status", "Actions"]}>
            {data.users.map((u) => (
              <Tr key={u.id}>
                <Td>
                  <p className="font-semibold text-ink">{u.name}</p>
                  <p className="text-xs text-ink-faint">{u.email}</p>
                  {u.phone && <p className="text-xs text-ink-faint">{u.phone}</p>}
                </Td>
                <Td>
                  <select
                    value={u.role}
                    disabled={busyId === u.id}
                    onChange={(e) => update(u.id, { role: e.target.value }, `${u.name} is now ${ROLE_LABELS[e.target.value]}`)}
                    className="input !w-auto !py-1 !text-xs"
                    aria-label={`Role for ${u.name}`}
                  >
                    {Object.entries(ROLE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-1">
                    <Badge tone={u.isVerified ? "success" : "neutral"}>
                      {u.isVerified ? "ID verified" : `KYC ${u.kycStatus}`}
                    </Badge>
                    {u.emailVerified && <Badge tone="success">Email</Badge>}
                    {u.phoneVerified && <Badge tone="success">Phone</Badge>}
                  </div>
                </Td>
                <Td className="whitespace-nowrap text-xs font-bold text-ink-soft">
                  {u.listings} listings · {u.unlocks} unlocks
                </Td>
                <Td className="whitespace-nowrap text-xs font-bold text-ink">
                  {u.commissionDue + u.penaltyBalance > 0
                    ? `${(u.commissionDue + u.penaltyBalance).toLocaleString("en-RW")} Rwf`
                    : "—"}
                </Td>
                <Td>
                  {u.isBlacklisted ? (
                    <Badge tone="danger" dot>Blacklisted</Badge>
                  ) : !u.isActive ? (
                    <Badge tone="warning" dot>Suspended</Badge>
                  ) : (
                    <Badge tone="success" dot>Active</Badge>
                  )}
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-1.5">
                    {u.role !== "platform_listing_manager" && (
                      <button
                        type="button"
                        disabled={busyId === u.id}
                        onClick={() => update(u.id, { role: "platform_listing_manager" }, `${u.name} promoted to Listing Manager`)}
                        className="btn-outline !min-h-8 !py-1 !text-xs"
                        title="Promote to listing manager"
                      >
                        <UserCog className="h-3.5 w-3.5" /> Make manager
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={busyId === u.id}
                      onClick={() =>
                        update(u.id, { isActive: !u.isActive }, u.isActive ? `${u.name} suspended` : `${u.name} reinstated`)
                      }
                      className="btn-outline !min-h-8 !py-1 !text-xs"
                    >
                      {u.isActive ? <UserX className="h-3.5 w-3.5" /> : <BadgeCheck className="h-3.5 w-3.5" />}
                      {u.isActive ? "Suspend" : "Reinstate"}
                    </button>
                    <button
                      type="button"
                      disabled={busyId === u.id}
                      onClick={() =>
                        update(
                          u.id,
                          { isBlacklisted: !u.isBlacklisted },
                          u.isBlacklisted ? `${u.name} removed from blacklist` : `${u.name} blacklisted`
                        )
                      }
                      className={`btn-outline !min-h-8 !py-1 !text-xs ${u.isBlacklisted ? "" : "text-red-700"}`}
                    >
                      {u.isBlacklisted ? <ShieldCheck className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                      {u.isBlacklisted ? "Un-blacklist" : "Blacklist"}
                    </button>
                  </div>
                </Td>
              </Tr>
            ))}
          </Table>
          <p className="mt-2 text-xs font-semibold text-ink-faint">
            Showing {data.users.length} of {data.total}
          </p>
        </>
      )}
    </section>
  );
}
