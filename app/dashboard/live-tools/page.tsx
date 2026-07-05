import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminAccessDenied } from "@/app/admin-access-denied";
import { getCurrentUser } from "@/lib/backend/auth-context";
import { isProviderRole } from "@/lib/backend/role-guard";
import { listLives } from "@/lib/backend/live-service";
import { listAvailablePresenterTools, listRecentToolActivations } from "@/lib/backend/presenter-tool-service";
import { LiveToolsConsole } from "./live-tools-console";

export const metadata: Metadata = {
  title: "Live Presenter Tools",
  description: "Local Buyamia presenter tool library and trigger controls for live sessions.",
};

export default async function LiveToolsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (user.role !== "main_admin" && !isProviderRole(user.role)) {
    return <AdminAccessDenied user={user} />;
  }

  const [tools, liveResult] = await Promise.all([
    listAvailablePresenterTools(),
    listLives({
      providerId: user.role === "main_admin" ? undefined : user.providerId,
      pageSize: "25",
      sort: "scheduled_desc",
    }),
  ]);
  const firstLiveId = liveResult.items[0]?.id;
  const activations = firstLiveId ? await listRecentToolActivations(firstLiveId) : [];

  return (
    <main className="min-h-dvh bg-[#f3ecdc] text-[#1e2419]">
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6f7f4f]">Live Presenter Tools</p>
              <h1 className="mt-1 font-serif text-4xl leading-tight">Delight tools for live moments</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#675f50]">
                Persistent local tools presenters can trigger for demo overlays, cards, polls, trust prompts, and concierge handoffs.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-[#edf2dd] px-3 py-1 text-xs font-black text-[#596540]">
                {user.role === "main_admin" ? "Main admin" : "Provider owner"}
              </span>
              <Link href={user.dashboardUrl} className="rounded-full border border-[#cabda4] bg-[#fffaf0] px-4 py-2 text-sm font-bold text-[#1e2419]">
                Back to dashboard
              </Link>
            </div>
          </div>
        </div>

        <LiveToolsConsole
          tools={tools.map((tool) => ({
            id: tool.id,
            name: tool.name,
            type: tool.type,
            description: tool.description,
            defaultPayload: asRecord(tool.defaultPayload),
          }))}
          lives={liveResult.items.map((live) => ({
            id: live.id,
            title: live.title,
            providerName: live.providerName,
            status: live.status,
          }))}
          initialLiveId={firstLiveId}
          initialActivations={activations.map((activation) => ({
            id: activation.id,
            toolType: activation.toolType,
            payload: asRecord(activation.payload),
            triggerReason: activation.triggerReason,
            status: activation.status,
            createdAt: activation.createdAt.toISOString(),
          }))}
        />
      </section>
    </main>
  );
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
