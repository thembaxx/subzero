import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Trace — Your digital life, in your hands.", template: "%s · Trace" },
  description:
    "Meet your digital footprint. Verify your identity, discover possible accounts from your own data, and understand known exposures with Trace.",
  applicationName: "Trace",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Trace" },
  icons: { icon: "/icon.svg", apple: "/apple-touch-icon.png" },
  openGraph: {
    title: "Trace — You’re online. Know where.",
    description: "A little clarity. A lot more control over your digital footprint.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f8f4" },
    { media: "(prefers-color-scheme: dark)", color: "#171c18" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
