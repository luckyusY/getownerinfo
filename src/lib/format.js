export function formatRwf(n) {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-RW").format(n) + " Rwf";
}

export function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
