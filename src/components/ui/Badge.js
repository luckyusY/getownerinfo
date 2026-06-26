const TONES = {
  neutral: "bg-panel text-ink-soft",
  brand: "bg-brand-50 text-brand",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-700",
  info: "bg-indigo-50 text-indigo-700",
  gold: "bg-[#f7eccf] text-[#7a5a17]",
};

// Maps a listing/commission/payment status to a tone + label.
const STATUS_TONE = {
  draft: "neutral",
  pending_approval: "warning",
  active: "success",
  under_negotiation: "info",
  sold: "info",
  rented: "info",
  not_concluded: "neutral",
  expired: "neutral",
  rejected: "danger",
  paid: "success",
  invoiced: "warning",
  waived: "neutral",
  pending: "warning",
};

export default function Badge({ tone = "neutral", children, dot = false, className = "" }) {
  return (
    <span className={`badge ${TONES[tone] || TONES.neutral} ${className}`}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />}
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  const tone = STATUS_TONE[status] || "neutral";
  return <Badge tone={tone} dot>{String(status).replace(/_/g, " ")}</Badge>;
}
