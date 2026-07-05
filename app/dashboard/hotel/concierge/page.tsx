import { ProviderConciergePage } from "../../provider-concierge-page";

export const metadata = { title: "Hotel Concierge" };

export default function HotelConcierge() {
  return <ProviderConciergePage role="hotel" dashboardHref="/dashboard/hotel" title="Hotel dashboard" />;
}
