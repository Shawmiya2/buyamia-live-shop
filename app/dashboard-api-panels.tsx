"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  AnalyticsSummary,
  DashboardResponse,
  DashboardType,
  LiveEvent,
  Provider,
} from "@/lib/backend/types";
import { readDemoSession } from "@/lib/demo-session";

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

export function DashboardApiPanels({
  dashboardType,
  title,
}: DashboardApiPanelsProps) {
  const [state, setState] = useState<ApiState>({ status: "loading" });

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      try {
        setState({ status: "loading" });
        const demoSession = readDemoSession();
        const headers = demoSession
          ? {
              "x-demo-profile-type": demoSession.profileType,
              "x-demo-user-id": demoSession.userId,
            }
          : undefined;

        const [dashboardResponse, analyticsResponse] = await Promise.all([
          fetch(`/api/dashboard/${dashboardType}`, {
            cache: "no-store",
            headers,
          }),
          fetch(`/api/analytics/${dashboardType}`, {
            cache: "no-store",
            headers,
          }),
        ]);

        if (!dashboardResponse.ok || !analyticsResponse.ok) {
          throw new Error("Dashboard API request failed.");
        }

        const dashboard = (await dashboardResponse.json()) as DashboardResponse;
        const analyticsPayload =
          (await analyticsResponse.json()) as AnalyticsApiResponse;

        if (isMounted) {
          setState({
            status: "ready",
            dashboard,
            analytics: analyticsPayload.analyticsSummary,
          });
        }
      } catch (error) {
        if (isMounted) {
          setState({
            status: "error",
            error:
              error instanceof Error
                ? error.message
                : "Unable to load dashboard API data.",
          });
        }
      }
    }

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, [dashboardType]);

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

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DataCard
          label="verificationStatus"
          value={formatStatus(state.dashboard.verificationStatus)}
          detail={`Role: ${formatStatus(state.dashboard.role)} - auth: ${state.dashboard.auth?.authMode ?? "demo"}`}
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

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <PinnedLivesPanel lives={state.dashboard.pinnedLives} />
        <div className="grid gap-5">
          <AnalyticsSummaryPanel analytics={state.analytics} />
          <NextActionsPanel actions={state.dashboard.nextActions} />
        </div>
      </div>
    </section>
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

function PinnedLivesPanel({ lives }: { lives: LiveEvent[] }) {
  return (
    <section className="rounded-3xl border border-[#d6cbb6] bg-[#f3ecdc] p-4">
      <PanelHeader eyebrow="pinnedLives" title="Pinned backend lives" badge={`${lives.length}`} />
      <div className="mt-4 grid gap-3">
        {lives.length > 0 ? (
          lives.map((live) => (
            <article key={live.id} className="rounded-2xl bg-[#fffaf0] p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold">{live.title}</p>
                  <p className="mt-1 text-sm text-[#675f50]">
                    {live.providerName} - {formatStatus(live.providerRole)}
                  </p>
                </div>
                <span className="w-fit rounded-full bg-[#b85438] px-3 py-1 text-xs font-black text-white">
                  {formatStatus(live.pinReason ?? "pinned")}
                </span>
              </div>
              <div className="mt-3 grid gap-2 text-xs font-bold text-[#596540] sm:grid-cols-3">
                <span>{formatNumber(live.viewerCount)} viewers</span>
                <span>{formatNumber(live.replayViews)} replay views</span>
                <span>{live.conversionIntent}% intent</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-[#edf2dd] px-3 py-1 text-xs font-black text-[#596540]">
                  Replay available for {live.replay.extensionDays} days
                </span>
                <span className="rounded-full bg-[#f3ecdc] px-3 py-1 text-xs font-black text-[#596540]">
                  {live.replay.daysRemaining > 0
                    ? `Expires in ${live.replay.daysRemaining} days`
                    : "Replay expired"}
                </span>
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

function AnalyticsSummaryPanel({ analytics }: { analytics: AnalyticsSummary }) {
  const rows = useMemo(() => Object.entries(analytics), [analytics]);

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

function formatStatus(value: string) {
  return value.replace(/_/g, " ");
}
