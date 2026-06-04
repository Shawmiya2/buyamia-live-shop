import type { Metadata } from "next";
import { DashboardPlatform } from "../../dashboard-platform";

export const metadata: Metadata = {
  title: "Supplier Dashboard",
  description:
    "Buyamia supplier dashboard connected to backend verification, live, replay, pinned live, analytics, and next action data.",
};

export default function SupplierDashboardPage() {
  return <DashboardPlatform activeDashboard="supplier" />;
}
