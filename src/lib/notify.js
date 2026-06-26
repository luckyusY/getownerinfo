// Notification dispatch stub. Real email/SMS/in-app providers plug in later.
// For now it logs server-side and returns the payload so dev flows can read it.

export async function notify({ to, channel = "in_app", subject, message, meta }) {
  const entry = { to, channel, subject, message, meta, at: new Date().toISOString() };
  console.log(`[notify:${channel}] -> ${to}: ${subject || message}`);
  return entry;
}

export function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
}
