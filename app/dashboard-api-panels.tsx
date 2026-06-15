"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type {
  AnalyticsSummary,
  DashboardResponse,
  DashboardType,
  LiveEvent,
  PinReason,
  Provider,
  ServiceLiveSetupRequest,
  VerificationStatus,
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

const pinReasons: PinReason[] = [
  "sponsored",
  "nearby",
  "most_watched",
  "featured_by_buyamia",
];

export function DashboardApiPanels({
  dashboardType,
  title,
}: DashboardApiPanelsProps) {
  const [state, setState] = useState<ApiState>({ status: "loading" });
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [pendingAction, setPendingAction] = useState("");

  const getDemoHeaders = useCallback(() => {
    const demoSession = readDemoSession();

    return demoSession
      ? {
          "x-demo-profile-type": demoSession.profileType,
          "x-demo-user-id": demoSession.userId,
        }
      : undefined;
  }, []);

  const loadDashboardData = useCallback(async () => {
    try {
      setState({ status: "loading" });
      const headers = getDemoHeaders();
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

      setState({
        status: "ready",
        dashboard,
        analytics: analyticsPayload.analyticsSummary,
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
  }, [dashboardType, getDemoHeaders]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const runAction = useCallback(
    async (label: string, request: () => Promise<Response>) => {
      setPendingAction(label);
      setActionMessage("");
      setActionError("");

      try {
        const response = await request();

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;
          throw new Error(payload?.error ?? `${label} failed.`);
        }

        setActionMessage(`${label} saved locally.`);
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
          pendingAction={pendingAction}
          runAction={runAction}
        />
        <div className="grid gap-5">
          <AnalyticsSummaryPanel analytics={state.analytics} />
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

      {dashboardType === "services" && (
        <ServiceLiveRequestPanel
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
  runAction: (label: string, request: () => Promise<Response>) => Promise<void>;
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
    <div className="mt-4 rounded-2xl border border-[#d6cbb6] bg-[#f3ecdc] p-4">
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
  pendingAction,
  runAction,
}: {
  lives: LiveEvent[];
  pinnedCount: number;
  pendingAction: string;
  runAction: (label: string, request: () => Promise<Response>) => Promise<void>;
}) {
  return (
    <section className="rounded-3xl border border-[#d6cbb6] bg-[#f3ecdc] p-4">
      <PanelHeader eyebrow="liveCatalog" title="Backend live controls" badge={`${pinnedCount} pinned`} />
      <div className="mt-4 grid gap-3">
        {lives.length > 0 ? (
          lives.map((live, index) => (
            <article key={live.id} className="rounded-2xl bg-[#fffaf0] p-4">
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
                <span className="rounded-full bg-[#edf2dd] px-3 py-1 text-xs font-black text-[#596540]">
                  Replay available for {live.replay.extensionDays} days
                </span>
                <span className="rounded-full bg-[#f3ecdc] px-3 py-1 text-xs font-black text-[#596540]">
                  {live.replay.daysRemaining > 0
                    ? `Expires in ${live.replay.daysRemaining} days`
                    : "Replay expired"}
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
                  Extend replay by 5 days
                </button>
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
                  Unpin
                </button>
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
                          pinReason: pinReasons[index % pinReasons.length],
                        }),
                      }),
                    )
                  }
                  className="rounded-full border border-[#cabda4] px-3 py-2 text-xs font-bold text-[#1e2419] disabled:opacity-60"
                >
                  Pin live
                </button>
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
  runAction: (label: string, request: () => Promise<Response>) => Promise<void>;
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
  pendingAction,
  onProviderAction,
}: {
  title: string;
  providers: Provider[];
  empty: string;
  actionLabel: string;
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
              className="flex flex-col gap-2 rounded-xl bg-[#f3ecdc] p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-semibold">{provider.name}</p>
                <p className="text-xs text-[#675f50]">
                  {formatStatus(provider.profileType)} - {formatStatus(provider.verificationStatus)}
                </p>
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
    </div>
  );
}

function LiveFeed({ title, lives }: { title: string; lives: LiveEvent[] }) {
  return (
    <div className="rounded-2xl bg-[#fffaf0] p-4">
      <p className="text-sm font-bold">{title}</p>
      <div className="mt-3 grid gap-2">
        {lives.length ? (
          lives.map((live) => (
            <div key={live.id} className="rounded-xl bg-[#f3ecdc] p-3">
              <p className="text-sm font-semibold">{live.title}</p>
              <p className="mt-1 text-xs text-[#675f50]">
                {live.providerName} - {formatStatus(live.status)}
              </p>
              <a
                href="/live"
                className="mt-2 inline-flex rounded-full border border-[#cabda4] px-3 py-1.5 text-xs font-bold text-[#1e2419]"
              >
                View replays
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

function ServiceLiveRequestPanel({
  dashboard,
  pendingAction,
  runAction,
}: {
  dashboard: DashboardResponse;
  pendingAction: string;
  runAction: (label: string, request: () => Promise<Response>) => Promise<void>;
}) {
  const [form, setForm] = useState({
    serviceName: "",
    serviceCategory: "",
    shortDescription: "",
    preferredLiveDate: "",
  });
  const requests = dashboard.serviceLiveSetupRequests ?? [];

  function updateForm(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction("Set up service live", () =>
      fetch("/api/services/live-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          userId: dashboard.currentUserId,
          providerId: dashboard.providerId,
        }),
      }),
    );
    setForm({
      serviceName: "",
      serviceCategory: "",
      shortDescription: "",
      preferredLiveDate: "",
    });
  }

  return (
    <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_.9fr]">
      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-[#d6cbb6] bg-[#f3ecdc] p-4"
      >
        <PanelHeader
          eyebrow="service live setup"
          title="Set up a live for my service"
          badge="Local demo"
        />
        <div className="mt-4 grid gap-3">
          <TextField label="Service name" value={form.serviceName} onChange={(value) => updateForm("serviceName", value)} />
          <TextField label="Service category" value={form.serviceCategory} onChange={(value) => updateForm("serviceCategory", value)} />
          <label className="grid gap-2 text-sm font-bold text-[#596540]">
            Short description
            <textarea
              value={form.shortDescription}
              onChange={(event) => updateForm("shortDescription", event.target.value)}
              required
              className="min-h-24 rounded-2xl border border-[#cabda4] bg-[#fffaf0] px-4 py-3 text-sm font-semibold text-[#1e2419] outline-none"
            />
          </label>
          <div className="rounded-2xl border border-dashed border-[#cabda4] bg-[#fffaf0] p-4 text-sm font-semibold text-[#675f50]">
            Document verification placeholder: Document metadata received
          </div>
          <TextField
            label="Preferred live date"
            type="date"
            value={form.preferredLiveDate}
            onChange={(value) => updateForm("preferredLiveDate", value)}
          />
          <button
            type="submit"
            disabled={Boolean(pendingAction)}
            className="rounded-full bg-[#1e2419] px-5 py-3 text-sm font-bold text-[#fffaf0] transition hover:bg-[#596540] disabled:opacity-60"
          >
            {pendingAction === "Set up service live"
              ? "Saving..."
              : "Set up a live for my service"}
          </button>
        </div>
      </form>
      <ServiceRequestList requests={requests} />
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-[#596540]">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
        className="rounded-2xl border border-[#cabda4] bg-[#fffaf0] px-4 py-3 text-sm font-semibold text-[#1e2419] outline-none"
      />
    </label>
  );
}

function ServiceRequestList({
  requests,
}: {
  requests: ServiceLiveSetupRequest[];
}) {
  return (
    <section className="rounded-3xl border border-[#1e2419] bg-[#1e2419] p-4 text-[#fffaf0]">
      <PanelHeader
        eyebrow="created requests"
        title="Service dashboard requests"
        badge={`${requests.length}`}
      />
      <div className="mt-4 grid gap-3">
        {requests.length ? (
          requests.map((request) => (
            <article key={request.id} className="rounded-2xl bg-white/[.07] p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold">{request.serviceName}</p>
                  <p className="mt-1 text-sm text-[#ded8ca]">
                    {request.serviceCategory} - {request.shortDescription}
                  </p>
                </div>
                <span className="w-fit rounded-full bg-[#fffaf0]/12 px-3 py-1 text-xs font-black text-[#cbd8a7]">
                  {formatStatus(request.status)}
                </span>
              </div>
              <div className="mt-3 grid gap-2 text-xs font-semibold text-[#ded8ca]">
                <span>Preferred live date: {request.preferredLiveDate}</span>
                <span>{request.documentVerificationPlaceholder}</span>
                <span>{request.paymentPlaceholder}</span>
              </div>
            </article>
          ))
        ) : (
          <p className="rounded-2xl bg-white/[.07] p-4 text-sm text-[#ded8ca]">
            No service live setup requests yet.
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
