import type { Metadata } from "next";
import { DashboardPlatform } from "../dashboard-platform";

export const metadata: Metadata = {
  title: "Hotel Dashboard",
  description:
    "Buyamia hotel dashboard for live rooms, bookings, verified reviews, replay analytics, guest verification, stream scheduling, room showcase management, and trust score.",
};

export default function HotelDashboardPage() {
  return <DashboardPlatform activeDashboard="hotel" />;
}
