"use client";

import { Banknote, BadgeCheck, Check, Info, Lock, ShieldCheck } from "lucide-react";

function money(n) {
  return n == null ? "—" : `${new Intl.NumberFormat("en-RW").format(n)} Rwf`;
}

function percent(n) {
  return n == null ? "—" : `${(n * 100).toFixed(n * 100 % 1 === 0 ? 0 : 1)}%`;
}

/**
 * Model A / Model B selection (spec Part 15).
 *
 * When a listing qualifies for both, the seller must actively choose — nothing
 * is pre-selected. When only one model applies, the step explains which one was
 * determined and why, and there is nothing to pick.
 */
export default function ModelSelection({
  decision,
  comparison,
  durations = [1, 2, 3, 6, 12],
  durationMonths,
  durationDiscounts = {},
  quantity,
  categoryName,
  value,
  onChange,
  onDurationChange,
}) {
  if (!decision || !comparison) {
    return (
      <p className="text-sm font-semibold text-ink-faint">
        Enter a price on the previous step to see which model applies.
      </p>
    );
  }

  const { modelA, modelB, choiceRequired, forcedModel } = comparison;
  const fee = modelB.fee;

  return (
    <div className="space-y-5">
      {/* Duration drives both the exclusivity period and the paid-listing fee. */}
      <div className="rounded-xl border border-line bg-surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-ink">Listing duration</p>
            <p className="text-xs font-semibold text-ink-faint">
              Longer durations earn a bigger discount on a paid listing.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {durations.map((m) => {
              const discount = durationDiscounts[m] ?? durationDiscounts[String(m)] ?? 0;
              const active = Number(durationMonths) === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => onDurationChange(m)}
                  aria-pressed={active}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
                    active
                      ? "border-brand bg-brand text-white"
                      : "border-line bg-surface text-ink-soft hover:border-brand/40 hover:text-brand"
                  }`}
                >
                  {m} mo
                  {discount > 0 && (
                    <span className={active ? "ml-1 text-white/80" : "ml-1 text-emerald-600"}>
                      −{percent(discount)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {choiceRequired ? (
        <>
          <div className="flex items-start gap-3 rounded-xl border border-brand/30 bg-brand-50 px-4 py-3">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
            <div>
              <p className="text-sm font-bold text-ink">This listing qualifies for both models.</p>
              <p className="mt-0.5 text-xs font-semibold text-ink-soft">
                {decision.eligibilityReason} Choose how you want to list it — you cannot continue
                until you pick one.
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ModelCard
              id="A"
              selected={value === "A"}
              onSelect={() => onChange("A")}
              icon={ShieldCheck}
              title="Model A — Exclusive"
              subtitle="Commission only, no listing fee"
              headline="No upfront cost"
              rows={[
                ["Listing fee", "None"],
                ["Commission if a deal closes", percent(modelA.commissionPercent)],
                ["Exclusivity period", `${modelA.exclusivityMonths} month(s)`],
              ]}
              points={[
                "Nothing to pay to publish.",
                "You may not list this item elsewhere during the exclusivity period.",
                "Commission is due on the final reported deal amount.",
              ]}
            />

            <ModelCard
              id="B"
              selected={value === "B"}
              onSelect={() => onChange("B")}
              icon={Banknote}
              title="Model B — Paid listing"
              subtitle="Pay to publish, keep the whole deal"
              headline={money(fee?.total)}
              rows={[
                ["Listing fee", `${money(fee?.total)} (VAT incl.)`],
                ["Commission if a deal closes", "None"],
                ["Duration", `${fee?.months} month(s)`],
              ]}
              points={[
                "No commission is ever charged on the deal.",
                "You can list the same item anywhere else at the same time.",
                "The fee is non-refundable once the listing is approved.",
              ]}
            />
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-amber-800">
            <Lock className="h-3.5 w-3.5" /> Automatically determined
          </p>
          <p className="mt-2 font-display text-xl font-bold text-ink">
            Model {decision.model} — {decision.model === "A" ? "Exclusive, commission only" : "Paid listing"}
          </p>
          <p className="mt-1 text-sm font-semibold text-ink-soft">{decision.eligibilityReason}</p>
          {forcedModel && (
            <p className="mt-1 text-xs font-semibold text-ink-faint">
              {categoryName} listings always use Model {forcedModel}, so there is nothing to choose here.
            </p>
          )}
        </div>
      )}

      {/* Price calculation (spec Part 17) — shown whenever Model B applies. */}
      {(value === "B" || decision.model === "B") && fee && (
        <div className="rounded-xl border border-line bg-surface p-4">
          <p className="text-xs font-black uppercase tracking-wide text-brand">Price calculation</p>
          <dl className="mt-3 grid gap-2 text-sm">
            <Line label="Listing type" value={`${categoryName} · Model B paid listing`} />
            <Line label="Units" value={String(quantity || 1)} />
            <Line label="Monthly rate" value={money(fee.baseMonthlyFee)} />
            <Line label={`Duration (${fee.months} month${fee.months === 1 ? "" : "s"})`} value={money(fee.grossBeforeDiscount)} />
            <Line
              label="Duration discount"
              value={fee.discountRate > 0 ? `−${percent(fee.discountRate)} (−${money(fee.grossBeforeDiscount - fee.total)})` : "None"}
              tone={fee.discountRate > 0 ? "good" : undefined}
            />
            <Line label="VAT included (18%)" value={money(fee.vatPortion)} muted />
            <div className="flex items-center justify-between border-t border-line pt-2">
              <dt className="font-display text-base font-bold text-ink">Amount payable</dt>
              <dd className="font-display text-xl font-bold text-brand">{money(fee.total)}</dd>
            </div>
          </dl>
          <p className="mt-2 text-xs font-semibold text-ink-faint">
            You will be taken to checkout after signing the agreement.
          </p>
        </div>
      )}
    </div>
  );
}

function Line({ label, value, muted, tone }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className={muted ? "text-ink-faint" : "text-ink-soft"}>{label}</dt>
      <dd className={`font-bold ${tone === "good" ? "text-emerald-700" : muted ? "text-ink-faint" : "text-ink"}`}>
        {value}
      </dd>
    </div>
  );
}

function ModelCard({ id, selected, onSelect, icon: Icon, title, subtitle, headline, rows, points }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex h-full flex-col rounded-2xl border-2 p-5 text-left transition ${
        selected
          ? "border-brand bg-brand-50 shadow-soft"
          : "border-line bg-surface hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-soft"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${selected ? "bg-brand text-white" : "bg-brand-50 text-brand"}`}>
          <Icon className="h-5 w-5" />
        </span>
        <span
          className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 ${
            selected ? "border-brand bg-brand text-white" : "border-line"
          }`}
        >
          {selected && <Check className="h-3.5 w-3.5" />}
        </span>
      </div>

      <p className="mt-3 font-display text-lg font-bold text-ink">{title}</p>
      <p className="text-xs font-semibold text-ink-soft">{subtitle}</p>
      <p className="mt-3 font-display text-2xl font-bold text-brand">{headline}</p>

      <dl className="mt-3 grid gap-1.5 border-t border-line pt-3 text-xs">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3">
            <dt className="text-ink-faint">{label}</dt>
            <dd className="font-bold text-ink">{value}</dd>
          </div>
        ))}
      </dl>

      <ul className="mt-3 grid gap-1.5 text-xs font-semibold text-ink-soft">
        {points.map((p) => (
          <li key={p} className="flex gap-1.5">
            <BadgeCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
            {p}
          </li>
        ))}
      </ul>

      <span className={`mt-4 block rounded-lg px-3 py-2 text-center text-xs font-black ${selected ? "bg-brand text-white" : "bg-panel text-ink-soft"}`}>
        {selected ? `Model ${id} selected` : `Choose Model ${id}`}
      </span>
    </button>
  );
}
