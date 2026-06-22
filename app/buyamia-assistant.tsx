"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { AssistantAction, AssistantResponse, AssistantSearchResult } from "@/lib/backend/types";

type ApiEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; fields?: Record<string, string> } };

const suggestedQueries = [
  "Manage lives",
  "Generate an RFQ",
  "Open calendar",
  "Find hotel lives",
  "Show replay expiring soon",
  "Help",
];

export function BuyamiaAssistant({ isPublicHome = false }: { isPublicHome?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<AssistantResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        open();
      }
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  function open() {
    setIsOpen(true);
    setError("");
  }

  async function submit(nextQuery = query) {
    const trimmed = nextQuery.trim();
    if (!trimmed) {
      setError("Please enter a command or search.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const apiResponse = await fetch("/api/assistant/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed }),
      });
      const payload = (await apiResponse.json()) as ApiEnvelope<AssistantResponse>;
      if (!apiResponse.ok || !payload.success) {
        throw new Error(payload.success ? "Assistant query failed." : payload.error.message);
      }
      setResponse(payload.data);
    } catch (assistantError) {
      setError(assistantError instanceof Error ? assistantError.message : "Assistant query failed.");
    } finally {
      setIsLoading(false);
    }
  }

  function runSuggestion(value: string) {
    setQuery(value);
    void submit(value);
  }

  const resultCount = useMemo(
    () => (response ? response.actions.length + response.results.length : 0),
    [response],
  );

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-label="Open Buyamia Assistant"
        className="flex min-w-0 items-center gap-2 rounded-2xl border border-[#d6cbb6] bg-[#fffaf0]/86 px-3 py-2 text-left shadow-sm transition hover:bg-white"
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-[#edf2dd] text-sm font-black text-[#596540]">
          {isPublicHome ? "B" : "AI"}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm text-[#8a8170]">
          {isPublicHome
            ? "Search hotels, rooms, food, spa, or live experiences"
            : "Ask Buyamia Assistant about RFQs, risk, lives, or dashboards"}
        </span>
        <span className="hidden rounded-full bg-[#f3ecdc] px-3 py-1 text-xs font-bold text-[#766e5e] sm:inline-flex">
          Ctrl K
        </span>
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Buyamia Assistant"
          className="fixed inset-0 z-50 grid place-items-start bg-[#1e2419]/45 px-4 py-6 backdrop-blur-sm sm:py-10"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsOpen(false);
            }
          }}
        >
          <section className="mx-auto w-full max-w-3xl rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-4 shadow-2xl shadow-[#1e2419]/30">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6f7f4f]">
                  Buyamia Assistant
                </p>
                <h2 id="buyamia-assistant-title" className="mt-1 text-xl font-semibold">
                  Local command and search assistant
                </h2>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full border border-[#cabda4] bg-[#fffaf0] px-4 py-2 text-sm font-bold text-[#1e2419]"
              >
                Close
              </button>
            </div>

            <form
              onSubmit={(event: FormEvent<HTMLFormElement>) => {
                event.preventDefault();
                void submit();
              }}
              className="mt-4 flex flex-col gap-2 sm:flex-row"
            >
              <label className="sr-only" htmlFor="buyamia-assistant-query">
                Assistant query
              </label>
              <input
                id="buyamia-assistant-query"
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Try: Manage lives, Find spa replays, Generate an RFQ"
                className="min-w-0 flex-1 rounded-2xl border border-[#cabda4] bg-[#fffaf0] px-4 py-3 text-sm font-semibold text-[#1e2419] outline-none"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="rounded-full bg-[#1e2419] px-5 py-3 text-sm font-bold text-[#fffaf0] disabled:opacity-60"
              >
                {isLoading ? "Searching..." : "Submit"}
              </button>
            </form>

            <div className="mt-3 flex flex-wrap gap-2" aria-label="Suggested commands">
              {suggestedQueries.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => runSuggestion(suggestion)}
                  className="rounded-full border border-[#cabda4] bg-[#f3ecdc] px-3 py-1.5 text-xs font-bold text-[#1e2419]"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <p className="sr-only" role="status" aria-live="polite">
              {isLoading ? "Assistant is searching." : response ? `${resultCount} assistant results available.` : ""}
            </p>

            {error && (
              <p className="mt-4 rounded-2xl bg-[#fff3ed] p-3 text-sm font-bold text-[#8c3f2b]">
                {error}
              </p>
            )}

            {response && (
              <div className="mt-4 grid gap-4">
                <div className="rounded-2xl bg-[#f3ecdc] p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#edf2dd] px-3 py-1 text-xs font-black text-[#596540]">
                      {response.providerHealthy ? "AI ready" : "Local assistant"}
                    </span>
                    <span className="rounded-full bg-[#fffaf0] px-3 py-1 text-xs font-bold text-[#766e5e]">
                      {response.role ? response.role.replace(/_/g, " ") : "public"}
                    </span>
                    <Link href="/settings/integrations/ai" className="rounded-full border border-[#cabda4] bg-[#fffaf0] px-3 py-1 text-xs font-bold text-[#1e2419]">
                      Integration status
                    </Link>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-[#675f50]">{response.message}</p>
                </div>

                <ResultSection title="Intended action" items={response.actions} empty="No direct action recognized." />
                <SearchResultSection results={response.results} />

                {!response.actions.length && !response.results.length && (
                  <div className="rounded-2xl bg-[#f3ecdc] p-4">
                    <p className="text-sm font-bold">Helpful suggestions</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {response.suggestions.map((suggestion) => (
                        <button
                          key={suggestion.id}
                          type="button"
                          onClick={() => runSuggestion(suggestion.title)}
                          className="rounded-full border border-[#cabda4] bg-[#fffaf0] px-3 py-2 text-xs font-bold text-[#1e2419]"
                        >
                          {suggestion.title}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => runSuggestion("Help")}
                      className="mt-3 rounded-full bg-[#1e2419] px-4 py-2 text-xs font-bold text-[#fffaf0]"
                    >
                      Show available commands
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}

function ResultSection({ title, items, empty }: { title: string; items: AssistantAction[]; empty: string }) {
  return (
    <section className="rounded-2xl bg-[#f3ecdc] p-4">
      <h3 className="text-sm font-bold">{title}</h3>
      <div className="mt-3 grid gap-2">
        {items.length ? items.map((item) => <ActionLink key={item.id} item={item} />) : <p className="text-sm text-[#675f50]">{empty}</p>}
      </div>
    </section>
  );
}

function SearchResultSection({ results }: { results: AssistantSearchResult[] }) {
  return (
    <section className="rounded-2xl bg-[#f3ecdc] p-4">
      <h3 className="text-sm font-bold">Results</h3>
      <div className="mt-3 grid gap-2">
        {results.length ? (
          results.map((result) => (
            <Link key={`${result.type}:${result.id}`} href={result.href} className="rounded-xl bg-[#fffaf0] p-3 text-sm transition hover:bg-white">
              <span className="font-semibold text-[#1e2419]">{result.title}</span>
              <span className="mt-1 block text-xs font-semibold uppercase tracking-[.12em] text-[#6f7f4f]">{result.type.replace(/_/g, " ")}</span>
              <span className="mt-1 block text-xs text-[#675f50]">{result.context}</span>
            </Link>
          ))
        ) : (
          <p className="text-sm text-[#675f50]">No records found for this query.</p>
        )}
      </div>
    </section>
  );
}

function ActionLink({ item }: { item: AssistantAction }) {
  if (item.href.startsWith("#")) {
    return (
      <div className="rounded-xl bg-[#fffaf0] p-3 text-left text-sm">
        <span className="font-semibold">{item.title}</span>
        <span className="mt-1 block text-xs text-[#675f50]">{item.description}</span>
      </div>
    );
  }

  return (
    <Link href={item.href} className="rounded-xl bg-[#fffaf0] p-3 text-sm transition hover:bg-white">
      <span className="font-semibold text-[#1e2419]">{item.title}</span>
      <span className="mt-1 block text-xs text-[#675f50]">{item.description}</span>
    </Link>
  );
}
