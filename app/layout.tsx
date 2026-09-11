import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PulseLetter — Newsletter Studio",
  description: "Create, organize, and share your next great newsletter.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    // iOS uses this one when the site is added to the Home Screen.
    apple: "/icon-180.png",
  },
  appleWebApp: {
    capable: true,
    title: "PulseLetter",
    statusBarStyle: "default",
  },
};

export const viewport = {
  themeColor: "#0b101a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light">
      <body className="antialiased">{children}</body>
    </html>
  );
}

