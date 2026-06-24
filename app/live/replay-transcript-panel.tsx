"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { ReplayTranscriptSegment, ReplayTranscriptTag } from "@/lib/backend/types";

type KeyMoment = {
  tag: ReplayTranscriptTag;
  label: string;
  empty: string;
};

type KnowledgeClip = {
  title: string;
  range: string;
  purpose: string;
  segmentId: string;
};

const keyMoments: KeyMoment[] = [
  { tag: "MOQ", label: "MOQ mentioned", empty: "No MOQ moment tagged yet" },
  { tag: "shipping", label: "Shipping mentioned", empty: "No shipping moment tagged yet" },
  { tag: "quality", label: "Product quality mentioned", empty: "No quality moment tagged yet" },
  { tag: "pricing", label: "Pricing mentioned", empty: "No pricing moment tagged yet" },
  { tag: "RFQ", label: "RFQ or sample request mentioned", empty: "No RFQ moment tagged yet" },
];

const knowledgeMomentLabels: Record<ReplayTranscriptTag, string> = {
  product: "Product proof",
  MOQ: "MOQ",
  shipping: "Shipping",
  pricing: "Pricing",
  quality: "Quality",
  RFQ: "RFQ",
};

export function ReplayTranscriptPanel({
  transcript,
  status,
}: {
  transcript: ReplayTranscriptSegment[];
  status: "scheduled" | "live" | "replay";
}) {
  const [query, setQuery] = useState("");
  const [selectedSegmentId, setSelectedSegmentId] = useState(transcript[0]?.id ?? "");
  const selectedSegment = transcript.find((segment) => segment.id === selectedSegmentId) ?? transcript[0];
  const normalizedQuery = query.trim().toLowerCase();
  const filteredTranscript = useMemo(() => {
    if (!normalizedQuery) {
      return transcript;
    }

    return transcript.filter((segment) => {
      const content = [
        segment.timestamp,
        segment.speaker,
        segment.text,
        ...(segment.tags ?? []),
      ].join(" ").toLowerCase();

      return content.includes(normalizedQuery);
    });
  }, [normalizedQuery, transcript]);
  const moments = useMemo(
    () =>
      keyMoments.map((moment) => ({
        ...moment,
        segment: transcript.find((segment) => segment.tags?.includes(moment.tag)),
      })),
    [transcript],
  );
  const shoppableMoments = useMemo(
    () =>
      transcript
        .filter((segment) => segment.tags?.some((tag) => ["product", "MOQ", "shipping", "pricing", "quality", "RFQ"].includes(tag)))
        .slice(0, 5)
        .map((segment) => ({
          id: segment.id,
          label: shoppableLabel(segment),
          detail: segment.text,
          timestamp: segment.timestamp,
          segment,
        })),
    [transcript],
  );
  const suggestedClips = useMemo(
    () =>
      shoppableMoments.slice(0, 3).map((moment) => {
        const next = transcript.find((segment) => segment.seconds > moment.segment.seconds);
        return {
          title: clipTitle(moment.segment),
          range: transcriptRange(moment.segment, next),
          purpose: clipPurpose(moment.segment),
          segmentId: moment.id,
        } satisfies KnowledgeClip;
      }),
    [shoppableMoments, transcript],
  );
  const reusableTags = useMemo(
    () =>
      [...new Set(transcript.flatMap((segment) => segment.tags ?? []))].sort((left, right) =>
        knowledgeMomentLabels[left].localeCompare(knowledgeMomentLabels[right]),
      ),
    [transcript],
  );
  const summary = useMemo(() => buildTranscriptSummary(transcript), [transcript]);

  if (transcript.length === 0) {
    return null;
  }

  function selectSegment(segment: ReplayTranscriptSegment) {
    setSelectedSegmentId(segment.id);
  }

  return (
    <section className="mt-6 rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-[#d6cbb6] pb-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6f7f4f]">
            Replay transcript
          </p>
          <h2 className="mt-1 text-2xl font-semibold">Searchable session transcript</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#675f50]">
            Demo transcript segments are indexed by timestamp, speaker, and procurement tags.
          </p>
        </div>
        <div className="w-fit rounded-2xl border border-[#cabda4] bg-[#f3ecdc] px-4 py-3">
          <p className="text-[11px] font-black uppercase tracking-[.12em] text-[#6f7f4f]">
            Current timestamp
          </p>
          <p className="mt-1 text-xl font-semibold text-[#1e2419]">
            {selectedSegment?.timestamp ?? "0:00"}
          </p>
          <p className="mt-1 text-xs font-semibold text-[#675f50]">
            {status === "replay" ? "Replay navigation state" : "Demo player navigation state"}
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-3xl border border-[#d6cbb6] bg-[#f3ecdc] p-4">
        <p className="text-[11px] font-black uppercase tracking-[.16em] text-[#6f7f4f]">
          AI replay summary
        </p>
        <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-lg font-semibold text-[#1e2419]">{summary.headline}</p>
            <p className="mt-2 text-sm leading-6 text-[#675f50]">{summary.body}</p>
          </div>
          <div className="grid gap-2 text-xs font-bold text-[#596540] sm:grid-cols-3 lg:min-w-[18rem]">
            <Stat label="Shoppable moments" value={String(shoppableMoments.length)} />
            <Stat label="Suggested clips" value={String(suggestedClips.length)} />
            <Stat label="Reusable tags" value={String(reusableTags.length)} />
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[.92fr_1.08fr]">
        <div className="space-y-5">
          <div>
            <label htmlFor="transcript-search" className="text-sm font-bold text-[#596540]">
              Keyword search
            </label>
            <input
              id="transcript-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search MOQ, shipping, pricing, quality, RFQ..."
              className="mt-2 w-full rounded-2xl border border-[#cabda4] bg-[#f3ecdc] px-4 py-3 text-sm font-semibold text-[#1e2419] outline-none transition focus:border-[#6f7f4f] focus:bg-[#fffaf0]"
            />
          </div>

          <KnowledgePanel
            title="Key moments"
            count={`${moments.filter((moment) => moment.segment).length}/5`}
          >
            <div className="grid gap-2">
              {moments.map((moment) => (
                <button
                  key={moment.tag}
                  type="button"
                  disabled={!moment.segment}
                  onClick={() => moment.segment && selectSegment(moment.segment)}
                  className={`rounded-2xl border px-3 py-3 text-left transition ${
                    moment.segment?.id === selectedSegment?.id
                      ? "border-[#1e2419] bg-[#1e2419] text-[#fffaf0]"
                      : "border-[#d6cbb6] bg-[#fffaf0] text-[#1e2419] hover:border-[#6f7f4f]"
                  } disabled:cursor-not-allowed disabled:opacity-55`}
                >
                  <span className="block text-sm font-semibold">{moment.label}</span>
                  <span className={moment.segment?.id === selectedSegment?.id ? "mt-1 block text-xs text-[#ded8ca]" : "mt-1 block text-xs text-[#675f50]"}>
                    {moment.segment ? `${moment.segment.timestamp} - ${moment.segment.speaker}` : moment.empty}
                  </span>
                </button>
              ))}
            </div>
          </KnowledgePanel>

          <KnowledgePanel title="Shoppable moments" count={`${shoppableMoments.length}`}>
            <div className="grid gap-2">
              {shoppableMoments.map((moment) => (
                <button
                  key={moment.id}
                  type="button"
                  onClick={() => selectSegment(moment.segment)}
                  className={`rounded-2xl border px-3 py-3 text-left transition ${
                    moment.segment.id === selectedSegment?.id
                      ? "border-[#1e2419] bg-[#1e2419] text-[#fffaf0]"
                      : "border-[#d6cbb6] bg-[#fffaf0] text-[#1e2419] hover:border-[#6f7f4f]"
                  }`}
                >
                  <span className="flex items-start justify-between gap-3">
                    <span>
                      <span className="block text-sm font-semibold">{moment.label}</span>
                      <span className={moment.segment.id === selectedSegment?.id ? "mt-1 block text-xs text-[#ded8ca]" : "mt-1 block text-xs text-[#675f50]"}>
                        {moment.timestamp}
                      </span>
                    </span>
                    <span className={moment.segment.id === selectedSegment?.id ? "rounded-full bg-[#fffaf0]/12 px-2 py-1 text-[11px] font-black text-[#cbd8a7]" : "rounded-full bg-[#edf2dd] px-2 py-1 text-[11px] font-black text-[#596540]"}>
                      Jump
                    </span>
                  </span>
                  <span className={moment.segment.id === selectedSegment?.id ? "mt-3 block text-sm leading-6 text-[#ded8ca]" : "mt-3 block text-sm leading-6 text-[#675f50]"}>
                    {moment.detail}
                  </span>
                </button>
              ))}
            </div>
          </KnowledgePanel>

          <KnowledgePanel title="Suggested clips" count={`${suggestedClips.length}`}>
            <div className="grid gap-2">
              {suggestedClips.map((clip) => (
                <button
                  key={clip.segmentId}
                  type="button"
                  onClick={() => {
                    const segment = transcript.find((item) => item.id === clip.segmentId);
                    if (segment) {
                      selectSegment(segment);
                    }
                  }}
                  className="rounded-2xl border border-[#d6cbb6] bg-[#fffaf0] px-3 py-3 text-left transition hover:border-[#6f7f4f]"
                >
                  <span className="block text-sm font-semibold text-[#1e2419]">{clip.title}</span>
                  <span className="mt-1 block text-xs font-bold uppercase tracking-[.12em] text-[#6f7f4f]">
                    {clip.range}
                  </span>
                  <span className="mt-2 block text-sm leading-6 text-[#675f50]">{clip.purpose}</span>
                </button>
              ))}
            </div>
          </KnowledgePanel>

          <KnowledgePanel title="Reusable knowledge tags" count={`${reusableTags.length}`}>
            <div className="flex flex-wrap gap-2">
              {reusableTags.length ? (
                reusableTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      const match = transcript.find((segment) => segment.tags?.includes(tag));
                      if (match) {
                        selectSegment(match);
                      }
                    }}
                    className="rounded-full bg-[#fffaf0] px-3 py-2 text-xs font-black text-[#596540] transition hover:bg-white"
                  >
                    {knowledgeMomentLabels[tag]}
                  </button>
                ))
              ) : (
                <p className="text-sm font-semibold text-[#675f50]">No reusable tags found.</p>
              )}
            </div>
          </KnowledgePanel>
        </div>

        <div className="rounded-3xl border border-[#d6cbb6] bg-[#f3ecdc] p-3">
          <div className="mb-2 flex items-center justify-between gap-3 px-1">
            <p className="text-sm font-bold text-[#1e2419]">Transcript lines</p>
            <span className="rounded-full bg-[#fffaf0] px-3 py-1 text-xs font-black text-[#596540]">
              {filteredTranscript.length} shown
            </span>
          </div>
          <div className="max-h-[620px] overflow-y-auto pr-1">
            {filteredTranscript.length > 0 ? (
              <div className="grid gap-2">
                {filteredTranscript.map((segment) => {
                  const selected = segment.id === selectedSegment?.id;

                  return (
                    <button
                      key={segment.id}
                      type="button"
                      onClick={() => selectSegment(segment)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        selected
                          ? "border-[#1e2419] bg-[#1e2419] text-[#fffaf0] shadow-lg shadow-[#8a7d61]/12"
                          : "border-[#d6cbb6] bg-[#fffaf0] text-[#1e2419] hover:border-[#6f7f4f]"
                      }`}
                    >
                      <span className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <span>
                          <span className={selected ? "text-xs font-black uppercase tracking-[.12em] text-[#cbd8a7]" : "text-xs font-black uppercase tracking-[.12em] text-[#6f7f4f]"}>
                            {segment.timestamp}
                          </span>
                          <span className="ml-2 text-sm font-semibold">{segment.speaker}</span>
                        </span>
                        {segment.tags?.length ? (
                          <span className="flex flex-wrap gap-1">
                            {segment.tags.map((tag) => (
                              <span
                                key={tag}
                                className={selected ? "rounded-full bg-[#fffaf0]/12 px-2 py-1 text-[11px] font-black text-[#cbd8a7]" : "rounded-full bg-[#edf2dd] px-2 py-1 text-[11px] font-black text-[#596540]"}
                              >
                                {tag}
                              </span>
                            ))}
                          </span>
                        ) : null}
                      </span>
                      <span className={selected ? "mt-3 block text-sm leading-6 text-[#ded8ca]" : "mt-3 block text-sm leading-6 text-[#675f50]"}>
                        {segment.text}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-2xl bg-[#fffaf0] p-4 text-sm font-semibold text-[#675f50]">
                No transcript lines match this keyword.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function KnowledgePanel({
  title,
  count,
  children,
}: {
  title: string;
  count: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-[#1e2419]">{title}</p>
        <span className="rounded-full bg-[#edf2dd] px-3 py-1 text-xs font-black text-[#596540]">{count}</span>
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#fffaf0] px-3 py-3">
      <p className="text-[11px] uppercase tracking-[.12em] text-[#6f7f4f]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#1e2419]">{value}</p>
    </div>
  );
}

function buildTranscriptSummary(transcript: ReplayTranscriptSegment[]) {
  const tags = [...new Set(transcript.flatMap((segment) => segment.tags ?? []))];
  const focalTags = tags.length ? tags.map((tag) => knowledgeMomentLabels[tag]).join(", ") : "core procurement questions";

  return {
    headline: "AI summary",
    body: `This replay concentrates on ${focalTags}. Buyers can jump from transcript lines to shoppable moments, clip suggestions, and reusable tags without leaving the page.`,
  };
}

function shoppableLabel(segment: ReplayTranscriptSegment) {
  const tag = segment.tags?.find((item) => knowledgeMomentLabels[item]);
  return tag ? knowledgeMomentLabels[tag] : "Shoppable moment";
}

function clipTitle(segment: ReplayTranscriptSegment) {
  const tag = segment.tags?.find((item) => knowledgeMomentLabels[item]);
  if (!tag) {
    return "Session clip";
  }
  return `${knowledgeMomentLabels[tag]} clip`;
}

function clipPurpose(segment: ReplayTranscriptSegment) {
  const tag = segment.tags?.find((item) => knowledgeMomentLabels[item]);
  switch (tag) {
    case "MOQ":
      return "Use for RFQ scoping and minimum order review.";
    case "shipping":
      return "Use for landed-cost and route discussion.";
    case "pricing":
      return "Use for price comparison and bundle negotiation.";
    case "quality":
      return "Use for proof and material verification.";
    case "RFQ":
      return "Use for sample or quote handoff.";
    default:
      return "Use for replay search and buyer follow-up.";
  }
}

function transcriptRange(start: ReplayTranscriptSegment, end?: ReplayTranscriptSegment) {
  const endLabel = end ? formatSeconds(end.seconds) : formatSeconds(start.seconds + 45);
  return `${start.timestamp} - ${endLabel}`;
}

function formatSeconds(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}
