"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type {
  AnalyticsSummary,
  ConversionAttributionSummary,
  DashboardResponse,
  DashboardType,
  IntentInsightsSummary,
  LiveEvent,
  PinReason,
  Provider,
  ServiceLiveSetupRequest,
  VerificationStatus,
} from "@/lib/backend/types";
type DashboardApiPanelsProps = {
  dashboardType: DashboardType;
  title: string;
};

type ApiState =
  | { status: "loading"; dashboard?: undefined; analytics?: undefined; error?: undefined }
  | {
      status: "ready";
      dashboard: DashboardResponse;
      analytics: AnalyticsSummary;
      error?: undefined;
    }
  | { status: "error"; dashboard?: undefined; analytics?: undefined; error: string };

type AnalyticsApiResponse = {
  dashboardType: DashboardType;
  auth?: DashboardResponse["auth"];
  analyticsSummary: AnalyticsSummary;
};

type ApiEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; fields?: Record<string, string> } };

const pinReasons: PinReason[] = [
  "sponsored",
  "nearby",
  "most_watched",
  "featured_by_buyamia",
];

const providerDashboardTypes: DashboardType[] = ["hotel", "restaurant", "supplier", "services"];
const liveRequestCategories = [
  "Rooms",
  "Hotel",
  "Restaurant",
  "Food & Brunch",
  "Spa",
  "Facilities",
  "Services",
  "Experiences",
  "Other",
];
const liveRequestStatusLabels: Record<string, string> = {
  draft: "Draft",
  pending_review: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
  scheduled: "Scheduled",
  active: "Active",
  completed: "Completed",
  canceled: "Canceled",
};

