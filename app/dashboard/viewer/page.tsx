import type { Metadata } from "next";
import { DashboardPlatform } from "../../dashboard-platform";

export const metadata: Metadata = {
  title: "Viewer Dashboard",
  description:
    "Buyamia viewer dashboard with followed providers, upcoming lives, available replays, replay expiration labels, and backend subscription data.",
};

export default function ViewerDashboardPage() {
  return <DashboardPlatform activeDashboard="traveler" />;
}
