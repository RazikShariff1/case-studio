import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileTabs from "@/components/MobileTabs";
import { getUser } from "@/lib/auth";
import { getCartData } from "@/lib/cart";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Case Studio — Style That Protects", template: "%s · Case Studio" },
  description: "Premium phone cases for every style and lifestyle.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // lets env(safe-area-inset-*) work on notched phones
  themeColor: "#f0eadf", // tints the Android Chrome address bar to match
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [user, cart] = await Promise.all([getUser(), getCartData()]);
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Header user={user} cartCount={cart.count} />
        <main className="flex-1">{children}</main>
        <Footer />
        <MobileTabs signedIn={!!user} cartCount={cart.count} />
      </body>
    </html>
  );
}
