import type { Metadata } from "next";
import { DashboardAccessGate } from "../../dashboard-access-gate";
import { getProcurementAgentDashboardData } from "@/lib/backend/procurement-agent-service";
import { ProcurementAgentDashboard } from "./procurement-agent-dashboard";

export const metadata: Metadata = {
  title: "Procurement Agent Dashboard",
  description:
    "Buyamia procurement agent dashboard for shareable live sessions, referral links, attributed RFQs, and B2B commission tracking.",
};

export default async function ProcurementAgentPage() {
  const data = await getProcurementAgentDashboardData();

  return (
    <DashboardAccessGate dashboardType="main">
      <ProcurementAgentDashboard data={data} />
    </DashboardAccessGate>
  );
}
