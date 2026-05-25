import type { Metadata } from "next";
import { DashboardPlatform } from "../dashboard-platform";

export const metadata: Metadata = {
  title: "Services Dashboard",
  description:
    "Buyamia services dashboard for generic service providers, live setup, verification placeholders, pinned lives, replay expiration, and payment UI placeholders.",
};

export default function ServicesDashboardPage() {
  return <DashboardPlatform activeDashboard="services" />;
}
