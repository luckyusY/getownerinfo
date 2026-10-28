// Rwanda marketplace phone numbers accepted in local or international form.
// Separators are presentation-only; letters and other punctuation are rejected.
export function isValidRwandaPhone(value) {
  if (typeof value !== "string" || !value.trim()) return false;
  const normalized = value.trim().replace(/[\s().-]/g, "");
  return /^(?:\+250|250)?7\d{8}$/.test(normalized) || /^07\d{8}$/.test(normalized);
}

export function optionalRwandaPhone(value) {
  return !value || !value.trim() || isValidRwandaPhone(value);
}
