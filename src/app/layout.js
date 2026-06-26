import "./globals.css";
import { Poppins, Nunito_Sans } from "next/font/google";
import CookieBanner from "@/components/CookieBanner";

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
  title: "getownerinfo — Find the real owner",
  description:
    "List property, vehicles and assets. Unlock verified owner contact and exact location with a secure token fee.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
