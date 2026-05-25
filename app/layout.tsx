import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Buyamia - Live Hospitality Commerce",
    template: "%s | Buyamia",
  },
  description:
    "Discover verified hotels, rooms, food, spa, and experiences through live access, with connected tools for partners, sourcing, and procurement.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Buyamia - Live Hospitality Commerce",
    description:
      "A premium live discovery experience for hospitality commerce, connected to hotel, supplier, sourcing, and procurement tools.",
    siteName: "Buyamia",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
