import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { hashPassword } from "../lib/backend/auth-service";
import { datePlusDays } from "../lib/backend/replay-policy";

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? "file:./dev.db",
  }),
});

async function upsertUser(input: {
  name: string;
  email: string;
  password: string;
  role: "main_admin" | "hotel" | "restaurant" | "supplier" | "service_provider" | "viewer";
}) {
  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.upsert({
    where: { email: input.email },
    update: {},
    create: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
      verificationStatus: input.role === "viewer" ? "not_started" : input.role === "main_admin" ? "verified" : "pending",
      onboardingStatus: "complete",
    },
  });

  if (!["main_admin", "viewer"].includes(input.role)) {
    await prisma.providerProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        displayName: input.name,
        category: input.role,
        description: `${input.name} local development profile.`,
        location: "Bali",
      },
    });
  }

  return user;
}

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@example.test";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";

  await upsertUser({
    name: "Buyamia Main Admin",
    email: adminEmail.toLowerCase(),
    password: adminPassword,
    role: "main_admin",
  });

  const demoUsers = [
    ["Sanur Wellness Hotel", "hotel@example.test", "Password123!", "hotel"],
    ["Seminyak Chef Table", "restaurant@example.test", "Password123!", "restaurant"],
    ["Bali Rattan Works", "supplier@example.test", "Password123!", "supplier"],
    ["Private Arrival Service", "service@example.test", "Password123!", "service_provider"],
    ["Demo Viewer", "viewer@example.test", "Password123!", "viewer"],
  ] as const;

  for (const [name, email, password, role] of demoUsers) {
    await upsertUser({ name, email, password, role });
  }

  const providers = await prisma.providerProfile.findMany({ include: { user: true } });
  const now = new Date();

  for (const provider of providers) {
    const existing = await prisma.live.count({ where: { providerId: provider.id } });
    if (existing === 0) {
      await prisma.live.createMany({
        data: [
          {
            providerId: provider.id,
            title: `${provider.displayName} upcoming live`,
            category: provider.category,
            status: "scheduled",
            scheduledAt: datePlusDays(now, 2),
            replayExpiresAt: datePlusDays(now, 7),
            isPinned: provider.category === "supplier",
            pinReason: provider.category === "supplier" ? "featured_by_buyamia" : undefined,
            pinExpiresAt: provider.category === "supplier" ? datePlusDays(now, 3) : undefined,
            priorityScore: provider.category === "supplier" ? 100 : 10,
          },
          {
            providerId: provider.id,
            title: `${provider.displayName} replay`,
            category: provider.category,
            status: "completed",
            scheduledAt: datePlusDays(now, -2),
            startedAt: datePlusDays(now, -2),
            endedAt: datePlusDays(now, -2),
            replayExpiresAt: datePlusDays(now, 3),
            priorityScore: 20,
          },
        ],
      });
    }
  }

  const viewer = await prisma.user.findUnique({ where: { email: "viewer@example.test" } });
  const firstProvider = providers[0];
  if (viewer && firstProvider) {
    await prisma.follow.upsert({
      where: { viewerId_providerId: { viewerId: viewer.id, providerId: firstProvider.id } },
      update: {},
      create: { viewerId: viewer.id, providerId: firstProvider.id },
    });
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    process.exit(1);
  });
