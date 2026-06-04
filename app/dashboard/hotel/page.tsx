import type { Metadata } from "next";
import { DashboardPlatform } from "../../dashboard-platform";

export const metadata: Metadata = {
  title: "Hotel Dashboard",
  description:
    "Buyamia hotel dashboard connected to backend verification, live, replay, pinned live, analytics, and next action data.",
};

export default function HotelDashboardPage() {
  return <DashboardPlatform activeDashboard="hotel" />;
}
