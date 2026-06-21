import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { prisma } from "@/lib/backend/prisma";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return jsonOk({
      application: "ok",
      database: "ok",
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    return jsonError(error, 503);
  }
}
