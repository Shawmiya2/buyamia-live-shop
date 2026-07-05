import { ProviderConciergePage } from "../../provider-concierge-page";

export const metadata = { title: "Services Concierge" };

export default function ServicesConcierge() {
  return <ProviderConciergePage role="service_provider" dashboardHref="/dashboard/services" title="Services dashboard" />;
}
