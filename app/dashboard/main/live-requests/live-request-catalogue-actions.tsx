"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { LiveRequestStatus } from "@/lib/backend/types";

export function LiveRequestCatalogueActions({
  requestId,
  status,
}: {
  requestId: string;
  status: LiveRequestStatus;
}) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function runAction(label: string, request: () => Promise<Response>) {
    setPendingAction(label);
    setMessage("");
    setError("");

    try {
      const response = await request();
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error?.message ?? `${label} failed.`);
      }
      setMessage(`${label} saved.`);
      router.refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : `${label} failed.`);
    } finally {
      setPendingAction("");
    }
  }

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={Boolean(pendingAction)}
          onClick={() => runAction("Approve live request", () => reviewRequest(requestId, "approved"))}
          className="rounded-full bg-[#6f7f4f] px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
        >
          Approve
        </button>
        <button
          type="button"
          disabled={Boolean(pendingAction)}
          onClick={() => runAction("Reject live request", () => reviewRequest(requestId, "rejected", "Rejected by main admin."))}
          className="rounded-full border border-[#cabda4] bg-[#fffaf0] px-3 py-2 text-xs font-bold text-[#1e2419] disabled:opacity-60"
        >
          Reject
        </button>
        <button
          type="button"
          disabled={Boolean(pendingAction)}
          onClick={() => runAction("Request more information", () => reviewRequest(requestId, "rejected", "Please provide more information before scheduling."))}
          className="rounded-full border border-[#cabda4] bg-[#fffaf0] px-3 py-2 text-xs font-bold text-[#1e2419] disabled:opacity-60"
        >
          Request more information
        </button>
        <button
          type="button"
          disabled={Boolean(pendingAction) || status !== "approved"}
          onClick={() =>
            runAction("Schedule live request", () =>
              fetch(`/api/admin/live-requests/${requestId}/schedule`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ scheduledAt: new Date(Date.now() + 86400000).toISOString() }),
              }),
            )
          }
          className="rounded-full border border-[#cabda4] bg-[#fffaf0] px-3 py-2 text-xs font-bold text-[#1e2419] disabled:opacity-60"
        >
          Schedule
        </button>
      </div>
      {status !== "approved" && (
        <p className="mt-2 text-xs font-semibold text-[#675f50]">
          Schedule unlocks after this request is approved.
        </p>
      )}
      {message && <p className="mt-2 text-xs font-bold text-[#596540]">{message}</p>}
      {error && <p className="mt-2 text-xs font-bold text-[#8c3f2b]">{error}</p>}
    </div>
  );
}

function reviewRequest(requestId: string, status: "approved" | "rejected", adminNote?: string) {
  return fetch(`/api/admin/live-requests/${requestId}/review`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, adminNote }),
  });
}
