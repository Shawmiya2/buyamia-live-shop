import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { requireRole } from "@/lib/backend/auth-context";
import { createViewerSignal } from "@/lib/backend/live-signal-service";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const viewer = await requireRole("viewer");
    const signal = await createViewerSignal({
      liveId: (await params).id,
      viewer,
      data: await request.json(),
    });

    return jsonOk(signal, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
