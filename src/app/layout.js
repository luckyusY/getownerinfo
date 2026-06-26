import "./globals.css";
import CookieBanner from "@/components/CookieBanner";

export const metadata = {
  title: "getownerinfo — Hybrid Marketplace",
  description:
    "List property, vehicles and assets. Unlock verified owner contact and exact location with a secure token fee.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
