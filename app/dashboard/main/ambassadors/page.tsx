import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/backend/auth-context";
import { getDashboardForRole } from "@/lib/backend/role-guard";
import { getAdminAmbassadorOverview } from "@/lib/backend/ambassador-service";

export const metadata: Metadata = {
  title: "Ambassadors",
  description: "Main admin ambassador profiles, points, tiers, referrals, and reward ledger.",
};

export default async function MainAmbassadorsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (user.role !== "main_admin") {
    redirect(getDashboardForRole(user.role));
  }

  const { search } = await searchParams;
  const overview = await getAdminAmbassadorOverview({ search });

  return (
    <main className="min-h-screen bg-[#f3ecdc] pb-10 text-[#1e2419]">
      <section className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 rounded-2xl border border-[#d6cbb6] bg-[#fffaf0] p-4 text-sm font-semibold text-[#675f50] sm:flex-row sm:items-center sm:justify-between">
          <span>{user.name} - main admin</span>
          <Link href="/dashboard/main" className="w-fit rounded-full bg-[#1e2419] px-4 py-2 text-xs font-bold text-[#fffaf0]">
            Back to main dashboard
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-[#1e2419] bg-[#1e2419] p-6 text-[#fffaf0] shadow-xl shadow-[#8a7d61]/12">
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#cbd8a7]">Main admin only</p>
          <h1 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl">Ambassadors</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[#ded8ca]">
            Review trusted community ambassadors, demo credit points, referral status, and reward ledger activity. No real payouts are connected.
          </p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Metric label="Total ambassadors" value={overview.totalAmbassadors} />
          <Metric label="Total reward points" value={overview.totalRewardPoints} />
          <Metric label="Recent referrals" value={overview.recentReferrals.length} />
        </div>

        <form className="mt-5 rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
          <label className="text-sm font-bold text-[#596540]" htmlFor="search">Search ambassadors</label>
          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              id="search"
              name="search"
              defaultValue={search ?? ""}
              placeholder="Name, email, or referral code"
              className="rounded-2xl border border-[#cabda4] bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-[#596540]"
            />
            <button className="rounded-full bg-[#1e2419] px-5 py-3 text-sm font-bold text-[#fffaf0]">
              Filter
            </button>
          </div>
        </form>

        <section className="mt-5 grid gap-5">
          {overview.profiles.length ? overview.profiles.map((profile) => (
            <article key={profile.id} className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6f7f4f]">{profile.referralCode}</p>
                  <h2 className="mt-1 text-2xl font-semibold">{profile.user.name}</h2>
                  <p className="mt-1 text-sm font-semibold text-[#675f50]">{profile.user.email}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge label={`${profile.totalPoints} pts`} dark />
                  <Badge label={formatStatus(profile.tier)} />
                  <Badge label={formatStatus(profile.status)} />
                </div>
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-2">
                <div>
                  <h3 className="text-sm font-bold text-[#596540]">Referrals ({profile._count.referrals})</h3>
                  <div className="mt-3 grid gap-2">
                    {profile.referrals.length ? profile.referrals.map((referral) => (
                      <Row key={referral.id} title={referral.referredEmail ?? referral.referredUserId ?? "Community referral"} detail={`${formatStatus(referral.source)} - ${formatStatus(referral.status)}`} />
                    )) : <Empty text="No referrals." />}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#596540]">Reward ledger ({profile._count.rewards})</h3>
                  <div className="mt-3 grid gap-2">
                    {profile.rewards.length ? profile.rewards.map((reward) => (
                      <Row key={reward.id} title={`${reward.points} pts - ${formatStatus(reward.reason)}`} detail={reward.note} />
                    )) : <Empty text="No reward entries." />}
                  </div>
                </div>
              </div>
            </article>
          )) : <Empty text="No ambassadors found." />}
        </section>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[.14em] text-[#6f7f4f]">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}

function Badge({ label, dark }: { label: string; dark?: boolean }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-black ${dark ? "bg-[#1e2419] text-[#fffaf0]" : "bg-[#edf2dd] text-[#596540]"}`}>
      {label}
    </span>
  );
}

function Row({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-2xl bg-[#f3ecdc] p-3">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm leading-6 text-[#675f50]">{detail}</p>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-2xl bg-[#f3ecdc] p-4 text-sm font-semibold text-[#675f50]">{text}</p>;
}

function formatStatus(value: string) {
  return value.replace(/_/g, " ");
}
