import { prisma } from "./prisma";

export async function recordAdminActivity(input: {
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  message: string;
}) {
  return prisma.adminActivity.create({ data: input });
}

export async function getRecentAdminActivity(limit = 20) {
  return prisma.adminActivity.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { admin: { select: { id: true, name: true, email: true, role: true } } },
  });
}
