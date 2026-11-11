import { Inbox } from "lucide-react";

/**
 * What a list shows when it has nothing in it.
 *
 * Drawn as a dashed, shadowless well rather than a card. It used to be a full
 * elevated card with a boxed letter "i" for an icon: placed inside a section
 * that was already a card it became a card within a card, and it carried the
 * same visual weight as real content. An empty state is the absence of
 * content and should look like a space waiting to be filled.
 *
 * `icon` is a lucide component. A string is still accepted (older call sites
 * pass "i") and simply falls back to the default glyph.
 */
export default function EmptyState({ icon, title, hint, action }) {
  const Icon = typeof icon === "function" || (icon && typeof icon === "object") ? icon : Inbox;
  return (
    <div className="dashboard-reveal flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-paper/60 px-6 py-12 text-center">
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-surface text-ink-faint shadow-soft ring-1 ring-line">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <p className="text-balance font-display text-lg font-bold text-ink">{title}</p>
      {hint && <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-soft">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