export function DashboardApiPanels({
  dashboardType,
  title,
}: DashboardApiPanelsProps) {
  const [state, setState] = useState<ApiState>({ status: "loading" });
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [pendingAction, setPendingAction] = useState("");

  const loadDashboardData = useCallback(async () => {
    try {
      setState({ status: "loading" });
      const [dashboardResponse, analyticsResponse] = await Promise.all([
        fetch(`/api/dashboard/${dashboardType}`, {
          cache: "no-store",
        }),
        fetch(`/api/analytics/${dashboardType}`, {
          cache: "no-store",
        }),
      ]);

      const dashboardPayload = (await dashboardResponse.json()) as ApiEnvelope<DashboardResponse>;
      const analyticsPayload = (await analyticsResponse.json()) as ApiEnvelope<AnalyticsApiResponse>;

      if (!dashboardPayload.success) {
        throw new Error(dashboardPayload.error.message);
      }
      if (!analyticsPayload.success) {
        throw new Error(analyticsPayload.error.message);
      }

      setState({
        status: "ready",
        dashboard: dashboardPayload.data,
        analytics: analyticsPayload.data.analyticsSummary,
      });
    } catch (error) {
      setState({
        status: "error",
        error:
          error instanceof Error
            ? error.message
            : "Unable to load dashboard API data.",
      });
    }
  }, [dashboardType]);

  useEffect(() => {
    void Promise.resolve().then(loadDashboardData);
  }, [loadDashboardData]);

  const runAction = useCallback(
    async (label: string, request: () => Promise<Response>, successMessage?: string) => {
      setPendingAction(label);
      setActionMessage("");
      setActionError("");

      try {
        const response = await request();

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as
            | { error?: { message?: string } }
            | null;
          throw new Error(payload?.error?.message ?? `${label} failed.`);
        }

        setActionMessage(successMessage ?? `${label} saved.`);
        await loadDashboardData();
      } catch (error) {
        setActionError(
          error instanceof Error ? error.message : `${label} failed.`,
        );
      } finally {
        setPendingAction("");
      }
    },
    [loadDashboardData],
  );

  if (state.status === "loading") {
    return (
      <section className="mt-5 rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
        <PanelHeader
          eyebrow="Backend data"
          title={`${title} API snapshot`}
          badge="Loading"
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {["Verification", "Live stats", "Replay stats", "Analytics"].map(
            (item) => (
              <div key={item} className="rounded-2xl bg-[#f3ecdc] p-4">
                <p className="text-xs font-bold uppercase tracking-[.14em] text-[#6f7f4f]">
                  {item}
                </p>
                <div className="mt-4 h-8 rounded-xl bg-[#ded4c2]" />
                <div className="mt-3 h-3 w-2/3 rounded-full bg-[#ded4c2]" />
              </div>
            ),
          )}
        </div>
      </section>
    );
  }

  if (state.status === "error") {
    return (
      <section className="mt-5 rounded-3xl border border-[#d9b2a3] bg-[#fff3ed] p-5 shadow-sm">
        <PanelHeader
          eyebrow="Backend data"
          title={`${title} API snapshot`}
          badge="Unavailable"
        />
        <p className="mt-3 text-sm leading-6 text-[#8c3f2b]">{state.error}</p>
      </section>
    );
  }

  return (
    <section className="mt-5 rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
      <PanelHeader
        eyebrow="Backend data"
        title={`${title} API snapshot`}
        badge={`/api/dashboard/${dashboardType}`}
      />

      {(actionMessage || actionError || pendingAction) && (
        <div className="mt-4 grid gap-2">
          {pendingAction && (
            <p className="rounded-2xl bg-[#edf2dd] p-3 text-sm font-bold text-[#596540]">
              {pendingAction}...
            </p>
          )}
          {actionMessage && (
            <p className="rounded-2xl bg-[#edf2dd] p-3 text-sm font-bold text-[#596540]">
              {actionMessage}
            </p>
          )}
          {actionError && (
            <p className="rounded-2xl bg-[#fff3ed] p-3 text-sm font-bold text-[#8c3f2b]">
              {actionError}
            </p>
          )}
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DataCard
          label="verificationStatus"
          value={formatStatus(state.dashboard.verificationStatus)}
          detail={`Role: ${formatStatus(state.dashboard.role)} - local user: ${state.dashboard.currentUserId ?? "none"}`}
        />
        <DataCard
          label="liveStats"
          value={`${state.dashboard.liveStats.activeLives} live`}
          detail={`${state.dashboard.liveStats.totalLives} total, ${state.dashboard.liveStats.scheduledLives} scheduled`}
          tone="live"
        />
        <DataCard
          label="replayStats"
          value={`${formatNumber(state.dashboard.replayStats.replayViews)} views`}
          detail={`${state.dashboard.replayStats.availableReplays} available, ${state.dashboard.replayStats.expiringReplays} expiring`}
        />
        <DataCard
          label="subscriptions / followers"
          value={subscriptionValue(state.dashboard)}
          detail={subscriptionDetail(state.dashboard)}
          tone="dark"
        />
      </div>

      <VerificationControls
        dashboard={state.dashboard}
        pendingAction={pendingAction}
        runAction={runAction}
      />

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <PinnedLivesPanel
          lives={state.dashboard.liveCatalog ?? state.dashboard.pinnedLives}
          pinnedCount={state.dashboard.pinnedLives.length}
          dashboardType={dashboardType}
          pendingAction={pendingAction}
          runAction={runAction}
        />
        <div className="grid gap-5">
          <AnalyticsSummaryPanel analytics={state.analytics} />
          <ConversionAttributionPanel attribution={state.analytics.conversionAttribution} />
          <IntentInsightsPanel insights={state.analytics.intentInsights} />
          <NextActionsPanel actions={state.dashboard.nextActions} />
        </div>
      </div>

      {dashboardType === "viewer" && (
        <ViewerFollowPanel
          dashboard={state.dashboard}
          pendingAction={pendingAction}
          runAction={runAction}
        />
      )}

      {providerDashboardTypes.includes(dashboardType) && (
        <ProviderLiveRequestPanel
          dashboard={state.dashboard}
          pendingAction={pendingAction}
          runAction={runAction}
        />
      )}

      {dashboardType === "main" && (
        <MainLiveRequestPanel
          dashboard={state.dashboard}
          pendingAction={pendingAction}
          runAction={runAction}
        />
      )}
    </section>
  );
}

function VerificationControls({
  dashboard,
  pendingAction,
  runAction,
}: {
  dashboard: DashboardResponse;
  pendingAction: string;
  runAction: (label: string, request: () => Promise<Response>, successMessage?: string) => Promise<void>;
}) {
  if (!dashboard.currentUserId) {
    return null;
  }

  const statuses: { label: string; status: VerificationStatus }[] = [
    { label: "Mark as pending", status: "pending" },
    { label: "Mark as verified", status: "verified" },
    { label: "Request more info", status: "needs_more_info" },
  ];

  return (
    <div id="verification" className="mt-4 rounded-2xl border border-[#d6cbb6] bg-[#f3ecdc] p-4">
      <p className="text-sm font-bold text-[#596540]">Verification demo controls</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {statuses.map((item) => (
          <button
            key={item.status}
            type="button"
            disabled={Boolean(pendingAction)}
            onClick={() =>
              runAction(item.label, () =>
                fetch("/api/verification/status", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    userId: dashboard.currentUserId,
                    status: item.status,
                  }),
                }),
              )
            }
            className="rounded-full bg-[#1e2419] px-4 py-2 text-sm font-bold text-[#fffaf0] transition hover:bg-[#596540] disabled:opacity-60"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function PanelHeader({
  eyebrow,
  title,
  badge,
}: {
  eyebrow: string;
  title: string;
  badge: string;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6f7f4f]">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-xl font-semibold">{title}</h2>
      </div>
      <span className="w-fit rounded-full bg-[#edf2dd] px-3 py-1 text-xs font-black text-[#596540]">
        {badge}
      </span>
    </div>
  );
}

function DataCard({
  label,
  value,
  detail,
  tone = "default",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "default" | "live" | "dark";
}) {
  const className =
    tone === "dark"
      ? "border-[#1e2419] bg-[#1e2419] text-[#fffaf0]"
      : tone === "live"
        ? "border-[#d9b2a3] bg-[#fff3ed]"
        : "border-[#d6cbb6] bg-[#f3ecdc]";

  return (
    <article className={`rounded-2xl border p-4 ${className}`}>
      <p
        className={`text-[11px] font-bold uppercase tracking-[.14em] ${
          tone === "dark" ? "text-[#cbd8a7]" : "text-[#6f7f4f]"
        }`}
      >
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
      <p
        className={`mt-2 text-xs leading-5 ${
          tone === "dark" ? "text-[#ded8ca]" : "text-[#675f50]"
        }`}
      >
        {detail}
      </p>
    </article>
  );
}

function PinnedLivesPanel({
  lives,
  pinnedCount,
  dashboardType,
  pendingAction,
  runAction,
}: {
  lives: LiveEvent[];
  pinnedCount: number;
  dashboardType: DashboardType;
  pendingAction: string;
  runAction: (label: string, request: () => Promise<Response>, successMessage?: string) => Promise<void>;
}) {
  const [selectedReasons, setSelectedReasons] = useState<Record<string, PinReason>>({});

  if (dashboardType === "viewer") {
    const preview = lives.slice(0, 5);
    return (
      <section className="rounded-3xl border border-[#d6cbb6] bg-[#f3ecdc] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <PanelHeader eyebrow="liveCatalog" title="Backend live controls" badge={`${preview.length} preview items`} />
        </div>
        <div className="mt-4 grid gap-2">
          {preview.length > 0 ? (
            preview.map((live, index) => (
              <article key={`${live.id}-preview-${index}`} className="grid gap-3 rounded-2xl bg-[#fffaf0] p-3 md:grid-cols-[1.2fr_.8fr_.7fr_.7fr_.7fr_.45fr] md:items-center">
                <div>
                  <p className="text-sm font-black leading-5">{live.title}</p>
                  <p className="mt-1 text-xs font-semibold text-[#675f50]">{live.providerName}</p>
                </div>
                <span className="text-xs font-bold text-[#596540]">{live.category}</span>
                <span className="rounded-full bg-[#edf2dd] px-3 py-1 text-center text-xs font-black text-[#596540]">
                  {formatStatus(live.status)}
                </span>
                <span className="text-xs font-semibold text-[#675f50]">{formatDate(live.startsAt)}</span>
                <span className="rounded-full bg-[#1e2419] px-3 py-1 text-center text-xs font-black text-[#fffaf0]">
                  Trust {live.trustScore.score}
                </span>
                <Link href={`/live/${live.id}`} className="text-center text-xs font-black text-[#596540]">
                  Open
                </Link>
              </article>
            ))
          ) : (
            <p className="rounded-2xl bg-[#fffaf0] p-4 text-sm text-[#675f50]">
              No live catalogue preview items are available.
            </p>
          )}
        </div>
        <Link
          href="/live/catalogue"
          className="mt-4 inline-flex rounded-full border border-[#cabda4] bg-[#fffaf0] px-5 py-3 text-sm font-bold text-[#1e2419] transition hover:bg-white"
        >
          View Full Catalogue
        </Link>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-[#d6cbb6] bg-[#f3ecdc] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PanelHeader eyebrow="liveCatalog" title="Backend live controls" badge={`${pinnedCount} active pins`} />
        <Link
          href="/dashboard/main/lives"
          className="w-fit rounded-full bg-[#1e2419] px-4 py-2 text-sm font-bold text-[#fffaf0] transition hover:bg-[#596540]"
        >
          Manage all lives
        </Link>
      </div>
      <div className="mt-4 grid gap-3">
        {lives.length > 0 ? (
          lives.map((live, index) => (
            <article key={`${live.id}-pinned-${index}`} className="rounded-2xl bg-[#fffaf0] p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold">{live.title}</p>
                  <p className="mt-1 text-sm text-[#675f50]">
                    {live.providerName} - {formatStatus(live.providerRole)}
                  </p>
                </div>
                <span className="w-fit rounded-full bg-[#b85438] px-3 py-1 text-xs font-black text-white">
                  {live.isPinned
                    ? formatStatus(live.pinReason ?? "pinned")
                    : "unpinned"}
                </span>
              </div>
              <div className="mt-3 grid gap-2 text-xs font-bold text-[#596540] sm:grid-cols-3">
                <span>{formatNumber(live.viewerCount)} viewers</span>
                <span>{formatNumber(live.replayViews)} replay views</span>
                <span>{live.conversionIntent}% intent</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-[#1e2419] px-3 py-1 text-xs font-black text-[#fffaf0]">
                  Trust {live.trustScore.score}
                </span>
                <span className="rounded-full bg-[#edf2dd] px-3 py-1 text-xs font-black text-[#596540]">
                  {replayExpirationLabel(live)}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={Boolean(pendingAction)}
                  onClick={() =>
                    runAction("Extend replay by 5 days", () =>
                      fetch(`/api/lives/${live.id}/replay-expiration`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ extensionDays: 5 }),
                      }),
                    )
                  }
                  className="rounded-full bg-[#6f7f4f] px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
                >
                  {pendingAction === "Extend replay by 5 days" ? "Extending..." : "Extend replay by 5 days"}
                </button>
                {live.isPinned ? (
                  <button
                    type="button"
                    disabled={Boolean(pendingAction)}
                    onClick={() =>
                      runAction("Unpin live", () =>
                        fetch(`/api/lives/${live.id}/pin`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ isPinned: false }),
                        }),
                      )
                    }
                    className="rounded-full border border-[#cabda4] px-3 py-2 text-xs font-bold text-[#1e2419] disabled:opacity-60"
                  >
                    {pendingAction === "Unpin live" ? "Unpinning..." : "Unpin"}
                  </button>
                ) : (
                  <>
                    <select
                      aria-label={`Pin reason for ${live.title}`}
                      value={selectedReasons[live.id] ?? pinReasons[index % pinReasons.length]}
                      onChange={(event) =>
                        setSelectedReasons((current) => ({
                          ...current,
                          [live.id]: event.target.value as PinReason,
                        }))
                      }
                      className="rounded-full border border-[#cabda4] bg-[#fffaf0] px-3 py-2 text-xs font-bold text-[#1e2419]"
                    >
                      {pinReasons.map((reason) => (
                        <option key={reason} value={reason}>{formatStatus(reason)}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={Boolean(pendingAction)}
                      onClick={() =>
                        runAction("Pin live", () =>
                          fetch(`/api/lives/${live.id}/pin`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              isPinned: true,
                              pinReason: selectedReasons[live.id] ?? pinReasons[index % pinReasons.length],
                            }),
                          }),
                        )
                      }
                      className="rounded-full border border-[#cabda4] px-3 py-2 text-xs font-bold text-[#1e2419] disabled:opacity-60"
                    >
                      {pendingAction === "Pin live" ? "Pinning..." : "Pin live"}
                    </button>
                  </>
                )}
                <Link
                  href={`/dashboard/main/lives/${live.id}`}
                  className="rounded-full border border-[#cabda4] px-3 py-2 text-xs font-bold text-[#1e2419]"
                >
                  Details
                </Link>
              </div>
            </article>
          ))
        ) : (
          <p className="rounded-2xl bg-[#fffaf0] p-4 text-sm text-[#675f50]">
            No pinned lives returned for this dashboard.
          </p>
        )}
      </div>
    </section>
  );
}

