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
    default: "Buyamia — AI Native Live Commerce",
    template: "%s | Buyamia",
  },
  description:
    "Buyamia is an AI-native live commerce and procurement platform connecting premium hospitality buyers with verified Indonesian suppliers.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Buyamia — AI Native Live Commerce",
    description:
      "AI-powered live sourcing, supplier showcases, RFQs, and procurement intelligence for premium B2B buyers.",
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
