import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/backend/auth-context";
import { getConciergeAdminSummary, listConciergeRequestsForUser } from "@/lib/backend/concierge-service";
import { AdminConciergeActions } from "./admin-concierge-actions";

export const metadata = {
  title: "Main Concierge",
  description: "Main admin Buyamia Concierge workbench for last-mile buyer intent outcomes.",
};

export default async function MainConciergePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "main_admin") redirect(user.dashboardUrl);

  const [summary, requests] = await Promise.all([
    getConciergeAdminSummary(),
    listConciergeRequestsForUser(user),
  ]);

  return (
    <main className="min-h-dvh bg-[#f3ecdc] px-4 py-6 text-[#1e2419] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-3 border-b border-[#d6cbb6] pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/dashboard/main" className="text-sm font-bold text-[#596540]">Main dashboard</Link>
            <h1 className="mt-2 font-serif text-4xl">Concierge workbench</h1>
          </div>
          <Link href="/dashboard/main/roadmap" className="rounded-full bg-[#1e2419] px-4 py-2 text-sm font-bold text-[#fffaf0]">Roadmap</Link>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-4">
          <Metric label="Open requests" value={summary.openRequests} />
          <Metric label="Waiting for buyer" value={summary.waitingForBuyer} />
          <Metric label="Waiting for provider" value={summary.waitingForProvider} />
          <Metric label="Arranged outcomes" value={summary.arrangedOutcomes} />
        </section>

        <section className="mt-6 rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">All concierge requests</h2>
            <span className="rounded-full bg-[#f3ecdc] px-3 py-1 text-xs font-bold text-[#596540]">{requests.length}</span>
          </div>
          <div className="grid gap-4">
            {requests.map((request) => {
              const nextAction = request.actions.find((action) => action.status === "pending");
              return (
                <article key={request.id} className="rounded-2xl bg-[#f3ecdc] p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6f7f4f]">{request.status.replace(/_/g, " ")}</p>
                      <h3 className="mt-1 text-lg font-semibold">{request.buyerIntent.productOrServiceName}</h3>
                      <p className="mt-2 text-sm leading-6 text-[#675f50]">
                        {request.buyerIntent.intentType.replace(/_/g, " ")} for {request.buyerIntent.providerName ?? "unassigned provider"}.
                      </p>
                      {request.buyerIntent.address ? (
                        <p className="mt-2 text-sm font-semibold text-[#1e2419]">
                          Authorized address: {request.buyerIntent.address.line1}, {request.buyerIntent.address.city}, {request.buyerIntent.address.country}
                        </p>
                      ) : (
                        <p className="mt-2 text-sm font-semibold text-[#8c3f2b]">Address missing or not required.</p>
                      )}
                    </div>
                    <div className="rounded-2xl bg-[#fffaf0] p-3 text-sm">
                      <p className="font-bold text-[#596540]">Next action</p>
                      <p className="mt-1 text-[#675f50]">{nextAction ? `${nextAction.actionType.replace(/_/g, " ")}: ${nextAction.note}` : "No pending actions."}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[#675f50]">{request.conciergeNote}</p>
                  <AdminConciergeActions requestId={request.id} actionId={nextAction?.id} />
                </article>
              );
            })}
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