function ViewerFollowPanel({
  dashboard,
  pendingAction,
  runAction,
}: {
  dashboard: DashboardResponse;
  pendingAction: string;
  runAction: (label: string, request: () => Promise<Response>, successMessage?: string) => Promise<void>;
}) {
  const viewerId = dashboard.currentUserId ?? "user_viewer_mock";
  const followed = dashboard.subscriptions?.followedProviders ?? [];
  const available = dashboard.subscriptions?.availableProviders ?? [];
  const replayFeed = dashboard.subscriptions?.replayFeed ?? [];
  const upcomingLives = dashboard.subscriptions?.upcomingLives ?? [];

  return (
    <section className="mt-5 rounded-3xl border border-[#d6cbb6] bg-[#f3ecdc] p-4">
      <PanelHeader eyebrow="viewer subscriptions" title="Followed providers and feeds" badge={viewerId} />
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <ProviderList
          title="Following"
          providers={followed}
          empty="No followed providers yet."
          actionLabel="Unfollow"
          footerHref="/viewer/subscriptions#following"
          footerLabel="View All Following"
          pendingAction={pendingAction}
          onProviderAction={(providerId) =>
            runAction("Unfollow provider", () =>
              fetch("/api/subscriptions/follow", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ viewerId, viewerUserId: viewerId, providerId }),
              }),
            )
          }
        />
        <ProviderList
          title="Available to follow"
          providers={available}
          empty="All providers are currently followed."
          actionLabel="Follow"
          footerHref="/viewer/subscriptions#providers"
          footerLabel="View All Providers"
          pendingAction={pendingAction}
          onProviderAction={(providerId) =>
            runAction("Follow provider", () =>
              fetch("/api/subscriptions/follow", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ viewerId, viewerUserId: viewerId, providerId }),
              }),
            )
          }
        />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <LiveFeed title="Available replays from followed providers" lives={replayFeed} />
        <LiveFeed title="Upcoming lives from followed providers" lives={upcomingLives} />
      </div>
    </section>
  );
}

