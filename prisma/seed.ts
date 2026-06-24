import "dotenv/config";
import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { hashPassword } from "../lib/backend/auth-service";
import {
  createDemoCommerceData,
  createDemoLiveQuestions,
  createDemoSpecialistHost,
  createDemoTranscript,
} from "../lib/backend/live-service";
import { datePlusDays } from "../lib/backend/replay-policy";

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? "file:./dev.db",
  }),
});

const trustProfiles: Record<
  string,
  {
    completedOrders: number;
    responseRate: number;
    responseMinutes: number;
    certifications: string[];
    bImpactScore: number;
    certifiedReviews: number;
  }
> = {
  hotel: {
    completedOrders: 86,
    responseRate: 94,
    responseMinutes: 34,
    certifications: ["CHSE hospitality", "Verified guest proof"],
    bImpactScore: 78,
    certifiedReviews: 52,
  },
  restaurant: {
    completedOrders: 74,
    responseRate: 91,
    responseMinutes: 28,
    certifications: ["Food safety", "Receipt-linked reviews"],
    bImpactScore: 82,
    certifiedReviews: 48,
  },
  supplier: {
    completedOrders: 93,
    responseRate: 96,
    responseMinutes: 22,
    certifications: ["Export ready", "Factory audit", "Sustainable materials"],
    bImpactScore: 88,
    certifiedReviews: 57,
  },
  service_provider: {
    completedOrders: 61,
    responseRate: 87,
    responseMinutes: 45,
    certifications: ["Licensed operator", "Insurance proof"],
    bImpactScore: 75,
    certifiedReviews: 34,
  },
};

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
    const trust = trustProfiles[input.role];
    await prisma.providerProfile.upsert({
      where: { userId: user.id },
      update: trust,
      create: {
        userId: user.id,
        displayName: input.name,
        category: input.role,
        description: `${input.name} local development profile.`,
        location: "Bali",
        ...trust,
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
            transcript: createDemoTranscript({
              liveId: `${provider.id}-upcoming`,
              title: `${provider.displayName} upcoming live`,
              providerName: provider.displayName,
              category: provider.category,
            }) as Prisma.InputJsonValue,
            specialistHost: createDemoSpecialistHost({
              providerName: provider.displayName,
              providerCategory: provider.category,
              category: provider.category,
              title: `${provider.displayName} upcoming live`,
            }) as Prisma.InputJsonValue,
            commerceData: createDemoCommerceData({
              title: `${provider.displayName} upcoming live`,
              providerName: provider.displayName,
              category: provider.category,
            }) as Prisma.InputJsonValue,
            intentQuestions: createDemoLiveQuestions({
              liveId: `${provider.id}-upcoming`,
              providerName: provider.displayName,
              title: `${provider.displayName} upcoming live`,
              category: provider.category,
            }) as Prisma.InputJsonValue,
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
            transcript: createDemoTranscript({
              liveId: `${provider.id}-replay`,
              title: `${provider.displayName} replay`,
              providerName: provider.displayName,
              category: provider.category,
            }) as Prisma.InputJsonValue,
            specialistHost: createDemoSpecialistHost({
              providerName: provider.displayName,
              providerCategory: provider.category,
              category: provider.category,
              title: `${provider.displayName} replay`,
            }) as Prisma.InputJsonValue,
            commerceData: createDemoCommerceData({
              title: `${provider.displayName} replay`,
              providerName: provider.displayName,
              category: provider.category,
            }) as Prisma.InputJsonValue,
            intentQuestions: createDemoLiveQuestions({
              liveId: `${provider.id}-replay`,
              providerName: provider.displayName,
              title: `${provider.displayName} replay`,
              category: provider.category,
            }) as Prisma.InputJsonValue,
          },
        ],
      });
    }
  }

  const viewer = await prisma.user.findUnique({ where: { email: "viewer@example.test" } });
  const lives = await prisma.live.findMany({
    include: { provider: true },
    orderBy: { createdAt: "asc" },
  });
  for (const live of lives) {
    if (!live.transcript) {
      await prisma.live.update({
        where: { id: live.id },
        data: {
          transcript: createDemoTranscript({
            liveId: live.id,
            title: live.title,
            providerName: live.provider.displayName,
            category: live.category,
          }) as Prisma.InputJsonValue,
        },
      });
    }
  }
  const firstProvider = providers[0];
  if (viewer && firstProvider) {
    await prisma.follow.upsert({
      where: { viewerId_providerId: { viewerId: viewer.id, providerId: firstProvider.id } },
      update: {},
      create: { viewerId: viewer.id, providerId: firstProvider.id },
    });
  }

  const existingAttributionEvents = await prisma.analyticsEvent.count({
    where: { conversionSource: { not: null } },
  });
  if (existingAttributionEvents === 0 && lives.length > 0) {
    const attributionSeeds = [
      ["live", "rfq", 18],
      ["live", "sample_request", 11],
      ["replay", "quote_follow_up", 14],
      ["replay", "rfq", 8],
      ["linkedin", "profile_view", 7],
      ["agent_referral", "negotiated_rfq", 12],
      ["highlight_video", "replay_save", 9],
      ["shared_link", "sample_request", 6],
      ["direct_dashboard", "order", 5],
    ] as const;

    await prisma.analyticsEvent.createMany({
      data: attributionSeeds.flatMap(([conversionSource, conversionIntent, count], sourceIndex) =>
        Array.from({ length: count }, (_, index) => {
          const live = lives[(sourceIndex + index) % lives.length];

          return {
            userId: viewer?.id,
            providerId: live.providerId,
            liveId: live.id,
            eventType: "conversion_intent",
            conversionSource,
            conversionIntent,
            metadata: {
              sourceLabel: conversionSource.replace(/_/g, " "),
              seeded: true,
            },
            createdAt: datePlusDays(now, -((sourceIndex + index) % 14)),
          };
        }),
      ),
    });
  }

  const existingIntentSignals = await prisma.analyticsEvent.count({
    where: {
      eventType: { in: ["live_question_submitted", "live_intent_signal", "question_answered"] },
    },
  });
  if (existingIntentSignals === 0 && lives.length > 0) {
    const intentSignals = [
      {
        liveIndex: 0,
        eventType: "live_question_submitted",
        conversionIntent: "rfq",
        intentCategory: "MOQ",
        question: "Can you split MOQ across the seating bundle?",
        product: "Rattan lounge set",
      },
      {
        liveIndex: 1,
        eventType: "live_question_submitted",
        conversionIntent: "sample_request",
        intentCategory: "shipping",
        question: "What is the shipping route and sample hold window?",
        product: "Chef tasting package",
      },
      {
        liveIndex: 2,
        eventType: "live_intent_signal",
        conversionIntent: "rfq",
        intentCategory: "comparison",
        question: "How does this compare with the nearby supplier line?",
        product: "Factory audit live",
      },
      {
        liveIndex: 3,
        eventType: "live_question_submitted",
        conversionIntent: "sample_request",
        intentCategory: "pricing",
        question: "Can we get a bundle price if we add service handling?",
        product: "Airport transfer arrival walkthrough",
      },
      {
        liveIndex: 0,
        eventType: "question_answered",
        conversionIntent: "rfq",
        intentCategory: "bundle_request",
        question: "Can the sample and quote be packaged together?",
        product: "Rattan lounge set",
      },
      {
        liveIndex: 2,
        eventType: "live_intent_signal",
        conversionIntent: "order",
        intentCategory: "rejection",
        question: "We cannot proceed if lead time exceeds the project window.",
        reason: "Lead time too long",
        product: "Factory audit live",
      },
    ] as const;

    await prisma.analyticsEvent.createMany({
      data: intentSignals.map((signal, index) => {
        const live = lives[signal.liveIndex % lives.length];
        const metadata: Prisma.InputJsonValue = {
          intentCategory: signal.intentCategory,
          question: signal.question,
          product: signal.product,
          seeded: true,
          ...("reason" in signal ? { reason: signal.reason } : {}),
        };

        return {
          userId: viewer?.id,
          providerId: live.providerId,
          liveId: live.id,
          eventType: signal.eventType,
          conversionIntent: signal.conversionIntent,
          metadata,
          createdAt: datePlusDays(now, -index - 1),
        };
      }),
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
