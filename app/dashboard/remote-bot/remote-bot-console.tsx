"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ProfileType, SafeUser } from "@/lib/backend/types";

type ApiEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string } };

type BotConnection = {
  id: string;
  channel: "whatsapp" | "telegram";
  handle: string;
  phoneNumber?: string | null;
  status: string;
};

type BotLog = {
  id: string;
  channel: "whatsapp" | "telegram";
  rawMessage: string;
  detectedIntent: string;
  status: string;
  responseText: string;
  createdAt: string;
};

type BotResult = {
  intent: string;
  status: string;
  responseText: string;
  createdLiveRequestId?: string;
  suggestedCommands: string[];
};

const providerRoles = ["hotel", "restaurant", "supplier", "service_provider"];

export function RemoteBotConsole({ user }: { user: SafeUser }) {
  const [channel, setChannel] = useState<"whatsapp" | "telegram">("whatsapp");
  const [message, setMessage] = useState("Account summary");
  const [response, setResponse] = useState<BotResult | null>(null);
  const [connections, setConnections] = useState<BotConnection[]>([]);
  const [logs, setLogs] = useState<BotLog[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [setup, setSetup] = useState({ profileType: user.role, name: user.name, email: user.email });
  const [liveDraft, setLiveDraft] = useState({
    title: `${user.name} bot live request`,
    description: "Demo live request created from the Remote Account Bot simulator.",
    slotIndex: "0",
  });

  const suggestedCommands = useMemo(() => {
    const base = [
      "Account summary",
      "Check available live slots",
      "Schedule a live",
      "Create live request",
      "Show live request status",
      "Help",
    ];
    return user.role === "main_admin" ? [...base, "RFQ summary", "Pending live requests summary"] : base;
  }, [user.role]);

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    const [connectionResponse, logsResponse] = await Promise.all([
      fetch("/api/bot/connections", { cache: "no-store" }),
      fetch("/api/bot/logs", { cache: "no-store" }),
    ]);
    const connectionPayload = (await connectionResponse.json()) as ApiEnvelope<BotConnection[]>;
    const logsPayload = (await logsResponse.json()) as ApiEnvelope<BotLog[]>;
    if (connectionPayload.success) {
      setConnections(connectionPayload.data);
    }
    if (logsPayload.success) {
      setLogs(logsPayload.data);
    }
  }

  async function connectDemo(selectedChannel: "whatsapp" | "telegram") {
    const payload = {
      channel: selectedChannel,
      handle: selectedChannel === "whatsapp" ? `+100000-${user.id.slice(0, 5)}` : `@${user.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
    };
    const response = await fetch("/api/bot/connections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const envelope = (await response.json()) as ApiEnvelope<BotConnection>;
    if (envelope.success) {
      await refresh();
    }
  }

  async function sendCommand(command = message, payload?: Record<string, unknown>) {
    setIsSending(true);
    try {
      const apiResponse = await fetch("/api/bot/simulate-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, message: command, payload }),
      });
      const envelope = (await apiResponse.json()) as ApiEnvelope<BotResult>;
      setResponse(
        envelope.success
          ? envelope.data
          : {
              intent: "failed",
              status: "failed",
              responseText: envelope.error.message,
              suggestedCommands,
            },
      );
      await refresh();
    } finally {
      setIsSending(false);
    }
  }

  const canCreateLive = providerRoles.includes(user.role);

  return (
    <section className="mx-auto grid max-w-6xl gap-5 px-4 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:px-8">
      <div className="grid content-start gap-5">
        <div className="grid gap-3 sm:grid-cols-2">
          {(["whatsapp", "telegram"] as const).map((item) => {
            const connection = connections.find((candidate) => candidate.channel === item);
            return (
              <article key={item} className="rounded-2xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6f7f4f]">{item}</p>
                    <h2 className="mt-2 text-xl font-semibold">{item === "whatsapp" ? "WhatsApp" : "Telegram"}</h2>
                  </div>
                  <span className="rounded-full bg-[#edf2dd] px-3 py-1 text-xs font-black text-[#596540]">
                    {connection?.status.replace(/_/g, " ") ?? "not connected"}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-[#675f50]">
                  {connection?.handle ?? "Provider not configured. Use demo mode to simulate commands locally."}
                </p>
                <button
                  type="button"
                  onClick={() => connectDemo(item)}
                  className="mt-4 rounded-full bg-[#1e2419] px-4 py-2 text-sm font-bold text-[#fffaf0]"
                >
                  Save demo connection
                </button>
              </article>
            );
          })}
        </div>

        <div className="rounded-2xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6f7f4f]">Account setup through bot</p>
          <div className="mt-4 grid gap-3">
            <select
              aria-label="Profile type"
              value={setup.profileType}
              onChange={(event) => setSetup((current) => ({ ...current, profileType: event.target.value as ProfileType }))}
              className="rounded-xl border border-[#cabda4] bg-[#fffaf0] px-4 py-3 text-sm font-semibold"
            >
              <option value="viewer">Viewer</option>
              <option value="hotel">Hotel</option>
              <option value="restaurant">Restaurant</option>
              <option value="supplier">Supplier</option>
              <option value="service_provider">Service provider</option>
            </select>
            <input
              aria-label="Demo name"
              value={setup.name}
              onChange={(event) => setSetup((current) => ({ ...current, name: event.target.value }))}
              className="rounded-xl border border-[#cabda4] bg-[#fffaf0] px-4 py-3 text-sm font-semibold"
            />
            <input
              aria-label="Demo email"
              value={setup.email}
              onChange={(event) => setSetup((current) => ({ ...current, email: event.target.value }))}
              className="rounded-xl border border-[#cabda4] bg-[#fffaf0] px-4 py-3 text-sm font-semibold"
            />
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => sendCommand("Create account", setup)}
                className="rounded-full bg-[#1e2419] px-4 py-2 text-sm font-bold text-[#fffaf0]"
              >
                Simulate setup
              </button>
              <Link href="/signup" className="rounded-full border border-[#cabda4] bg-[#fffaf0] px-4 py-2 text-sm font-bold text-[#1e2419]">
                Open signup
              </Link>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6f7f4f]">Live setup through bot</p>
          <div className="mt-4 grid gap-3">
            <input
              aria-label="Live request title"
              value={liveDraft.title}
              onChange={(event) => setLiveDraft((current) => ({ ...current, title: event.target.value }))}
              className="rounded-xl border border-[#cabda4] bg-[#fffaf0] px-4 py-3 text-sm font-semibold"
              disabled={!canCreateLive}
            />
            <select
              aria-label="Suggested slot"
              value={liveDraft.slotIndex}
              onChange={(event) => setLiveDraft((current) => ({ ...current, slotIndex: event.target.value }))}
              className="rounded-xl border border-[#cabda4] bg-[#fffaf0] px-4 py-3 text-sm font-semibold"
              disabled={!canCreateLive}
            >
              <option value="0">Suggested slot 1</option>
              <option value="1">Suggested slot 2</option>
              <option value="2">Suggested slot 3</option>
              <option value="3">Suggested slot 4</option>
            </select>
            <button
              type="button"
              onClick={() => sendCommand("Create live request", { ...liveDraft, slotIndex: Number(liveDraft.slotIndex) })}
              disabled={!canCreateLive || isSending}
              className="rounded-full bg-[#1e2419] px-4 py-2 text-sm font-bold text-[#fffaf0] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Create draft live request
            </button>
            {!canCreateLive ? (
              <p className="text-sm leading-6 text-[#8c3f2b]">Viewers and admins cannot create provider live requests through the bot.</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid content-start gap-5">
        <div className="rounded-2xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6f7f4f]">Command simulator</p>
              <h2 className="mt-1 text-xl font-semibold">Send a local bot command</h2>
            </div>
            <select
              aria-label="Bot channel"
              value={channel}
              onChange={(event) => setChannel(event.target.value as "whatsapp" | "telegram")}
              className="rounded-full border border-[#cabda4] bg-[#fffaf0] px-4 py-2 text-sm font-bold"
            >
              <option value="whatsapp">WhatsApp</option>
              <option value="telegram">Telegram</option>
            </select>
          </div>
          <div className="mt-4 flex gap-2">
            <input
              aria-label="Bot command"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className="min-w-0 flex-1 rounded-full border border-[#cabda4] bg-[#fffaf0] px-4 py-3 text-sm font-semibold outline-none"
            />
            <button
              type="button"
              onClick={() => sendCommand()}
              disabled={isSending}
              className="rounded-full bg-[#1e2419] px-5 py-3 text-sm font-bold text-[#fffaf0] disabled:opacity-50"
            >
              Send
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {suggestedCommands.map((command) => (
              <button
                type="button"
                key={command}
                onClick={() => {
                  setMessage(command);
                  sendCommand(command);
                }}
                className="rounded-full bg-[#f3ecdc] px-3 py-2 text-xs font-bold text-[#596540] transition hover:bg-[#e8dfce]"
              >
                {command}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[#1e2419] bg-[#1e2419] p-5 text-[#fffaf0] shadow-xl shadow-[#8a7d61]/12">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#cbd8a7]">Bot response</p>
            <span className="rounded-full bg-[#fffaf0]/12 px-3 py-1 text-xs font-bold text-[#cbd8a7]">
              {response?.status ?? "waiting"}
            </span>
          </div>
          <pre className="mt-4 whitespace-pre-wrap rounded-2xl bg-white/[.06] p-4 text-sm leading-7 text-[#fffaf0]">
            {response?.responseText ?? "Run a command to see the local bot response."}
          </pre>
        </div>

        <div className="rounded-2xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6f7f4f]">Command history</p>
              <h2 className="mt-1 text-xl font-semibold">Recent bot logs</h2>
            </div>
            <button type="button" onClick={refresh} className="rounded-full bg-[#f3ecdc] px-3 py-2 text-xs font-bold text-[#596540]">
              Refresh
            </button>
          </div>
          <div className="grid gap-3">
            {logs.length === 0 ? (
              <p className="text-sm text-[#675f50]">No bot commands logged yet.</p>
            ) : (
              logs.map((log) => (
                <article key={log.id} className="rounded-xl bg-[#f3ecdc] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">{log.rawMessage}</p>
                    <span className="rounded-full bg-[#edf2dd] px-3 py-1 text-[11px] font-black text-[#596540]">
                      {log.detectedIntent.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#675f50]">{log.responseText}</p>
                </article>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
