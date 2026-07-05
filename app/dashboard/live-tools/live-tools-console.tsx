"use client";

import { useMemo, useState } from "react";

type Tool = {
  id: string;
  name: string;
  type: string;
  description: string;
  defaultPayload: Record<string, unknown>;
};

type LiveOption = {
  id: string;
  title: string;
  providerName: string;
  status: string;
};

type Activation = {
  id: string;
  toolType: string;
  payload: Record<string, unknown>;
  triggerReason: string;
  status: string;
  createdAt: string;
};

type ApiEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string } };

const triggerReasons = [
  ["manual", "Manual"],
  ["viewer_question", "Viewer question"],
  ["purchase_intent", "Purchase intent"],
  ["follow", "Follow"],
  ["high_engagement", "High engagement"],
  ["checkout_interest", "Checkout interest"],
] as const;

export function LiveToolsConsole({
  tools,
  lives,
  initialLiveId,
  initialActivations,
}: {
  tools: Tool[];
  lives: LiveOption[];
  initialLiveId?: string;
  initialActivations: Activation[];
}) {
  const [selectedLiveId, setSelectedLiveId] = useState(initialLiveId ?? lives[0]?.id ?? "");
  const [selectedToolType, setSelectedToolType] = useState(tools[0]?.type ?? "");
  const [triggerReason, setTriggerReason] = useState("manual");
  const selectedTool = tools.find((tool) => tool.type === selectedToolType) ?? tools[0];
  const [payloadText, setPayloadText] = useState(() => JSON.stringify(selectedTool?.defaultPayload ?? {}, null, 2));
  const [previewTool, setPreviewTool] = useState<Tool | null>(tools[0] ?? null);
  const [activations, setActivations] = useState(initialActivations);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const selectedLive = useMemo(() => lives.find((live) => live.id === selectedLiveId), [lives, selectedLiveId]);

  function chooseTool(type: string) {
    const next = tools.find((tool) => tool.type === type);
    setSelectedToolType(type);
    setPayloadText(JSON.stringify(next?.defaultPayload ?? {}, null, 2));
    setPreviewTool(next ?? null);
  }

  async function triggerTool() {
    setMessage("");
    setError("");
    if (!selectedLiveId) {
      setError("Choose a live before triggering a presenter tool.");
      return;
    }

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(payloadText) as Record<string, unknown>;
    } catch {
      setError("Payload must be valid JSON.");
      return;
    }

    const response = await fetch(`/api/lives/${selectedLiveId}/tools/trigger`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toolType: selectedToolType, triggerReason, payload }),
    });
    const body = (await response.json()) as ApiEnvelope<Activation>;
    if (!body.success) {
      setError(body.error.message);
      return;
    }

    setActivations((current) => [body.data, ...current].slice(0, 12));
    setMessage("Presenter tool activated for the selected live.");
  }

  async function updateActivation(id: string, status: "dismissed" | "expired") {
    if (!selectedLiveId) return;
    setMessage("");
    setError("");
    const response = await fetch(`/api/lives/${selectedLiveId}/tools/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const body = (await response.json()) as ApiEnvelope<Activation>;
    if (!body.success) {
      setError(body.error.message);
      return;
    }
    setActivations((current) => current.map((item) => (item.id === id ? body.data : item)));
    setMessage(`Activation marked ${status}.`);
  }

  return (
    <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
      <section className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6f7f4f]">Tool library</p>
            <h2 className="mt-1 text-xl font-semibold">{tools.length} presenter tools</h2>
          </div>
          <span className="rounded-full bg-[#edf2dd] px-3 py-1 text-xs font-black text-[#596540]">Server-authorized triggers</span>
        </div>
        <div className="mt-4 grid gap-3">
          {tools.map((tool) => (
            <article key={tool.id} className="rounded-2xl bg-[#f3ecdc] p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{tool.name}</h3>
                  <p className="mt-1 text-sm font-bold text-[#596540]">{formatLabel(tool.type)}</p>
                  <p className="mt-2 text-sm leading-6 text-[#675f50]">{tool.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewTool(tool);
                    chooseTool(tool.type);
                  }}
                  className="w-fit rounded-full border border-[#cabda4] bg-[#fffaf0] px-4 py-2 text-xs font-bold text-[#1e2419]"
                >
                  Preview
                </button>
              </div>
              <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                <Detail label="Suggested use" value={String(tool.defaultPayload.suggestedUseCase ?? "Presenter discretion")} />
                <Detail label="Role restrictions" value="main_admin or owning provider can trigger" />
              </dl>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6f7f4f]">Presenter controls</p>
        <h2 className="mt-1 text-xl font-semibold">Trigger a local demo tool</h2>
        <div className="mt-4 grid gap-3">
          <label className="grid gap-2 text-sm font-bold text-[#596540]">
            Live
            <select value={selectedLiveId} onChange={(event) => setSelectedLiveId(event.target.value)} className={inputClass()}>
              {lives.map((live) => (
                <option key={live.id} value={live.id}>
                  {live.title} - {live.providerName} ({live.status})
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold text-[#596540]">
            Tool
            <select value={selectedToolType} onChange={(event) => chooseTool(event.target.value)} className={inputClass()}>
              {tools.map((tool) => (
                <option key={tool.id} value={tool.type}>{tool.name}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold text-[#596540]">
            Trigger reason
            <select value={triggerReason} onChange={(event) => setTriggerReason(event.target.value)} className={inputClass()}>
              {triggerReasons.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold text-[#596540]">
            Payload JSON
            <textarea value={payloadText} onChange={(event) => setPayloadText(event.target.value)} rows={9} className={`${inputClass()} font-mono text-xs`} />
          </label>
          <button type="button" onClick={triggerTool} className="rounded-full bg-[#1e2419] px-5 py-3 text-sm font-bold text-[#fffaf0]">
            Trigger tool
          </button>
          {selectedLive ? (
            <p className="rounded-2xl bg-[#edf2dd] p-3 text-sm font-semibold text-[#596540]">
              Selected live: {selectedLive.title}
            </p>
          ) : null}
          {message ? <p className="rounded-2xl bg-[#edf2dd] p-3 text-sm font-bold text-[#596540]">{message}</p> : null}
          {error ? <p className="rounded-2xl bg-[#fff3ed] p-3 text-sm font-bold text-[#8c3f2b]">{error}</p> : null}
        </div>

        {previewTool ? (
          <div className="mt-5 rounded-2xl bg-[#1e2419] p-4 text-[#fffaf0]">
            <p className="text-xs font-black uppercase tracking-[.14em] text-[#cbd8a7]">Preview</p>
            <h3 className="mt-2 text-lg font-semibold">{previewTool.name}</h3>
            <p className="mt-2 text-sm leading-6 text-[#ded8ca]">{previewTool.description}</p>
            <pre className="mt-3 overflow-auto rounded-2xl bg-[#151a12] p-3 text-xs text-[#fffaf0]">
              {JSON.stringify(previewTool.defaultPayload, null, 2)}
            </pre>
          </div>
        ) : null}

        <div className="mt-5 border-t border-[#d6cbb6] pt-4">
          <h3 className="text-base font-semibold">Recent activations</h3>
          <div className="mt-3 grid gap-2">
            {activations.length ? activations.map((activation) => (
              <div key={activation.id} className="rounded-2xl bg-[#f3ecdc] p-3 text-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-bold">{formatLabel(activation.toolType)}</p>
                    <p className="text-[#675f50]">{formatLabel(activation.triggerReason)} - {formatLabel(activation.status)}</p>
                  </div>
                  {activation.status === "active" ? (
                    <div className="flex gap-2">
                      <button type="button" onClick={() => updateActivation(activation.id, "dismissed")} className="rounded-full border border-[#cabda4] bg-[#fffaf0] px-3 py-1 text-xs font-bold">
                        Dismiss
                      </button>
                      <button type="button" onClick={() => updateActivation(activation.id, "expired")} className="rounded-full border border-[#cabda4] bg-[#fffaf0] px-3 py-1 text-xs font-bold">
                        Expire
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            )) : (
              <p className="rounded-2xl bg-[#f3ecdc] p-3 text-sm font-semibold text-[#675f50]">No activations for this live yet.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#fffaf0] p-3">
      <dt className="text-[11px] font-black uppercase tracking-[.12em] text-[#6f7f4f]">{label}</dt>
      <dd className="mt-1 font-semibold text-[#1e2419]">{value}</dd>
    </div>
  );
}

function inputClass() {
  return "rounded-2xl border border-[#cabda4] bg-[#fffaf0] px-4 py-3 text-sm font-semibold text-[#1e2419] outline-none";
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}
