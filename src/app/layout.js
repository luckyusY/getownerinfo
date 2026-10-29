import "./globals.css";
import { Poppins, Nunito_Sans } from "next/font/google";
import CookieBanner from "@/components/CookieBanner";
import { ToastProvider } from "@/components/ui/Toast";
import { FavoritesProvider } from "@/components/FavoritesProvider";
import AppMotion from "@/components/AppMotion";
import MobileTabBar from "@/components/MobileTabBar";
import { getSession } from "@/lib/auth";
import { dashboardPathFor } from "@/lib/dashboardPath";

// Match getownerinfo.com: Poppins headings, Nunito Sans body.
const display = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const body = Nunito_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
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
    "List property, vehicles and assets. Unlock verified owner contact and exact location with a secure token fee — no brokers.",
  keywords: ["Rwanda real estate", "property", "rent", "vehicles", "verified owners", "Kigali"],
  openGraph: {
    type: "website",
    siteName: "getownerinfo",
    title: "getownerinfo — Find the real owner",
    description:
      "Connect directly with verified owners across Rwanda. Privacy and trust built in.",
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
