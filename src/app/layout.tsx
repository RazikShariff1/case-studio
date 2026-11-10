import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { getUser } from "@/lib/auth";
import { getCartData } from "@/lib/cart";

// Inter is only the fallback: Apple devices use their own system font (see --font-sans).
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Case Studio. Cases made to feel as good as they look.", template: "%s - Case Studio" },
  description: "Phone cases in every finish, for every phone. Free delivery and easy returns.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#fbfbfd" };

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [user, cart] = await Promise.all([getUser(), getCartData().catch(() => ({ count: 0 }))]);
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <Nav signedIn={!!user} name={user?.name ?? ""} bagCount={cart.count} />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
