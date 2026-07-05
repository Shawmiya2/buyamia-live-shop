"use client";

import { useState } from "react";

type Props = {
  requestId: string;
  actionId?: string;
};

type ApiEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string } };

export function AdminConciergeActions({ requestId, actionId }: Props) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function patch(body: Record<string, unknown>) {
    setMessage("");
    setError("");
    const response = await fetch(`/api/concierge/requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = (await response.json()) as ApiEnvelope<unknown>;
    if (!payload.success) {
      setError(payload.error.message);
      return;
    }
    setMessage("Updated.");
    window.location.reload();
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <button type="button" onClick={() => patch({ status: "in_progress" })} className="rounded-full bg-[#1e2419] px-3 py-2 text-xs font-bold text-[#fffaf0]">
        Start
      </button>
      <button type="button" onClick={() => patch({ status: "arranged", outcomeStatus: "arranged", outcomeSummary: "Concierge arrangement marked arranged in demo mode." })} className="rounded-full bg-[#596540] px-3 py-2 text-xs font-bold text-[#fffaf0]">
        Arrange outcome
      </button>
      {actionId ? (
        <button type="button" onClick={() => patch({ actionId, actionStatus: "completed" })} className="rounded-full border border-[#cabda4] bg-white px-3 py-2 text-xs font-bold text-[#1e2419]">
          Mark next action complete
        </button>
      ) : null}
      {message ? <span className="rounded-full bg-[#edf2dd] px-3 py-2 text-xs font-bold text-[#596540]">{message}</span> : null}
      {error ? <span className="rounded-full bg-[#fff3ed] px-3 py-2 text-xs font-bold text-[#8c3f2b]">{error}</span> : null}
    </div>
  );
}
