import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/backend/auth-context";
import { getBuyerProfileForUser, listBuyerIntentsForUser } from "@/lib/backend/buyer-intent-service";
import { listConciergeRequestsForUser } from "@/lib/backend/concierge-service";
import { ViewerConciergeConsole } from "./concierge-console";

export const metadata = {
  title: "Viewer Concierge",
  description: "Viewer Buyamia Concierge requests, addresses, buyer intents, and last-mile outcomes.",
};

export default async function ViewerConciergePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "viewer") redirect(user.dashboardUrl);

  const [{ profile, addresses }, intents, requests] = await Promise.all([
    getBuyerProfileForUser(user),
    listBuyerIntentsForUser(user),
    listConciergeRequestsForUser(user),
  ]);

  const outcomes = intents.flatMap((intent) => intent.outcomes);

  return (
    <main className="min-h-dvh bg-[#f3ecdc] px-4 py-6 text-[#1e2419] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-3 border-b border-[#d6cbb6] pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/dashboard/viewer" className="text-sm font-bold text-[#596540]">Viewer dashboard</Link>
            <h1 className="mt-2 font-serif text-4xl">Buyamia Concierge</h1>
          </div>
          <Link href="/live" className="rounded-full bg-[#1e2419] px-4 py-2 text-sm font-bold text-[#fffaf0]">Explore lives</Link>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <InfoCard title="Buyer profile" value={profile.displayName} detail={`Contact: ${profile.preferredContactMethod}`} />
          <InfoCard title="Saved addresses" value={String(addresses.length)} detail={addresses[0] ? `${addresses[0].city}, ${addresses[0].country}` : "No address saved yet"} />
          <InfoCard title="Outcomes" value={String(outcomes.length)} detail={`${outcomes.filter((outcome) => outcome.status === "arranged").length} arranged`} />
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
          <ViewerConciergeConsole addresses={addresses} />
          <div className="grid gap-5">
            <Panel title="Buyer intents" items={intents.map((intent) => ({
              title: intent.productOrServiceName,
              status: intent.status,
              detail: `${intent.intentType.replace(/_/g, " ")} - ${intent.urgency} - ${intent.providerName ?? "No provider linked"}`,
            }))} />
            <Panel title="Concierge requests" items={requests.map((request) => ({
              title: request.assignedAgentName,
              status: request.status,
              detail: request.buyerIntent.productOrServiceName,
            }))} />
            <Panel title="Status timeline" items={intents.flatMap((intent) => [
              { title: `${intent.productOrServiceName} captured`, status: intent.status, detail: intent.createdAt },
              ...intent.conciergeRequests.flatMap((request) => request.actions.map((action) => ({
                title: action.actionType.replace(/_/g, " "),
                status: action.status,
                detail: action.note,
              }))),
            ])} />
          </div>
        </section>
      </div>
    </main>
  );
}

function InfoCard({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <article className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6f7f4f]">{title}</p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
      <p className="mt-2 text-sm text-[#675f50]">{detail}</p>
    </article>
  );
}

function Panel({ title, items }: { title: string; items: { title: string; status: string; detail: string }[] }) {
  return (
    <section className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">{title}</h2>
        <span className="rounded-full bg-[#f3ecdc] px-3 py-1 text-xs font-bold text-[#596540]">{items.length}</span>
      </div>
      <div className="grid gap-3">
        {items.length ? items.map((item, index) => (
          <article key={`${item.title}-${index}`} className="rounded-2xl bg-[#f3ecdc] p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="font-semibold">{item.title}</p>
              <span className="rounded-full bg-[#edf2dd] px-3 py-1 text-xs font-black text-[#596540]">{item.status.replace(/_/g, " ")}</span>
            </div>
            <p className="mt-2 text-sm leading-6 text-[#675f50]">{item.detail}</p>
          </article>
        )) : <p className="text-sm text-[#675f50]">No records yet.</p>}
      </div>
    </section>
  );
}
