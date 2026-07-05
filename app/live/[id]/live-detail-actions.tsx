"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Props = {
  liveId: string;
  providerId: string;
  title: string;
  category: string;
};

type ApiEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string } };

export function LiveDetailActions({ liveId, providerId, title, category }: Props) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConciergeForm, setShowConciergeForm] = useState(false);
  const liveUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return `/live/${liveId}`;
    }
    return `${window.location.origin}/live/${liveId}`;
  }, [liveId]);

  async function copyLink() {
    setMessage("");
    setError("");
    try {
      await navigator.clipboard.writeText(liveUrl);
      await fetch("/api/ambassadors/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ liveId, providerId, channel: "copy_link" }),
      }).catch(() => null);
      setMessage("Live link copied.");
    } catch {
      setError("Copy failed. Select and copy the page URL from your browser.");
    }
  }

  async function followProvider() {
    setMessage("");
    setError("");
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/follows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId }),
      });
      const payload = (await response.json()) as ApiEnvelope<unknown>;
      if (!payload.success) {
        throw new Error(payload.error.message);
      }
      setIsFollowing(true);
      setMessage("Provider followed.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to follow this provider.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function askConcierge(formData: FormData) {
    setMessage("");
    setError("");
    setIsSubmitting(true);
    try {
      const line1 = String(formData.get("line1") ?? "").trim();
      const city = String(formData.get("city") ?? "").trim();
      const country = String(formData.get("country") ?? "").trim();
      const response = await fetch("/api/buyer-intents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          liveId,
          providerId,
          productOrServiceName: title,
          category,
          intentType: "request_concierge",
          urgency: formData.get("urgency"),
          notes: formData.get("notes") || "Created from live detail concierge CTA.",
          address: line1 && city && country
            ? {
                label: "Live concierge address",
                line1,
                city,
                country,
                isDefault: true,
              }
            : undefined,
        }),
      });
      const payload = (await response.json()) as ApiEnvelope<unknown>;
      if (!payload.success) {
        throw new Error(payload.error.message);
      }
      setMessage("Buyamia Concierge captured this live request.");
      setShowConciergeForm(false);
    } catch (requestError) {
      setError(
        requestError instanceof Error && /Authentication/i.test(requestError.message)
          ? "Please login or sign up before asking Buyamia Concierge."
          : requestError instanceof Error
            ? requestError.message
            : "Unable to create concierge request.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(liveUrl)}`;

  return (
    <div className="mt-6 rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={followProvider}
          disabled={isSubmitting || isFollowing}
          className="rounded-full bg-[#1e2419] px-5 py-3 text-sm font-bold text-[#fffaf0] disabled:cursor-not-allowed disabled:opacity-60"
          title={isFollowing ? "You already follow this provider." : undefined}
        >
          {isSubmitting ? "Following..." : isFollowing ? "Following" : "Follow provider"}
        </button>
        <button
          type="button"
          onClick={copyLink}
          className="rounded-full border border-[#cabda4] bg-[#f3ecdc] px-5 py-3 text-sm font-bold text-[#1e2419]"
        >
          Copy live link
        </button>
        <button
          type="button"
          onClick={() => setShowConciergeForm((value) => !value)}
          className="rounded-full bg-[#596540] px-5 py-3 text-sm font-bold text-[#fffaf0]"
        >
          Ask concierge
        </button>
        <button
          type="button"
          onClick={() => setShowConciergeForm(true)}
          className="rounded-full border border-[#cabda4] bg-white px-5 py-3 text-sm font-bold text-[#1e2419]"
        >
          I'm interested
        </button>
        <button
          type="button"
          onClick={() => setShowConciergeForm(true)}
          className="rounded-full border border-[#cabda4] bg-white px-5 py-3 text-sm font-bold text-[#1e2419]"
        >
          Arrange this for me
        </button>
        <a
          href={shareUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-[#cabda4] bg-white px-5 py-3 text-sm font-bold text-[#1e2419]"
        >
          Share
        </a>
        <Link
          href="/login"
          className="rounded-full border border-[#cabda4] bg-white px-5 py-3 text-sm font-bold text-[#1e2419]"
        >
          Login or sign up
        </Link>
      </div>
      {message && <p className="mt-4 rounded-2xl bg-[#edf2dd] p-3 text-sm font-bold text-[#596540]">{message}</p>}
      {error && <p className="mt-4 rounded-2xl bg-[#fff3ed] p-3 text-sm font-bold text-[#8c3f2b]">{error}</p>}
      {showConciergeForm ? (
        <form action={askConcierge} className="mt-5 grid gap-3 rounded-2xl bg-[#f3ecdc] p-4">
          <div className="grid gap-3 md:grid-cols-3">
            <label className="text-sm font-bold text-[#596540]">
              Urgency
              <select name="urgency" className="mt-2 w-full rounded-2xl border border-[#d6cbb6] bg-white px-4 py-3 text-[#1e2419]">
                <option value="today">Today</option>
                <option value="this_week">This week</option>
                <option value="flexible">Flexible</option>
              </select>
            </label>
            <label className="text-sm font-bold text-[#596540]">
              Address line 1
              <input name="line1" className="mt-2 w-full rounded-2xl border border-[#d6cbb6] bg-white px-4 py-3 text-[#1e2419]" />
            </label>
            <label className="text-sm font-bold text-[#596540]">
              City
              <input name="city" className="mt-2 w-full rounded-2xl border border-[#d6cbb6] bg-white px-4 py-3 text-[#1e2419]" />
            </label>
            <label className="text-sm font-bold text-[#596540]">
              Country
              <input name="country" defaultValue="Indonesia" className="mt-2 w-full rounded-2xl border border-[#d6cbb6] bg-white px-4 py-3 text-[#1e2419]" />
            </label>
            <label className="text-sm font-bold text-[#596540] md:col-span-2">
              Notes
              <input name="notes" placeholder="What should Buyamia arrange?" className="mt-2 w-full rounded-2xl border border-[#d6cbb6] bg-white px-4 py-3 text-[#1e2419]" />
            </label>
          </div>
          <button disabled={isSubmitting} className="w-fit rounded-full bg-[#1e2419] px-5 py-3 text-sm font-bold text-[#fffaf0] disabled:opacity-60">
            Ask Buyamia Concierge
          </button>
          <p className="text-xs leading-5 text-[#675f50]">
            Address fields are captured before final submission when you want Buyamia to arrange delivery or service handoff. No payment, shipping, insurance, or third-party booking is created.
          </p>
        </form>
      ) : null}
      <div className="mt-5 rounded-2xl bg-[#f3ecdc] p-4">
        <p className="text-sm font-semibold text-[#1e2419]">Trusted community action</p>
        <p className="mt-2 text-sm leading-6 text-[#675f50]">
          Share this live, become an ambassador, and earn demo rewards for qualified referrals. No real payout is connected in this prototype.
        </p>
        <Link href="/dashboard/viewer/ambassador" className="mt-3 inline-flex rounded-full bg-[#596540] px-4 py-2 text-xs font-bold text-[#fffaf0]">
          Become ambassador
        </Link>
      </div>
    </div>
  );
}
