import { ProviderConciergePage } from "../../provider-concierge-page";

export const metadata = { title: "Supplier Concierge" };

export default function SupplierConcierge() {
  return <ProviderConciergePage role="supplier" dashboardHref="/dashboard/supplier" title="Supplier dashboard" />;
}
