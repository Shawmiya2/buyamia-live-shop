import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { requireAuthenticatedUser } from "@/lib/backend/auth-context";
import { triggerPresenterTool } from "@/lib/backend/presenter-tool-service";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const presenter = await requireAuthenticatedUser();
    const activation = await triggerPresenterTool({
      liveId: (await params).id,
      presenter,
      data: await request.json(),
    });

    return jsonOk(activation, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
