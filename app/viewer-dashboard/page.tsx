import type { Metadata } from "next";
import { DashboardPlatform } from "../dashboard-platform";

export const metadata: Metadata = {
  title: "Viewer Dashboard",
  description:
    "Buyamia viewer dashboard for followed providers, available replays, upcoming lives, and subscription state.",
};

export default function ViewerDashboardPage() {
  return <DashboardPlatform activeDashboard="traveler" />;
}
