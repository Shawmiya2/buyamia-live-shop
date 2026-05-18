import type { Metadata } from "next";
import { DashboardPlatform } from "../dashboard-platform";

export const metadata: Metadata = {
  title: "Restaurant Dashboard",
  description:
    "Buyamia restaurant dashboard for reservations, kitchen throughput, live ordering, and diner trust.",
};

export default function RestaurantDashboardPage() {
  return <DashboardPlatform activeDashboard="restaurant" />;
}