function ProviderList({
  title,
  providers,
  empty,
  actionLabel,
  footerHref,
  footerLabel,
  pendingAction,
  onProviderAction,
}: {
  title: string;
  providers: Provider[];
  empty: string;
  actionLabel: string;
  footerHref: string;
  footerLabel: string;
  pendingAction: string;
  onProviderAction: (providerId: string) => void;
}) {
  return (
    <div className="rounded-2xl bg-[#fffaf0] p-4">
      <p className="text-sm font-bold">{title}</p>
      <div className="mt-3 grid gap-2">
        {providers.length ? (
          providers.map((provider) => (
            <div
              key={provider.id}
              className="grid gap-2 rounded-xl bg-[#f3ecdc] p-3 sm:grid-cols-[1fr_auto] sm:items-center"
            >
              <div>
                <p className="text-sm font-semibold">{provider.name}</p>
                <div className="mt-1 flex flex-wrap gap-2 text-xs font-bold text-[#675f50]">
                  <span>{formatStatus(provider.profileType)}</span>
                  <span>Trust {provider.trustScore ?? "n/a"}</span>
                  <span>{actionLabel === "Unfollow" ? "Following" : "Available"}</span>
                </div>
              </div>
              <button
                type="button"
                disabled={Boolean(pendingAction)}
                onClick={() => onProviderAction(provider.id)}
                className="rounded-full bg-[#1e2419] px-3 py-2 text-xs font-bold text-[#fffaf0] disabled:opacity-60"
              >
                {actionLabel}
              </button>
            </div>
          ))
        ) : (
          <p className="rounded-xl bg-[#f3ecdc] p-3 text-sm text-[#675f50]">{empty}</p>
        )}
      </div>
      <Link href={footerHref} className="mt-3 inline-flex rounded-full border border-[#cabda4] bg-[#fffaf0] px-4 py-2 text-xs font-black text-[#1e2419]">
        {footerLabel}
      </Link>
    </div>
  );
}

function LiveFeed({ title, lives }: { title: string; lives: LiveEvent[] }) {
  return (
    <div className="rounded-2xl bg-[#fffaf0] p-4">
      <p className="text-sm font-bold">{title}</p>
      <div className="mt-3 grid gap-2">
        {lives.length ? (
          lives.map((live, index) => (
            <div key={`${live.id}-feed-${index}`} className="rounded-xl bg-[#f3ecdc] p-3">
              <p className="text-sm font-semibold">{live.title}</p>
              <p className="mt-1 text-xs text-[#675f50]">
                {live.providerName} - {formatStatus(live.status)}
              </p>
              <a
                href={`/live/${live.id}`}
                className="mt-2 inline-flex rounded-full border border-[#cabda4] px-3 py-1.5 text-xs font-bold text-[#1e2419]"
              >
                View live
              </a>
            </div>
          ))
        ) : (
          <p className="rounded-xl bg-[#f3ecdc] p-3 text-sm text-[#675f50]">
            No lives returned for this feed.
          </p>
        )}
      </div>
    </div>
  );
}

