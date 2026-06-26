import "./globals.css";
import { Fraunces, Manrope } from "next/font/google";
import CookieBanner from "@/components/CookieBanner";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const body = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
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
