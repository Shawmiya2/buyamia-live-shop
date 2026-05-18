import type { Metadata } from "next";
import { DashboardPlatform } from "../dashboard-platform";

export const metadata: Metadata = {
  title: "AI Procurement Dashboard",
  description:
    "Buyamia AI procurement dashboard for sourcing assistance, procurement analytics, RFQ generation, supplier recommendations, live negotiations, logistics insights, and risk alerts.",
};

export default function AiProcurementDashboardPage() {
  return <DashboardPlatform activeDashboard="procurement" />;
}
