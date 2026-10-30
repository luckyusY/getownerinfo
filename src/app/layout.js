import "./globals.css";
import localFont from "next/font/local";
import CookieBanner from "@/components/CookieBanner";
import { ToastProvider } from "@/components/ui/Toast";
import { FavoritesProvider } from "@/components/FavoritesProvider";
import AppMotion from "@/components/AppMotion";
import MobileTabBar from "@/components/MobileTabBar";
import { getSession } from "@/lib/auth";
import { dashboardPathFor } from "@/lib/dashboardPath";

/*
 * Match getownerinfo.com: Poppins headings, Nunito Sans body.
 *
 * Self-hosted rather than next/font/google. That loader fetches each family
 * from Google at build time, which made every build depend on a network call
 * that intermittently failed both locally and on Vercel:
 *
 *   Failed to find font override values for font `Nunito Sans`
 *   TypeError: Cannot read properties of null (reading '1')
 *       at .../@next/font/dist/google/loader.js:112
 *
 * Nunito Sans is the one that broke, and the reason shows in the files: Google
 * serves it as a variable font, so the three weights we asked for came back as
 * one identical file. The loader's metrics lookup found nothing for it and then
 * matched null. Serving the files from the repo removes the build-time fetch
 * altogether, so builds are deterministic and this cannot recur.
 *
 * To refresh these, re-download the latin woff2 for each weight from the
 * fonts.googleapis.com css2 endpoint. Both families are Open Font License.
 */
const display = localFont({
  src: [
    { path: "./fonts/poppins-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/poppins-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/poppins-700.woff2", weight: "700", style: "normal" },
    { path: "./fonts/poppins-800.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-display",
  display: "swap",
});

// One file for the whole 400-700 range, because it is a variable font.
const body = localFont({
  src: "./fonts/nunito-sans-variable.woff2",
  weight: "400 700",
  style: "normal",
  variable: "--font-body",
  display: "swap",
});

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://getownerinfo-ewgp.vercel.app"),
  title: {
    default: "getownerinfo — Find the real owner",
    template: "%s · getownerinfo",
  },
  description:
    "List property, vehicles and assets. Unlock the owner's contact and exact location with a secure token fee — no brokers.",
  keywords: ["Rwanda real estate", "property", "rent", "vehicles", "direct owner contact", "Kigali"],
  openGraph: {
    type: "website",
    siteName: "getownerinfo",
    title: "getownerinfo — Find the real owner",
    description:
      "Connect directly with owners across Rwanda. Privacy and trust built in.",
  },
  twitter: { card: "summary_large_image", title: "getownerinfo", description: "Find the real owner. Skip the brokers." },
};

export const viewport = {
  themeColor: "#1668e3",
};

export default function RootLayout({ children }) {
  const session = getSession();

  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <ToastProvider>
          <FavoritesProvider>
            <AppMotion />
            {children}
            <MobileTabBar
              loggedIn={!!session}
              dashboardPath={session ? dashboardPathFor(session.role) : "/dashboard"}
            />
            <CookieBanner />
          </FavoritesProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
