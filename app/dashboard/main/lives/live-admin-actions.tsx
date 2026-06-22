"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { LiveEvent, PinReason } from "@/lib/backend/types";

const pinReasons: PinReason[] = ["sponsored", "nearby", "most_watched", "featured_by_buyamia"];

type ApiEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string } };

export function LiveAdminActions({ live }: { live: LiveEvent }) {
  const router = useRouter();
  const [reason, setReason] = useState<PinReason>(live.pinReason ?? "featured_by_buyamia");
  const [pending, setPending] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function run(label: string, request: () => Promise<Response>, success: string) {
    setPending(label);
    setMessage("");
    setError("");

    try {
      const response = await request();
      const payload = (await response.json().catch(() => null)) as ApiEnvelope<unknown> | null;
      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.success === false ? payload.error.message : `${label} failed.`);
      }
      setMessage(success);
      router.refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : `${label} failed.`);
    } finally {
      setPending("");
    }
  }

  return (
    <div className="mt-4 grid gap-2">
      {(pending || message || error) && (
        <div className="grid gap-2 text-sm font-bold">
          {pending && <p className="rounded-2xl bg-[#edf2dd] p-3 text-[#596540]">{pending}...</p>}
          {message && <p className="rounded-2xl bg-[#edf2dd] p-3 text-[#596540]">{message}</p>}
          {error && <p className="rounded-2xl bg-[#fff3ed] p-3 text-[#8c3f2b]">{error}</p>}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={Boolean(pending)}
          onClick={() =>
            run(
              "Extend replay by 5 days",
              () =>
                fetch(`/api/lives/${live.id}/replay-expiration`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ extensionDays: 5 }),
                }),
              "Replay expiration extended by 5 days.",
            )
          }
          className="rounded-full bg-[#6f7f4f] px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
        >
          {pending === "Extend replay by 5 days" ? "Extending..." : "Extend replay by 5 days"}
        </button>
        {live.isPinned ? (
          <button
            type="button"
            disabled={Boolean(pending)}
            onClick={() =>
              run(
                "Unpin live",
                () =>
                  fetch(`/api/lives/${live.id}/pin`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ isPinned: false }),
                  }),
                "Live unpinned.",
              )
            }
            className="rounded-full border border-[#cabda4] bg-[#fffaf0] px-4 py-2 text-xs font-bold text-[#1e2419] disabled:opacity-60"
          >
            {pending === "Unpin live" ? "Unpinning..." : "Unpin"}
          </button>
        ) : (
          <>
            <select
              aria-label={`Pin reason for ${live.title}`}
              value={reason}
              onChange={(event) => setReason(event.target.value as PinReason)}
              className="rounded-full border border-[#cabda4] bg-[#fffaf0] px-4 py-2 text-xs font-bold text-[#1e2419]"
            >
              {pinReasons.map((pinReason) => (
                <option key={pinReason} value={pinReason}>
                  {formatLabel(pinReason)}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={Boolean(pending)}
              onClick={() =>
                run(
                  "Pin live",
                  () =>
                    fetch(`/api/lives/${live.id}/pin`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ isPinned: true, pinReason: reason }),
                    }),
                  "Live pinned.",
                )
              }
              className="rounded-full border border-[#cabda4] bg-[#fffaf0] px-4 py-2 text-xs font-bold text-[#1e2419] disabled:opacity-60"
            >
              {pending === "Pin live" ? "Pinning..." : "Pin live"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}
