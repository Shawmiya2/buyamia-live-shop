import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { requireRole } from "@/lib/backend/auth-context";
import { prisma } from "@/lib/backend/prisma";
import { recordRiskDecision } from "@/lib/backend/risk-service";
import { readJson } from "@/lib/backend/validation";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireRole("main_admin");
    const { id } = await params;
    const existing = await prisma.riskReview.findUnique({ where: { id } });
    const body = await readJson(request);

    if (!existing) {
      return jsonOk(await recordRiskDecision(admin.id, body));
    }

    return jsonOk(
      await prisma.riskReview.update({
        where: { id },
        data: {
          riskLevel: body.riskLevel,
          reviewStatus: body.reviewStatus ?? body.status,
          status: body.reviewStatus ?? body.status,
          adminNote: body.adminNote ?? body.note,
          note: body.adminNote ?? body.note,
          reviewerId: admin.id,
          adminId: admin.id,
          reviewedAt: new Date(),
        },
      }),
    );
  } catch (error) {
    return jsonError(error);
  }
}
