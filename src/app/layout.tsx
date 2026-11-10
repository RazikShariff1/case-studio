import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { hasSession } from "@/lib/auth";
import { readCart } from "@/lib/cart";

// Inter is only the fallback: Apple devices use their own system font (see --font-sans).
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Case Studio. Cases made to feel as good as they look.", template: "%s - Case Studio" },
  description: "Phone cases in every finish, for every phone. Free delivery and easy returns.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#fbfbfd" };

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // The top bar must never wait on the platform: it only reads cookies. The bag count is the cookie's own total, and the pages that
  // need the real shopper or real stock check them themselves.
  const [signedIn, lines] = await Promise.all([hasSession(), readCart()]);
  const bagCount = lines.reduce((n, l) => n + l.q, 0);
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <Nav signedIn={signedIn} bagCount={bagCount} />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
