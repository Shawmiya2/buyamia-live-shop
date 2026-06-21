import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import {
  lives,
  providers,
  subscriptions,
  users,
  verificationDocuments,
  viewerLiveHistory,
} from "./mock-data";
import type {
  DemoAnalyticsEvent,
  LiveEvent,
  MockUser,
  Provider,
  ServiceLiveSetupRequest,
  Subscription,
  VerificationDocumentMetadata,
} from "./types";

export type BackendStore = {
  users: MockUser[];
  providers: Provider[];
  lives: LiveEvent[];
  subscriptions: Subscription[];
  verificationDocuments: Record<string, VerificationDocumentMetadata[]>;
  serviceLiveSetupRequests: ServiceLiveSetupRequest[];
  analyticsEvents: DemoAnalyticsEvent[];
};

// Local demo persistence only. This JSON file is not production storage and
// should be replaced by real auth, database, document storage, and payments.
const storePath = path.join(process.cwd(), "data", "backend-store.json");

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function createSeedStore(): BackendStore {
  return {
    users: clone(users),
    providers: clone(providers),
    lives: clone(lives),
    subscriptions: clone(subscriptions),
    verificationDocuments: clone(verificationDocuments),
    serviceLiveSetupRequests: [
      {
        id: "service_request_arrival_demo",
        providerId: "provider_service_arrival",
        title: "Private arrival transfer",
        category: "Services",
        description:
          "Vehicle walkthrough, driver introduction, and arrival timing Q&A.",
        preferredDate: "2026-06-08",
        status: "pending_review",
        adminNote: null,
        createdAt: "2026-06-04T12:00:00.000Z",
      },
    ],
    analyticsEvents: viewerLiveHistory.map((item, index) => ({
      id: `analytics_watch_${index + 1}`,
      type: "watched_live",
      userId: item.viewerUserId,
      liveId: item.liveId,
      createdAt: item.watchedAt,
    })),
  };
}

function ensureStoreFile() {
  if (existsSync(storePath)) {
    return;
  }

  mkdirSync(path.dirname(storePath), { recursive: true });
  writeFileSync(
    storePath,
    `${JSON.stringify(createSeedStore(), null, 2)}\n`,
    "utf8",
  );
}

export function readBackendStore(): BackendStore {
  ensureStoreFile();

  return JSON.parse(readFileSync(storePath, "utf8")) as BackendStore;
}

export function writeBackendStore(store: BackendStore) {
  mkdirSync(path.dirname(storePath), { recursive: true });
  writeFileSync(storePath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
}

export function updateBackendStore<T>(mutator: (store: BackendStore) => T): T {
  const store = readBackendStore();
  const result = mutator(store);
  writeBackendStore(store);

  return result;
}

export function createAnalyticsEvent(
  input: Omit<DemoAnalyticsEvent, "id" | "createdAt">,
): DemoAnalyticsEvent {
  return {
    ...input,
    id: `event_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    createdAt: new Date().toISOString(),
  };
}

export const localDemoStoreNotice =
  "Local demo persistence only. Replace this JSON store with production auth, database, document storage, and payments before launch.";
