"use client";

import { useMemo, useState } from "react";

type ApiEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string } };

type Props = {
  referralLink?: string;
};

export function AmbassadorActions({ referralLink }: Props) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState("");
  const absoluteReferralLink = useMemo(() => {
    if (!referralLink) return "";
    if (typeof window === "undefined") return referralLink;
    return `${window.location.origin}${referralLink}`;
  }, [referralLink]);

  async function runAction(label: string, action: () => Promise<Response>, success: string) {
    setPending(label);
    setMessage("");
    setError("");
    try {
      const response = await action();
      const payload = (await response.json()) as ApiEnvelope<unknown>;
      if (!payload.success) {
        throw new Error(payload.error.message);
      }
      setMessage(success);
      if (label !== "Copy referral link") {
        window.location.reload();
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : `${label} failed.`);
    } finally {
      setPending("");
    }
  }

  async function copyReferralLink() {
    await runAction(
      "Copy referral link",
      async () => {
        if (!absoluteReferralLink) {
          throw new Error("Join the ambassador program before copying a referral link.");
        }
        await navigator.clipboard.writeText(absoluteReferralLink);
        return new Response(JSON.stringify({ success: true, data: {} }));
      },
      "Referral link copied.",
    );
  }

  return (
    <section className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6f7f4f]">Ambassador actions</p>
      <h2 className="mt-1 text-2xl font-semibold">Share, invite, and earn demo credits</h2>
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => runAction("Join", () => fetch("/api/ambassadors/join", { method: "POST" }), "Ambassador profile activated.")}
          className="rounded-full bg-[#1e2419] px-5 py-3 text-sm font-bold text-[#fffaf0]"
        >
          {pending === "Join" ? "Joining..." : "Join ambassador program"}
        </button>
        <button
          type="button"
          onClick={copyReferralLink}
          className="rounded-full border border-[#cabda4] bg-[#f3ecdc] px-5 py-3 text-sm font-bold text-[#1e2419]"
        >
          Copy referral link
        </button>
        <button
          type="button"
          onClick={() => runAction(
            "Record community share",
            () => fetch("/api/ambassadors/share", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ channel: "copy_link" }),
            }),
            "Community share recorded.",
          )}
          className="rounded-full border border-[#cabda4] bg-white px-5 py-3 text-sm font-bold text-[#1e2419]"
        >
          Share live
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="friend@example.com"
          className="rounded-2xl border border-[#cabda4] bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-[#596540]"
        />
        <button
          type="button"
          onClick={() => runAction(
            "Invite friend",
            () => fetch("/api/ambassadors/referrals", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ referredEmail: email, source: "direct_invite" }),
            }),
            "Referral invitation recorded.",
          )}
          className="rounded-full bg-[#596540] px-5 py-3 text-sm font-bold text-[#fffaf0]"
        >
          Invite a friend
        </button>
      </div>

      {message && <p className="mt-4 rounded-2xl bg-[#edf2dd] p-3 text-sm font-bold text-[#596540]">{message}</p>}
      {error && <p className="mt-4 rounded-2xl bg-[#fff3ed] p-3 text-sm font-bold text-[#8c3f2b]">{error}</p>}
    </section>
  );
}
