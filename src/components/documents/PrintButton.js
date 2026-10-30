"use client";

import { Printer } from "lucide-react";

/**
 * Print, which on every current browser is also "Save as PDF" from the
 * destination menu.
 *
 * The app generates its documents as print-styled pages rather than rendering
 * PDFs server-side: the browser's own engine lays out the page the reader is
 * already looking at, so what they file is what they saw, and no headless
 * browser or PDF library has to ship with the app to produce it.
 */
export default function PrintButton({ label = "Print or save as PDF" }) {
  return (
    <button type="button" className="btn-primary print:hidden" onClick={() => window.print()}>
      <Printer className="h-4 w-4" /> {label}
    </button>
  );
}