type LiveRequestForm = {
  title: string;
  category: string;
  description: string;
  preferredDate: string;
};

type LiveRequestFormField = keyof LiveRequestForm;

function ProviderLiveRequestPanel({
  dashboard,
  pendingAction,
  runAction,
}: {
  dashboard: DashboardResponse;
  pendingAction: string;
  runAction: (label: string, request: () => Promise<Response>, successMessage?: string) => Promise<void>;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [form, setForm] = useState<LiveRequestForm>({
    title: "",
    category: "",
    description: "",
    preferredDate: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<LiveRequestFormField, string>>>({});
  const requests = dashboard.serviceLiveSetupRequests ?? [];

  function updateForm(key: LiveRequestFormField, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      const rest = { ...current };
      delete rest[key];
      return rest;
    });
  }

  function validateForm() {
    const errors: Partial<Record<LiveRequestFormField, string>> = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const preferredDate = form.preferredDate ? new Date(form.preferredDate) : null;

    if (!form.title.trim()) {
      errors.title = "Please enter a live title.";
    }
    if (!form.category) {
      errors.category = "Please select a category.";
    }
    if (!form.description.trim()) {
      errors.description = "Please describe the live.";
    }
    if (!form.preferredDate) {
      errors.preferredDate = "Please select a preferred date.";
    } else if (preferredDate && preferredDate < today) {
      errors.preferredDate = "The preferred date cannot be in the past.";
    }

    return errors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    await runAction("Create a live request", async () => {
      const response = await fetch("/api/live-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          documentMetadata: { placeholder: "Document metadata placeholder" },
        }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as ApiEnvelope<unknown> | null;
        if (payload && !payload.success && payload.error.fields) {
          setFieldErrors(payload.error.fields as Partial<Record<LiveRequestFormField, string>>);
        }
      }
      return response;
    }, "Your live request has been submitted for review.");

    setForm({
      title: "",
      category: "",
      description: "",
      preferredDate: "",
    });
    setFieldErrors({});
    setIsExpanded(false);
  }

  return (
    <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_.9fr]">
      <div className="rounded-3xl border border-[#d6cbb6] bg-[#f3ecdc] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <PanelHeader
            eyebrow="live request workflow"
            title="Create a live request"
            badge="/api/live-requests"
          />
          <button
            type="button"
            onClick={() => setIsExpanded((current) => !current)}
            className="w-fit rounded-full bg-[#1e2419] px-5 py-3 text-sm font-bold text-[#fffaf0] transition hover:bg-[#596540]"
          >
            Create a live request
          </button>
        </div>

        {dashboard.verificationStatus !== "verified" && (
          <div className="mt-4 rounded-2xl border border-[#cabda4] bg-[#fffaf0] p-4 text-sm text-[#675f50]">
            <p className="font-semibold text-[#1e2419]">Verification is still available from this dashboard.</p>
            <p className="mt-1 leading-6">You can submit the request for review now. The admin review keeps verification and scheduling controls separate.</p>
            <a href="#verification" className="mt-3 inline-flex rounded-full border border-[#cabda4] px-4 py-2 text-xs font-bold text-[#1e2419]">
              Go to verification
            </a>
          </div>
        )}

        {isExpanded && (
          <form onSubmit={handleSubmit} noValidate className="mt-4 grid gap-3">
            <LiveRequestTextField label="Title" name="title" value={form.title} error={fieldErrors.title} onChange={(value) => updateForm("title", value)} />
            <label className="grid gap-2 text-sm font-bold text-[#596540]">
              Category
              <select
                value={form.category}
                onChange={(event) => updateForm("category", event.target.value)}
                aria-invalid={fieldErrors.category ? true : undefined}
                aria-describedby={fieldErrors.category ? "live-request-category-error" : undefined}
                className={`rounded-2xl border bg-[#fffaf0] px-4 py-3 text-sm font-semibold text-[#1e2419] outline-none ${fieldErrors.category ? "border-[#b85438]" : "border-[#cabda4]"}`}
              >
                <option value="">Select a category</option>
                {liveRequestCategories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              {fieldErrors.category && <span id="live-request-category-error" className="text-sm font-semibold text-[#8c3f2b]">{fieldErrors.category}</span>}
            </label>
            <label className="grid gap-2 text-sm font-bold text-[#596540]">
              Description
              <textarea
                value={form.description}
                onChange={(event) => updateForm("description", event.target.value)}
                aria-invalid={fieldErrors.description ? true : undefined}
                aria-describedby={fieldErrors.description ? "live-request-description-error" : undefined}
                className={`min-h-24 rounded-2xl border bg-[#fffaf0] px-4 py-3 text-sm font-semibold text-[#1e2419] outline-none ${fieldErrors.description ? "border-[#b85438]" : "border-[#cabda4]"}`}
              />
              {fieldErrors.description && <span id="live-request-description-error" className="text-sm font-semibold text-[#8c3f2b]">{fieldErrors.description}</span>}
            </label>
          <div className="rounded-2xl border border-dashed border-[#cabda4] bg-[#fffaf0] p-4 text-sm font-semibold text-[#675f50]">
              Document metadata placeholder: optional metadata can be attached later.
          </div>
            <LiveRequestTextField label="Preferred date" name="preferredDate" type="date" value={form.preferredDate} error={fieldErrors.preferredDate} onChange={(value) => updateForm("preferredDate", value)} />
            <button
              type="submit"
              disabled={pendingAction === "Create a live request"}
              className="rounded-full bg-[#1e2419] px-5 py-3 text-sm font-bold text-[#fffaf0] transition hover:bg-[#596540] disabled:opacity-60"
            >
              {pendingAction === "Create a live request" ? "Submitting..." : "Submit for review"}
            </button>
          </form>
        )}
      </div>
      <LiveRequestList requests={requests} title="Your live requests" dark />
    </section>
  );
}

