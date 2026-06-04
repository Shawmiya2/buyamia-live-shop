import type { Metadata } from "next";
import { DashboardPlatform } from "../../dashboard-platform";

export const metadata: Metadata = {
  title: "Restaurant Dashboard",
  description:
    "Buyamia restaurant dashboard connected to backend verification, live, replay, pinned live, analytics, and next action data.",
};

export default function RestaurantDashboardPage() {
  return <DashboardPlatform activeDashboard="restaurant" />;
}
