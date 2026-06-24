import type { Metadata } from "next";
import { DashboardAccessGate } from "../../../dashboard-access-gate";
import { SupplierLivePreparationCenter } from "./preparation-center";

export const metadata: Metadata = {
  title: "Live Preparation Center",
  description:
    "Buyamia supplier live preparation center for lighting, camera framing, scripts, checklists, product demos, AI tips, and RFQ-ready live structure.",
};

export default function SupplierLivePrepPage() {
  return (
    <DashboardAccessGate dashboardType="supplier">
      <SupplierLivePreparationCenter />
    </DashboardAccessGate>
  );
}