function LiveRequestTextField({
  label,
  name,
  value,
  onChange,
  error,
  type = "text",
}: {
  label: string;
  name: LiveRequestFormField;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
}) {
  const errorId = `live-request-${name}-error`;

  return (
    <label className="grid gap-2 text-sm font-bold text-[#596540]">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`rounded-2xl border bg-[#fffaf0] px-4 py-3 text-sm font-semibold text-[#1e2419] outline-none ${error ? "border-[#b85438]" : "border-[#cabda4]"}`}
      />
      {error && <span id={errorId} className="text-sm font-semibold text-[#8c3f2b]">{error}</span>}
    </label>
  );
}

function MainLiveRequestPanel({
  dashboard,
  pendingAction,
  runAction,
}: {
  dashboard: DashboardResponse;
  pendingAction: string;
  runAction: (label: string, request: () => Promise<Response>, successMessage?: string) => Promise<void>;
}) {
  const requests = dashboard.pendingLiveRequests ?? [];
  const previewRequests = requests.slice(0, 4);

  return (
    <section id="pending-live-requests" className="mt-5 rounded-3xl border border-[#d6cbb6] bg-[#f3ecdc] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PanelHeader eyebrow="main admin review" title="Pending live requests" badge={`${requests.length}`} />
        <Link
          href="/dashboard/main/live-requests"
          className="w-fit rounded-full bg-[#1e2419] px-4 py-2 text-sm font-bold text-[#fffaf0] transition hover:bg-[#596540]"
        >
          View full catalogue
        </Link>
      </div>
      {requests.length > previewRequests.length && (
        <p className="mt-3 text-sm font-semibold text-[#675f50]">
          Showing {previewRequests.length} of {requests.length} pending requests.
        </p>
      )}
      <div className="mt-4 grid gap-3">
        {previewRequests.length ? (
          previewRequests.map((request) => (
            <article key={request.id} className="rounded-2xl bg-[#fffaf0] p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold">{request.title}</p>
                  <p className="mt-1 text-sm text-[#675f50]">
                    {(request.provider?.displayName || request.provider?.user.name || "Provider")} - {formatStatus(request.provider?.user.role ?? request.provider?.category ?? "provider")}
                  </p>
                </div>
                <span className="w-fit rounded-full bg-[#edf2dd] px-3 py-1 text-xs font-black text-[#596540]">
                  {statusLabel(request.status)}
                </span>
              </div>
              <div className="mt-3 grid gap-2 text-xs font-semibold text-[#675f50] sm:grid-cols-3">
                <span>{request.category}</span>
                <span>Preferred date: {formatDate(request.preferredDate)}</span>
                <span>Created: {formatDate(request.createdAt)}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={Boolean(pendingAction)}
                  onClick={() => runAction("Approve live request", () => reviewRequest(request.id, "approved"))}
                  className="rounded-full bg-[#6f7f4f] px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={Boolean(pendingAction)}
                  onClick={() => runAction("Reject live request", () => reviewRequest(request.id, "rejected", "Rejected by main admin."))}
                  className="rounded-full border border-[#cabda4] px-3 py-2 text-xs font-bold text-[#1e2419] disabled:opacity-60"
                >
                  Reject
                </button>
                <button
                  type="button"
                  disabled={Boolean(pendingAction)}
                  onClick={() => runAction("Request more information", () => reviewRequest(request.id, "rejected", "Please provide more information before scheduling."))}
                  className="rounded-full border border-[#cabda4] px-3 py-2 text-xs font-bold text-[#1e2419] disabled:opacity-60"
                >
                  Request more information
                </button>
                <button
                  type="button"
                  disabled={Boolean(pendingAction) || request.status !== "approved"}
                  aria-describedby={request.status !== "approved" ? `schedule-help-${request.id}` : undefined}
                  onClick={() =>
                    runAction("Schedule live request", () =>
                      fetch(`/api/admin/live-requests/${request.id}/schedule`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ scheduledAt: new Date(Date.now() + 86400000).toISOString() }),
                      }),
                    )
                  }
                  className="rounded-full border border-[#cabda4] px-3 py-2 text-xs font-bold text-[#1e2419] disabled:opacity-60"
                >
                  Schedule
                </button>
                {request.status !== "approved" && (
                  <span id={`schedule-help-${request.id}`} className="basis-full text-xs font-semibold text-[#675f50]">
                    Schedule unlocks after this request is approved.
                  </span>
                )}
              </div>
            </article>
          ))
        ) : (
          <p className="rounded-2xl bg-[#fffaf0] p-4 text-sm text-[#675f50]">
            No pending live requests.
          </p>
        )}
      </div>
    </section>
  );
}

function reviewRequest(requestId: string, status: "approved" | "rejected", adminNote?: string) {
  return fetch(`/api/admin/live-requests/${requestId}/review`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, adminNote }),
  });
}

