"use client";

import Link from "next/link";
import { useState } from "react";

type Tool = {
  id: string;
  name: string;
  type: string;
  defaultPayload: Record<string, unknown>;
};

type Activation = {
  id: string;
  toolType: string;
  payload: Record<string, unknown>;
  triggerReason: string;
  status: string;
};

type Suggestion = {
  toolType: string;
  reason: string;
};

type ApiEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string } };

const signalButtons = [
  ["question", "Ask a question"],
  ["purchase_intent", "I'm interested"],
  ["concierge_request", "Request concierge"],
  ["follow", "Follow provider"],
] as const;

export function PresenterToolsPanel({
  liveId,
  tools,
  initialActive,
  suggestions,
  canManage,
  isViewer,
}: {
  liveId: string;
  tools: Tool[];
  initialActive: Activation[];
  suggestions: Suggestion[];
  canManage: boolean;
  isViewer: boolean;
}) {
  const [active, setActive] = useState(initialActive);
  const [selectedToolType, setSelectedToolType] = useState(tools[0]?.type ?? "product_card");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function sendSignal(signalType: string, extraPayload: Record<string, unknown> = {}) {
    setMessage("");
    setError("");
    const response = await fetch(`/api/lives/${liveId}/signals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        signalType,
        payload: {
          source: "live_detail_presenter_tools",
          ...extraPayload,
        },
      }),
    });
    const body = (await response.json()) as ApiEnvelope<unknown>;
    if (!body.success) {
      setError(body.error.message);
      return;
    }
    setMessage("Viewer signal saved for the presenter.");
  }

  async function triggerSelectedTool() {
    setMessage("");
    setError("");
    const tool = tools.find((item) => item.type === selectedToolType);
    const response = await fetch(`/api/lives/${liveId}/tools/trigger`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        toolType: selectedToolType,
        triggerReason: "manual",
        payload: tool?.defaultPayload ?? {},
      }),
    });
    const body = (await response.json()) as ApiEnvelope<Activation>;
    if (!body.success) {
      setError(body.error.message);
      return;
    }
    setActive((current) => [body.data, ...current]);
    setMessage("Tool activated locally for this live detail page.");
  }

  async function dismissActivation(id: string) {
    setMessage("");
    setError("");
    const response = await fetch(`/api/lives/${liveId}/tools/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "dismissed" }),
    });
    const body = (await response.json()) as ApiEnvelope<Activation>;
    if (!body.success) {
      setError(body.error.message);
      return;
    }
    setActive((current) => current.filter((item) => item.id !== id));
    setMessage("Tool dismissed.");
  }

  return (
    <section className="mt-6 rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6f7f4f]">Presenter tools</p>
          <h2 className="mt-1 text-xl font-semibold">Live overlays and viewer signals</h2>
        </div>
        <Link href="/dashboard/live-tools" className="w-fit rounded-full border border-[#cabda4] bg-[#fffaf0] px-4 py-2 text-sm font-bold text-[#1e2419]">
          Tool library
        </Link>
      </div>

      {active.length ? (
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {active.map((activation) => (
            <ToolCard
              key={activation.id}
              activation={activation}
              canManage={canManage}
              isViewer={isViewer}
              onSignal={sendSignal}
              onDismiss={() => dismissActivation(activation.id)}
            />
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-2xl bg-[#f3ecdc] p-4 text-sm font-semibold text-[#675f50]">
          No active presenter tools yet. Local activations will appear here as demo cards.
        </p>
      )}

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-[#f3ecdc] p-4">
          <h3 className="font-semibold">Viewer signals</h3>
          {isViewer ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {signalButtons.map(([signalType, label]) => (
                <button key={signalType} type="button" onClick={() => sendSignal(signalType)} className="rounded-full bg-[#1e2419] px-4 py-2 text-xs font-bold text-[#fffaf0]">
                  {label}
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-3 rounded-xl bg-[#fffaf0] p-3 text-sm font-semibold text-[#675f50]">
              <Link href="/login" className="font-bold text-[#1e2419]">Log in as a viewer</Link> to send question, interest, concierge, and follow signals.
            </div>
          )}
        </div>

        {canManage ? (
          <div className="rounded-2xl bg-[#f3ecdc] p-4">
            <h3 className="font-semibold">Trigger controls</h3>
            <div className="mt-3 grid gap-2">
              <select value={selectedToolType} onChange={(event) => setSelectedToolType(event.target.value)} className="rounded-2xl border border-[#cabda4] bg-[#fffaf0] px-4 py-3 text-sm font-semibold outline-none">
                {tools.map((tool) => <option key={tool.id} value={tool.type}>{tool.name}</option>)}
              </select>
              <button type="button" onClick={triggerSelectedTool} className="rounded-full bg-[#1e2419] px-4 py-2 text-xs font-bold text-[#fffaf0]">
                Trigger on this live
              </button>
            </div>
            {suggestions.length ? (
              <div className="mt-3 grid gap-2">
                {suggestions.map((suggestion) => (
                  <p key={`${suggestion.toolType}-${suggestion.reason}`} className="rounded-xl bg-[#fffaf0] p-3 text-xs font-semibold text-[#675f50]">
                    Suggested: {formatLabel(suggestion.toolType)} - {suggestion.reason}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {message ? <p className="mt-4 rounded-2xl bg-[#edf2dd] p-3 text-sm font-bold text-[#596540]">{message}</p> : null}
      {error ? <p className="mt-4 rounded-2xl bg-[#fff3ed] p-3 text-sm font-bold text-[#8c3f2b]">{error}</p> : null}
    </section>
  );
}

function ToolCard({
  activation,
  canManage,
  isViewer,
  onSignal,
  onDismiss,
}: {
  activation: Activation;
  canManage: boolean;
  isViewer: boolean;
  onSignal: (signalType: string, payload?: Record<string, unknown>) => void;
  onDismiss: () => void;
}) {
  const payload = activation.payload;
  return (
    <article className="rounded-2xl bg-[#f3ecdc] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[.12em] text-[#6f7f4f]">{formatLabel(activation.toolType)}</p>
          <h3 className="mt-1 text-lg font-semibold">{titleForActivation(activation)}</h3>
        </div>
        {canManage ? (
          <button type="button" onClick={onDismiss} className="rounded-full border border-[#cabda4] bg-[#fffaf0] px-3 py-1 text-xs font-bold">
            Dismiss
          </button>
        ) : null}
      </div>
      <p className="mt-2 text-sm leading-6 text-[#675f50]">{descriptionForActivation(activation)}</p>
      {activation.toolType === "trust_badge" ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {["verifiedProvider", "verifiedReplay", "verifiedLive"].map((key) => (
            payload[key] ? <span key={key} className="rounded-full bg-[#edf2dd] px-3 py-1 text-xs font-black text-[#596540]">{formatLabel(key)}</span> : null
          ))}
        </div>
      ) : null}
      {activation.toolType === "poll" && Array.isArray(payload.options) ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {payload.options.map((option) => (
            <button key={String(option)} type="button" onClick={() => onSignal("question", { pollVote: option })} className="rounded-full border border-[#cabda4] bg-[#fffaf0] px-3 py-2 text-xs font-bold">
              {String(option)}
            </button>
          ))}
        </div>
      ) : null}
      {activation.toolType === "concierge_prompt" ? (
        <Link href={String(payload.conciergeHref ?? "/services-dashboard")} className="mt-3 inline-flex rounded-full bg-[#1e2419] px-4 py-2 text-xs font-bold text-[#fffaf0]">
          {String(payload.ctaLabel ?? "Open concierge demo")}
        </Link>
      ) : null}
      {activation.toolType === "product_card" && isViewer ? (
        <button type="button" onClick={() => onSignal("purchase_intent", { productName: payload.productName })} className="mt-3 rounded-full bg-[#1e2419] px-4 py-2 text-xs font-bold text-[#fffaf0]">
          {String(payload.ctaLabel ?? "I'm interested")}
        </button>
      ) : null}
    </article>
  );
}

function titleForActivation(activation: Activation) {
  const payload = activation.payload;
  if (activation.toolType === "product_card") return String(payload.productName ?? "Featured product");
  if (activation.toolType === "limited_offer") return String(payload.offerTitle ?? "Limited-time offer");
  if (activation.toolType === "poll") return String(payload.question ?? "Live poll");
  if (activation.toolType === "question_spotlight") return String(payload.viewerQuestion ?? "Viewer question");
  if (activation.toolType === "trust_badge") return "Verified Buyamia trust signals";
  if (activation.toolType === "concierge_prompt") return String(payload.prompt ?? "Need help arranging delivery, booking or additional services?");
  if (activation.toolType === "ambassador_challenge") return String(payload.challenge ?? "Ambassador challenge");
  return formatLabel(activation.toolType);
}

function descriptionForActivation(activation: Activation) {
  const payload = activation.payload;
  if (activation.toolType === "product_card") return String(payload.shortDescription ?? "Presenter-selected product card.");
  if (activation.toolType === "limited_offer") return `${String(payload.ctaLabel ?? "View offer")} - expires ${String(payload.expiryTime ?? "soon")}`;
  if (activation.toolType === "question_spotlight") return String(payload.presenterResponse ?? "Presenter response pending.");
  if (activation.toolType === "ambassador_challenge") return String(payload.rewardPointsLabel ?? "Demo reward available.");
  return String(payload.message ?? payload.prompt ?? payload.title ?? "Active local presenter tool.");
}

function formatLabel(value: string) {
  return value.replace(/([A-Z])/g, " $1").replace(/_/g, " ").trim();
}
