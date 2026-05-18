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
    default: "Buyamia - AI Procurement and Hospitality OS",
    template: "%s | Buyamia",
  },
  description:
    "Buyamia is an AI-native dashboard system for premium hospitality commerce, live sourcing, verified reviews, protected payments, and procurement intelligence.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Buyamia - AI Procurement and Hospitality OS",
    description:
      "AI-powered dashboards for live sourcing, supplier showcases, RFQs, hospitality bookings, trusted reviews, and procurement intelligence.",
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
