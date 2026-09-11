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
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

