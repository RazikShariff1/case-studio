import type { Metadata, Viewport } from "next";
import { Inter, Faculty_Glyphic } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import CartDrawer from "@/components/CartDrawer";
import Footer from "@/components/Footer";
import { hasSession } from "@/lib/auth";
import { readCart } from "@/lib/cart";

// Inter is only the fallback: Apple devices use their own system font (see --font-sans).
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

const glyphic = Faculty_Glyphic({ variable: "--font-glyphic", subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: { default: "Thingx. Made for the things you carry every day.", template: "%s - Thingx" },
  icons: {
    icon: [
      { url: "/theme/thingx-favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/theme/thingx-favicon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/theme/thingx-apple-touch-icon.png", sizes: "180x180" }],
  },
  description: "Phone cases in every finish, for every phone. Free delivery and easy returns.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#fbfbfd" };

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // The top bar must never wait on the platform: it only reads cookies. The bag count is the cookie's own total, and the pages that
  // need the real shopper or real stock check them themselves.
  const [signedIn, lines] = await Promise.all([hasSession(), readCart()]);
  const bagCount = lines.reduce((n, l) => n + l.q, 0);
  return (
    <html lang="en" className={`${inter.variable} ${glyphic.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <Nav signedIn={signedIn} bagCount={bagCount} />
        <main className="flex-1">{children}</main>
        <Footer />
        <CartDrawer />
      </body>
    </html>
  );
}
