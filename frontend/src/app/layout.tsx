import type { Metadata } from "next";
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-foreground">
        <div className="flex min-h-screen flex-col">
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
