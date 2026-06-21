import { prisma } from "./prisma";
import { safeUser } from "./auth-service";

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: { providerProfile: { select: { id: true } } },
  });

  return user ? safeUser(user) : null;
}

export async function listUsers() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { providerProfile: { select: { id: true } } },
  });

  return users.map(safeUser);
}
