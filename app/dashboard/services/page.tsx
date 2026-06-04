import type { Metadata } from "next";
import { DashboardPlatform } from "../../dashboard-platform";

export const metadata: Metadata = {
  title: "Services Dashboard",
  description:
    "Buyamia service provider dashboard with live setup CTA, mock verification, payment placeholders, replay controls, pins, and backend analytics.",
};

export default function ServicesDashboardPage() {
  return <DashboardPlatform activeDashboard="services" />;
}
