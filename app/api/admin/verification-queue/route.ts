import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { requireRole } from "@/lib/backend/auth-context";
import { prisma } from "@/lib/backend/prisma";

export async function GET() {
  try {
    await requireRole("main_admin");
    return jsonOk(
      await prisma.verificationRequest.findMany({
        where: { status: "pending" },
        orderBy: { submittedAt: "asc" },
        include: { user: { select: { id: true, name: true, email: true, role: true, verificationStatus: true } } },
      }),
    );
  } catch (error) {
    return jsonError(error);
  }
}
