"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser } from "@/lib/backend/auth-context";
import { providerForCurrentUser } from "@/lib/backend/dashboard-service";
import { createScheduledStream } from "@/lib/backend/live-service";

export async function scheduleStreamAction(formData: FormData) {
  const user = await requireAuthenticatedUser();
  const providerId = await providerForCurrentUser(user);
  const live = await createScheduledStream(providerId, {
    title: formData.get("title"),
    category: formData.get("category"),
    description: formData.get("description") || undefined,
    scheduledAt: formData.get("scheduledAt"),
    providerType: formData.get("providerType"),
    estimatedDurationMinutes: formData.get("estimatedDurationMinutes"),
    language: formData.get("language"),
    thumbnailUrl: formData.get("thumbnailUrl") || undefined,
    visibility: formData.get("visibility"),
  });

  revalidatePath("/live");
  revalidatePath("/dashboard/hotel");
  revalidatePath("/dashboard/restaurant");
  revalidatePath("/dashboard/supplier");
  revalidatePath("/dashboard/services");

  return { success: true as const, data: live };
}
