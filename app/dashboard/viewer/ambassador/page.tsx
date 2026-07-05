import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/backend/auth-context";
import { getDashboardForRole } from "@/lib/backend/role-guard";
import { getAmbassadorForUser } from "@/lib/backend/ambassador-service";
import { AmbassadorActions } from "./ambassador-actions";

export const metadata: Metadata = {
  title: "Ambassador Rewards",
  description: "Viewer ambassador rewards, referrals, shares, and demo credit history.",
};

export default async function ViewerAmbassadorPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (user.role !== "viewer") {
    redirect(getDashboardForRole(user.role));
  }

  const ambassador = await getAmbassadorForUser(user.id);

  return (
    <main className="min-h-screen bg-[#f3ecdc] pb-10 text-[#1e2419]">
      <section className="mx-auto max-w-6xl px-4 pt-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 rounded-2xl border border-[#d6cbb6] bg-[#fffaf0] p-4 text-sm font-semibold text-[#675f50] sm:flex-row sm:items-center sm:justify-between">
          <span>{user.name} - viewer</span>
          <Link href="/dashboard/viewer" className="w-fit rounded-full bg-[#1e2419] px-4 py-2 text-xs font-bold text-[#fffaf0]">
            Back to viewer dashboard
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-[#1e2419] bg-[#1e2419] p-6 text-[#fffaf0] shadow-xl shadow-[#8a7d61]/12">
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#cbd8a7]">Trusted community layer</p>
          <h1 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl">Ambassador rewards</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[#ded8ca]">
            Spectators can become trusted community ambassadors by sharing lives, inviting friends, following providers, and bringing qualified engagement. Rewards are demo credits and perks only in this prototype.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Badge label="No real payout connected" />
            <Badge label="Order-value points can be integrated later" />
          </div>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
          <section className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6f7f4f]">Status</p>
            <h2 className="mt-1 text-2xl font-semibold">{ambassador ? formatStatus(ambassador.status) : "Not started"}</h2>
            <dl className="mt-5 grid gap-3">
              <Metric label="Referral code" value={ambassador?.referralCode ?? "Join to generate"} />
              <Metric label="Referral link" value={ambassador?.referralLink ?? "Join to activate"} />
              <Metric label="Total points" value={String(ambassador?.totalPoints ?? 0)} />
              <Metric label="Tier" value={formatStatus(ambassador?.tier ?? "starter")} />
            </dl>
          </section>
          <AmbassadorActions referralLink={ambassador?.referralLink} />
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <section className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6f7f4f]">Reward history</p>
            <h2 className="mt-1 text-2xl font-semibold">Demo credit ledger</h2>
            <div className="mt-4 grid gap-3">
              {(ambassador?.rewards ?? []).length ? ambassador?.rewards.map((reward) => (
                <div key={reward.id} className="rounded-2xl bg-[#f3ecdc] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold">{formatStatus(reward.reason)}</p>
                    <span className="rounded-full bg-[#1e2419] px-3 py-1 text-xs font-black text-[#fffaf0]">
                      {reward.points} pts
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#675f50]">{reward.note}</p>
                </div>
              )) : <EmptyState text="No reward entries yet. Share a live or invite a friend to create demo credits." />}
            </div>
          </section>

          <section className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6f7f4f]">Referrals</p>
            <h2 className="mt-1 text-2xl font-semibold">Invited friend status</h2>
            <div className="mt-4 grid gap-3">
              {(ambassador?.referrals ?? []).length ? ambassador?.referrals.map((referral) => (
                <div key={referral.id} className="rounded-2xl bg-[#f3ecdc] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold">{referral.referredEmail ?? referral.referredUserId ?? "Community referral"}</p>
                    <span className="rounded-full bg-[#edf2dd] px-3 py-1 text-xs font-black text-[#596540]">
                      {formatStatus(referral.status)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#675f50]">Source: {formatStatus(referral.source)}</p>
                </div>
              )) : <EmptyState text="No referrals recorded yet." />}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function Badge({ label }: { label: string }) {
  return <span className="rounded-full bg-[#fffaf0]/12 px-4 py-2 text-xs font-bold text-[#cbd8a7]">{label}</span>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#f3ecdc] p-4">
      <dt className="text-xs font-bold uppercase tracking-[.14em] text-[#6f7f4f]">{label}</dt>
      <dd className="mt-2 break-words text-lg font-semibold">{value}</dd>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="rounded-2xl bg-[#f3ecdc] p-4 text-sm font-semibold text-[#675f50]">{text}</p>;
}

function formatStatus(value: string) {
  return value.replace(/_/g, " ");
}
