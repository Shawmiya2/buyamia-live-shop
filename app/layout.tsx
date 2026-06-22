import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en" className="h-full antialiased" data-scroll-behavior="smooth">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
