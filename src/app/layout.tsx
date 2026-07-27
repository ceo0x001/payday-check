import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The 6-Minute Payday Check",
  description:
    "Can your salary actually reach payday? A six-minute financial self-assessment. No signup, no bank access, no exact salary.",
  applicationName: "Payday Check",
  appleWebApp: {
    capable: true,
    // "default" lets iOS pick legible status-bar text per theme.
    // "black-translucent" would paint white glyphs onto the white light theme.
    statusBarStyle: "default",
    title: "Payday Check",
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "The 6-Minute Payday Check",
    description: "Can your salary actually reach payday?",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The 6-Minute Payday Check",
    description: "Can your salary actually reach payday?",
  },
};

export const viewport: Viewport = {
  // The browser chrome follows the phone's appearance setting too, so the
  // status bar never sits in a different theme from the page under it.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
  // Lets the layout paint under the notch and home indicator.
  viewportFit: "cover",
  // Deliberately not `userScalable: false` — that breaks pinch-zoom for
  // low-vision users, and no design is worth that.
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      {/* Extensions like Grammarly inject attributes onto <body> before React
          hydrates, which otherwise logs a hydration mismatch on every load. */}
      <body
        suppressHydrationWarning
        className="bg-bg text-text flex min-h-[100dvh] flex-col antialiased"
      >
        {children}
      </body>
    </html>
  );
}