function LiveRequestList({
  requests,
  title,
  dark = false,
}: {
  requests: ServiceLiveSetupRequest[];
  title: string;
  dark?: boolean;
}) {
  return (
    <section className={`rounded-3xl border p-4 ${dark ? "border-[#1e2419] bg-[#1e2419] text-[#fffaf0]" : "border-[#d6cbb6] bg-[#f3ecdc]"}`}>
      <PanelHeader
        eyebrow="created requests"
        title={title}
        badge={`${requests.length}`}
      />
      <div className="mt-4 grid gap-3">
        {requests.length ? (
          requests.map((request) => (
            <article key={request.id} className={dark ? "rounded-2xl bg-white/[.07] p-4" : "rounded-2xl bg-[#fffaf0] p-4"}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold">{request.title}</p>
                  <p className={`mt-1 text-sm ${dark ? "text-[#ded8ca]" : "text-[#675f50]"}`}>
                    {request.category} - {request.description}
                  </p>
                </div>
                <span className={`w-fit rounded-full px-3 py-1 text-xs font-black ${dark ? "bg-[#fffaf0]/12 text-[#cbd8a7]" : "bg-[#edf2dd] text-[#596540]"}`}>
                  {statusLabel(request.status)}
                </span>
              </div>
              <div className={`mt-3 grid gap-2 text-xs font-semibold ${dark ? "text-[#ded8ca]" : "text-[#675f50]"}`}>
                <span>Preferred date: {formatDate(request.preferredDate)}</span>
                {request.adminNote && <span>Admin note: {request.adminNote}</span>}
                <span>Created: {formatDate(request.createdAt)}</span>
              </div>
            </article>
          ))
        ) : (
          <p className={dark ? "rounded-2xl bg-white/[.07] p-4 text-sm text-[#ded8ca]" : "rounded-2xl bg-[#fffaf0] p-4 text-sm text-[#675f50]"}>
            You have not submitted any live requests yet.
          </p>
        )}
      </div>
    </section>
  );
}

