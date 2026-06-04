import type { Metadata } from "next";
import { DashboardPlatform } from "../../dashboard-platform";

export const metadata: Metadata = {
  title: "Main Dashboard",
  description:
    "Buyamia main dashboard for platform verification, live stats, replay stats, pinned lives, analytics, and next actions.",
};

export default function MainDashboardPage() {
  return <DashboardPlatform activeDashboard="procurement" />;
}
