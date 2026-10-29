"use client";

import { useEffect, useState } from "react";
import { SectionHeading, Table, Td, Tr } from "@/components/ui/Dashboard";

export default function AuditViewer() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("");

  useEffect(() => {
    const qs = new URLSearchParams({ page: String(page) });
    if (action) qs.set("action", action);
    fetch(`/api/admin/audit?${qs}`).then((r) => r.json()).then((j) => setData(j.data));
  }, [page, action]);

  return (
    <section className="mt-10">
      <SectionHeading
        title="Audit log"
        action={
          <select className="input max-w-xs" value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }}>
            <option value="">All actions</option>
            {["listing.submit", "listing.approve", "listing.unlock", "listing.outcome", "payment.initiate",
              "commission.pay", "penalty.apply", "message.blocked", "seeker.create", "seeker.unlock"].map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        }
      />

      {!data ? (
        <p className="mt-3 text-sm font-semibold text-ink-faint">Loading...</p>
      ) : data.entries.length === 0 ? (
        <p className="mt-3 text-sm text-ink-faint">No audit entries.</p>
      ) : (
        <>
          <div className="mt-3">
            {/* Numbering continues across pages, so row 1 of page 2 is #26. */}
            <Table
              minWidth={760}
              startIndex={(data.page - 1) * (data.limit || data.entries.length)}
              head={["When", "Action", "Actor", "Target"]}
            >
              {data.entries.map((e) => (
                <Tr key={e.id}>
                  <Td className="whitespace-nowrap text-xs text-ink-faint">{new Date(e.at).toLocaleString()}</Td>
                  <Td className="font-mono text-xs text-ink">{e.action}</Td>
                  <Td className="text-ink">{e.actorName} <span className="text-xs text-ink-faint">({e.actorRole})</span></Td>
                  <Td className="text-xs text-ink-faint">{e.targetType}</Td>
                </Tr>
              ))}
            </Table>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 text-sm">
            <span className="font-semibold text-ink-faint">
              Page {data.page} of {data.totalPages} · {data.total.toLocaleString()} entries
            </span>
            <div className="flex gap-2">
              <button className="btn-outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
              <button className="btn-outline" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
