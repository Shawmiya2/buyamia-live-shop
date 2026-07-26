import { requireRole } from "@/lib/backend/auth-context";
import { getVerificationStatus } from "@/lib/backend/verification-service";
import { VerificationClient } from "./verification-client";

export default async function ServicesVerificationPage() {
  const user = await requireRole("service_provider");
  const initialStatus = await getVerificationStatus(user.id);

  return <VerificationClient initialStatus={initialStatus} />;
}
