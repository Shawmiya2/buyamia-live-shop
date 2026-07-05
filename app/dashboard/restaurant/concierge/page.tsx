import { ProviderConciergePage } from "../../provider-concierge-page";

export const metadata = { title: "Restaurant Concierge" };

export default function RestaurantConcierge() {
  return <ProviderConciergePage role="restaurant" dashboardHref="/dashboard/restaurant" title="Restaurant dashboard" />;
}
