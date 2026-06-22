"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Props = {
  liveId: string;
  providerId: string;
  title: string;
};

type ApiEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string } };

export function LiveDetailActions({ liveId, providerId, title }: Props) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    </div>
  );
}
