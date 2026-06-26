// Pre-unlock content filter. Blocks messages that try to share contact details or
// exact location before a buyer has paid the token fee (spec Parts 7 & 10).
//
// Detects: phone numbers, emails, URLs/links, social handles, and long digit
// runs (ID/UPI-like). Returns what was matched plus a redacted preview.

const PATTERNS = [
  { name: "email", re: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g },
  { name: "url", re: /\b(?:https?:\/\/|www\.)[^\s]+/gi },
  // Phone: +250…, 07XXXXXXXX, or any 9+ digit run allowing spaces/dashes/dots.
  { name: "phone", re: /(?:\+?\d[\d\s().-]{7,}\d)/g },
  { name: "social", re: /\b(?:whats[\s-]?app|telegram|insta(?:gram)?|snapchat|@[A-Za-z0-9_]{3,})\b/gi },
];

// Heuristic: spelled-out digits used to evade the numeric filter.
const SPELLED_DIGITS = /\b(zero|one|two|three|four|five|six|seven|eight|nine)(\s+(zero|one|two|three|four|five|six|seven|eight|nine)){4,}\b/gi;

/**
 * @param {string} text
 * @returns {{ blocked: boolean, reasons: string[], redacted: string }}
 */
export function scanMessage(text) {
  if (!text || typeof text !== "string") {
    return { blocked: false, reasons: [], redacted: text || "" };
  }

  const reasons = new Set();
  let redacted = text;

  for (const { name, re } of PATTERNS) {
    if (re.test(text)) {
      reasons.add(name);
      redacted = redacted.replace(new RegExp(re.source, re.flags), "▒▒▒");
    }
  }
  if (SPELLED_DIGITS.test(text)) {
    reasons.add("phone");
    redacted = redacted.replace(SPELLED_DIGITS, "▒▒▒");
  }

  return { blocked: reasons.size > 0, reasons: [...reasons], redacted };
}
