import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/backend/auth-context";
import { listBuyerIntentsForUser } from "@/lib/backend/buyer-intent-service";
import { listConciergeRequestsForUser } from "@/lib/backend/concierge-service";
import type { ProfileType } from "@/lib/backend/types";

export async function ProviderConciergePage({ role, dashboardHref, title }: { role: Exclude<ProfileType, "main_admin" | "viewer">; dashboardHref: string; title: string }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== role && user.role !== "main_admin") redirect(user.dashboardUrl);

  const [intents, requests] = await Promise.all([
    listBuyerIntentsForUser(user),
    listConciergeRequestsForUser(user),
  ]);

  return (
    <main className="min-h-dvh bg-[#f3ecdc] px-4 py-6 text-[#1e2419] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-3 border-b border-[#d6cbb6] pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href={dashboardHref} className="text-sm font-bold text-[#596540]">{title}</Link>
            <h1 className="mt-2 font-serif text-4xl">Buyer intent concierge</h1>
          </div>
          <Link href="/live" className="rounded-full bg-[#1e2419] px-4 py-2 text-sm font-bold text-[#fffaf0]">Live catalogue</Link>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <Metric label="Interested buyers" value={intents.length} />
          <Metric label="Concierge requests" value={requests.length} />
          <Metric label="Waiting on provider" value={requests.filter((request) => request.status === "waiting_for_provider").length} />
        </section>

        <section className="mt-6 rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
          <h2 className="text-xl font-semibold">Interested buyers</h2>
          <div className="mt-4 grid gap-3">
            {intents.length ? intents.map((intent) => {
              const request = requests.find((item) => item.buyerIntentId === intent.id);
              const nextAction = request?.actions.find((action) => action.status === "pending");
              return (
                <article key={intent.id} className="rounded-2xl bg-[#f3ecdc] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold">{intent.productOrServiceName}</p>
                      <p className="mt-1 text-sm leading-6 text-[#675f50]">
                        {intent.intentType.replace(/_/g, " ")} - {intent.liveTitle ?? "No live linked"}
                      </p>
                    </div>
                    <span className="w-fit rounded-full bg-[#edf2dd] px-3 py-1 text-xs font-black text-[#596540]">{intent.status.replace(/_/g, " ")}</span>
                  </div>
                  <p className="mt-3 text-sm text-[#675f50]">
                    Next action: {nextAction ? `${nextAction.actionType.replace(/_/g, " ")} - ${nextAction.note}` : "No pending concierge action."}
                  </p>
                </article>
              );
            }) : <p className="text-sm text-[#675f50]">No linked buyer intents yet.</p>}
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6f7f4f]">{label}</p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
    </article>
  );
}
