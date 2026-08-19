import type { Metadata } from "next";

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { getSiteChrome } from "@/lib/site-chrome";

import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://astroloper.localhost";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Astroloper",
    template: "%s | Astroloper",
  },
  description: "Personal site powered by Wagtail and Next.js.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const chrome = await getSiteChrome();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-foreground">
        <div className="flex min-h-screen flex-col">
          <Header chrome={chrome} />
          <main className="flex-1">{children}</main>
          <Footer chrome={chrome} />
        </div>
      </body>
    </html>
  );
}
