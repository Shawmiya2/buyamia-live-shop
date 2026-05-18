import type { Metadata } from "next";
import { DashboardPlatform } from "../dashboard-platform";

export const metadata: Metadata = {
  title: "Traveler Dashboard",
  description:
    "Buyamia traveler dashboard for booked stays, watched lives, saved hotels, verified reviews, wishlist, replay history, and booking status.",
};

export default function TravelerDashboardPage() {
  return <DashboardPlatform activeDashboard="traveler" />;
}
