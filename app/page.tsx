import { DashboardPlatform } from "./dashboard-platform";
import { getFeaturedSupplierSessions } from "@/lib/backend/live-service";

export default async function Home() {
  const featuredSupplierSessions = await getFeaturedSupplierSessions();

  return (
    <DashboardPlatform
      activeDashboard="overview"
      featuredSupplierSessions={featuredSupplierSessions}
    />
  );
}
