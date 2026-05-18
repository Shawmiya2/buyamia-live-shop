import type { Metadata } from "next";
import { DashboardPlatform } from "../dashboard-platform";

export const metadata: Metadata = {
  title: "Supplier Dashboard",
  description:
    "Buyamia supplier dashboard for live selling, RFQs, verification, protected payments, and fulfillment.",
};

export default function SupplierDashboardPage() {
  return <DashboardPlatform activeDashboard="supplier" />;
}
