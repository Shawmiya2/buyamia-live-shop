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
    default: "Buyamia - AI Native Live Commerce & Hotel Live Access",
    template: "%s | Buyamia",
  },
  description:
    "Buyamia is an AI-native live commerce platform for verified hotel lives, trusted reviews, protected stays, and premium hospitality procurement.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Buyamia - AI Native Live Commerce & Hotel Live Access",
    description:
      "AI-powered live hotel access, verified reviews, supplier showcases, RFQs, and procurement intelligence for premium hospitality buyers.",
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