function AnalyticsSummaryPanel({ analytics }: { analytics: AnalyticsSummary }) {
  const rows = useMemo(
    () => Object.entries(analytics).filter(([key]) => key !== "conversionAttribution" && key !== "intentInsights"),
    [analytics],
  );

  return (
    <section className="rounded-3xl border border-[#d6cbb6] bg-[#f3ecdc] p-4">
      <PanelHeader eyebrow="analyticsSummary" title="API analytics" badge="/api/analytics" />
      <div className="mt-4 grid gap-2">
        {rows.map(([key, value]) => (
          <div
            key={key}
            className="flex items-center justify-between gap-3 rounded-2xl bg-[#fffaf0] p-3"
          >
            <span className="text-sm font-semibold">{formatStatus(key)}</span>
            <span className="rounded-full bg-[#edf2dd] px-3 py-1 text-xs font-black text-[#596540]">
              {formatAnalyticsValue(value)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ConversionAttributionPanel({
  attribution,
}: {
  attribution: ConversionAttributionSummary;
}) {
  return (
    <section className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-4 shadow-sm">
      <PanelHeader
        eyebrow="conversionAttribution"
        title="Conversion attribution"
        badge={`Top: ${attribution.topChannel.label}`}
      />

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <DataCard
          label="Top converting channel"
          value={attribution.topChannel.label}
          detail={`${attribution.topChannel.conversions} conversions - ${attribution.topChannel.conversionRate}% attributed share`}
          tone="dark"
        />
        <DataCard
          label="Tracked conversions"
          value={formatNumber(attribution.totalConversions)}
          detail="Demo/local conversion intent grouped by channel source."
        />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {attribution.sources.map((source) => (
          <article
            key={source.source}
            className="rounded-2xl border border-[#d6cbb6] bg-[#f3ecdc] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{source.label}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[.14em] text-[#6f7f4f]">
                  {source.intentLabel}
                </p>
              </div>
              <span className="rounded-full bg-[#edf2dd] px-3 py-1 text-xs font-black text-[#596540]">
                {source.conversionRate}%
              </span>
            </div>
            <p className="mt-4 text-2xl font-semibold">{formatNumber(source.conversions)}</p>
            <p className="mt-1 text-xs leading-5 text-[#675f50]">
              {source.assistedRevenueLabel} assisted value - {source.changeLabel}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-[#d6cbb6]">
        <div className="grid grid-cols-[1.1fr_.8fr_1fr] gap-2 bg-[#1e2419] px-4 py-3 text-xs font-black uppercase tracking-[.12em] text-[#fffaf0]">
          <span>Source</span>
          <span>Conversions</span>
          <span>Primary intent</span>
        </div>
        {attribution.sources.map((source) => (
          <div
            key={`${source.source}-row`}
            className="grid grid-cols-[1.1fr_.8fr_1fr] gap-2 border-t border-[#d6cbb6] bg-[#fffaf0] px-4 py-3 text-sm"
          >
            <span className="font-semibold">{source.label}</span>
            <span>{formatNumber(source.conversions)}</span>
            <span className="text-[#675f50]">{source.intentLabel}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {attribution.intentBySource.map((source) => (
          <div
            key={`${source.source}-intent`}
            className="rounded-2xl border border-[#d6cbb6] bg-[#f3ecdc] p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">{source.label} intent</p>
              <span className="rounded-full bg-[#fffaf0] px-3 py-1 text-xs font-black text-[#596540]">
                {formatNumber(source.totalConversions)}
              </span>
            </div>
            <div className="mt-3 grid gap-2">
              {source.intents.length > 0 ? (
                source.intents.map((intent) => (
                  <div
                    key={`${source.source}-${intent.intent}`}
                    className="flex items-center justify-between gap-3 rounded-xl bg-[#fffaf0] px-3 py-2 text-xs"
                  >
                    <span className="font-semibold">{intent.label}</span>
                    <span className="font-black text-[#596540]">
                      {formatNumber(intent.conversions)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="rounded-xl bg-[#fffaf0] px-3 py-2 text-xs text-[#675f50]">
                  No intent events for this source yet.
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function IntentInsightsPanel({
  insights,
}: {
  insights: IntentInsightsSummary;
}) {
  return (
    <section className="rounded-3xl border border-[#d6cbb6] bg-[#f3ecdc] p-4 shadow-sm">
      <PanelHeader
        eyebrow="intentInsights"
        title="Intent insights"
        badge={`${insights.totalSignals} signals`}
      />

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <DataCard
          label="Top buyer intent"
          value={insights.topBuyerIntent.label}
          detail={`${insights.topBuyerIntent.count} captured signals - live questions and replay reuse`}
          tone="dark"
        />
        <DataCard
          label="Most common hesitation"
          value={insights.mostCommonHesitation.label}
          detail={`${insights.mostCommonHesitation.count} signals - ${insights.mostCommonHesitation.detail}`}
        />
        <DataCard
          label="Most compared product"
          value={insights.mostComparedProducts.label}
          detail={`${insights.mostComparedProducts.count} signals - ${insights.mostComparedProducts.detail}`}
        />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <article className="rounded-2xl border border-[#d6cbb6] bg-[#fffaf0] p-4">
          <p className="text-sm font-semibold">Bundle requests</p>
          <p className="mt-2 text-2xl font-semibold">{formatNumber(insights.bundleRequests.count)}</p>
          <p className="mt-1 text-xs leading-5 text-[#675f50]">{insights.bundleRequests.detail}</p>
        </article>
        <article className="rounded-2xl border border-[#d6cbb6] bg-[#fffaf0] p-4">
          <p className="text-sm font-semibold">RFQ and sample intent</p>
          <p className="mt-2 text-2xl font-semibold">
            {formatNumber(insights.rfqSampleIntent.rfq)} / {formatNumber(insights.rfqSampleIntent.sample)}
          </p>
          <p className="mt-1 text-xs leading-5 text-[#675f50]">{insights.rfqSampleIntent.detail}</p>
        </article>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-[#d6cbb6]">
        <div className="grid grid-cols-[1.2fr_.6fr] gap-2 bg-[#1e2419] px-4 py-3 text-xs font-black uppercase tracking-[.12em] text-[#fffaf0]">
          <span>Rejected reason</span>
          <span>Signals</span>
        </div>
        {insights.rejectedReasons.length ? (
          insights.rejectedReasons.map((reason) => (
            <div
              key={reason.label}
              className="grid grid-cols-[1.2fr_.6fr] gap-2 border-t border-[#d6cbb6] bg-[#fffaf0] px-4 py-3 text-sm"
            >
              <span className="font-semibold">{reason.label}</span>
              <span>{formatNumber(reason.count)}</span>
            </div>
          ))
        ) : (
          <div className="bg-[#fffaf0] px-4 py-3 text-sm text-[#675f50]">
            No rejected reasons captured yet.
          </div>
        )}
      </div>
    </section>
  );
}

function NextActionsPanel({ actions }: { actions: string[] }) {
  return (
    <section className="rounded-3xl border border-[#1e2419] bg-[#1e2419] p-4 text-[#fffaf0]">
      <PanelHeader eyebrow="nextActions" title="Recommended next actions" badge={`${actions.length}`} />
      <div className="mt-4 grid gap-2">
        {actions.map((action) => (
          <div
            key={action}
            className="rounded-2xl bg-white/[.07] p-3 text-sm font-semibold text-[#ded8ca]"
          >
            {action}
          </div>
        ))}
      </div>
    </section>
  );
}

function subscriptionValue(dashboard: DashboardResponse) {
  const followerCount = dashboard.subscriptions?.followerCount;
  const followedProviders = dashboard.subscriptions?.followedProviders;

  if (typeof followerCount === "number") {
    return `${formatNumber(followerCount)} followers`;
  }

  if (followedProviders) {
    return `${followedProviders.length} followed`;
  }

  return "0";
}

function subscriptionDetail(dashboard: DashboardResponse) {
  const followedProviders = dashboard.subscriptions?.followedProviders;

  if (followedProviders?.length) {
    return followedProviders.map((provider: Provider) => provider.name).join(", ");
  }

  if (typeof dashboard.subscriptions?.followerCount === "number") {
    return "Provider follower count from subscriptions API data.";
  }

  return "No subscription data returned for this role.";
}

function formatAnalyticsValue(value: unknown) {
  if (typeof value === "number") {
    return formatNumber(value);
  }

  if (typeof value === "string") {
    return formatStatus(value);
  }

  return String(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function statusLabel(value: string) {
  return liveRequestStatusLabels[value] ?? formatStatus(value);
}

function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function replayExpirationLabel(live: LiveEvent) {
  if (!live.replay.expiresAt || live.replay.status === "expired") {
    return "Replay expired";
  }

  return live.replay.daysRemaining === 1
    ? "Replay expires in 1 day"
    : `Replay expires in ${live.replay.daysRemaining} days`;
}

function formatStatus(value: string) {
  return value.replace(/_/g, " ");
}
