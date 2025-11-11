"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "intro.js/introjs.css";
import { TagPills, TagReasoning, TagSummary, parseTagPayload } from "@/components/tag-display";

type Row = {
  month: string;
  ticketId: number;
  tags: string | null;
};

type DatasetInfo = {
  label: string;
  csv: string;
  rows: Row[];
};

type TranscriptTurn = {
  created_at?: string;
  speaker: string;
  author_name?: string;
  via?: string;
  text: string;
};

type ConversationPayload = {
  transcript: TranscriptTurn[];
};

type TooltipButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tooltip: string;
};

function TooltipButton({ tooltip, className = "", children, ...props }: TooltipButtonProps) {
  return (
    <div className="relative inline-flex group">
      <button className={className} {...props}>
        {children}
      </button>
      <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
        {tooltip}
      </span>
    </div>
  );
}

function formatMonth(value: string) {
  if (!value) return "—";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function SpeakerBubble({ turn }: { turn: TranscriptTurn }) {
  const isUser = turn.speaker === "user";
  const isAgent = turn.speaker === "agent";
  const bubbleClass = isUser
    ? "bg-slate-50 text-slate-900"
    : isAgent
      ? "bg-emerald-50 text-slate-900"
      : "bg-slate-200 text-slate-900";
  return (
    <div className={`rounded-2xl p-4 text-sm ${bubbleClass}`}>
      <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-slate-500">
        {turn.speaker} {turn.author_name ? `• ${turn.author_name}` : ""}
        {turn.created_at ? ` • ${new Date(turn.created_at).toLocaleString()}` : ""}
        {turn.via ? ` • via ${turn.via}` : ""}
      </div>
      <div className="whitespace-pre-wrap leading-relaxed">{turn.text || "(empty)"}</div>
    </div>
  );
}

type DatasetMap = {
  done: DatasetInfo;
  active: DatasetInfo;
};

const TOUR_STORAGE_KEY = "zincworkTaggingTourSeen";

type TourStep = {
  element: string;
  title: string;
  intro: string;
};

const TOUR_STEP_DEFS: TourStep[] = [
  {
    element: '[data-tour-id="dataset-controls"]',
    title: "Datasets & pages",
    intro: "Switch between Done/Active exports and page through tickets.",
  },
  {
    element: '[data-tour-id="ticket-summary"]',
    title: "Summary",
    intro: "Each ticket includes a short recap pulled from the CSV.",
  },
  {
    element: '[data-tour-id="ticket-tags"]',
    title: "Tag pills",
    intro: "These chips show the taxonomy values for that ticket.",
  },
  {
    element: '[data-tour-id="ticket-reasoning"]',
    title: "Reasoning",
    intro: "Quick context on why the ticket was tagged that way.",
  },
  {
    element: '[data-tour-id="fetch-conversation"]',
    title: "Fetch conversation",
    intro: "Loads the full Zendesk transcript for deeper review.",
  },
];

const getAvailableTourSteps = (): TourStep[] => {
  if (typeof document === "undefined") {
    return [];
  }
  return TOUR_STEP_DEFS.filter((step) => document.querySelector(step.element));
};


export default function ZincworkTaggingClient({
  datasets,
  defaultDataset,
  defaultSubdomain,
  enableTagging = false,
}: {
  datasets: DatasetMap;
  defaultDataset: keyof DatasetMap;
  defaultSubdomain?: string;
  enableTagging?: boolean;
}) {
  const PAGE_SIZE = 250;
  const [datasetKey, setDatasetKey] = useState<keyof DatasetMap>(defaultDataset);
  const [page, setPage] = useState(0);
  const [selectedTicket, setSelectedTicket] = useState<number | null>(null);
  const [conversation, setConversation] = useState<ConversationPayload | null>(null);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [tagging, setTagging] = useState<number | null>(null);
  const [taggingError, setTaggingError] = useState<string | null>(null);
  const [tourReady, setTourReady] = useState(false);
  const introRef = useRef<typeof import("intro.js").default | null>(null);
  const taggingAllowed = Boolean(enableTagging);

  const startTour = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!introRef.current) return;
    const steps = getAvailableTourSteps();
    if (!steps.length) return;

    const instance = introRef.current();
    instance.setOptions({
      steps,
      showBullets: false,
      showProgress: false,
      exitOnOverlayClick: true,
      exitOnEsc: true,
      disableInteraction: true,
      nextLabel: "Next",
      prevLabel: "Back",
      doneLabel: "Done",
    });

    const markSeen = () => {
      window.localStorage.setItem(TOUR_STORAGE_KEY, "1");
    };

    instance.oncomplete(markSeen);
    instance.onexit(markSeen);
    instance.start();
  }, []);

  const currentDataset = datasets[datasetKey];
  const currentCsv = currentDataset.csv;
  const totalCount = currentDataset.rows.length;
  const pageStart = page * PAGE_SIZE;
  const pageRows = currentDataset.rows.slice(pageStart, pageStart + PAGE_SIZE);
  const hasPrev = page > 0;
  const hasNext = pageStart + PAGE_SIZE < totalCount;
  const datasetEntries = Object.entries(datasets) as Array<[keyof DatasetMap, DatasetInfo]>;

  useEffect(() => {
    let canceled = false;
    import("intro.js")
      .then((module) => {
        if (canceled) return;
        introRef.current = module.default;
        setTourReady(true);
      })
      .catch(() => {});
    return () => {
      canceled = true;
    };
  }, []);

  useEffect(() => {
    if (!tourReady || typeof window === "undefined") return undefined;
    const seen = window.localStorage.getItem(TOUR_STORAGE_KEY);
    if (seen === "1") return undefined;
    const timer = window.setTimeout(() => {
      startTour();
    }, 600);
    return () => window.clearTimeout(timer);
  }, [startTour, tourReady]);

  const handleDatasetChange = useCallback(
    (target: keyof DatasetMap) => {
      if (target === datasetKey) return;
      setDatasetKey(target);
      setPage(0);
      setConversation(null);
      setSelectedTicket(null);
      setFetchError(null);
      setTagging(null);
      setTaggingError(null);
    },
    [datasetKey],
  );

  const handleFetchConversation = useCallback(
    async (ticketId: number) => {
      setSelectedTicket(ticketId);
      setConversation(null);
      setFetchError(null);
      setLoadingConversation(true);
      try {
        const response = await fetch("/api/zendesk/ticket-conversation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subdomain: defaultSubdomain, ticketId }),
        });
        const data = await response.json();
        if (!response.ok || data?.ok === false) {
          throw new Error(data?.error || "Failed to fetch conversation");
        }
        setConversation({ transcript: data.transcript || [] });
      } catch (error) {
        setFetchError(error instanceof Error ? error.message : "Unknown error");
      } finally {
        setLoadingConversation(false);
      }
    },
    [defaultSubdomain],
  );

  const handleRunTagging = useCallback(
    async (ticketId: number) => {
      if (!taggingAllowed) {
        return;
      }
      setTagging(ticketId);
      setTaggingError(null);
      try {
        if (!currentCsv) {
          throw new Error("No CSV configured for this dataset");
        }
        const response = await fetch("/api/zendesk/tag-ticket", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            csv: currentCsv,
            subdomain: defaultSubdomain,
            ticketId,
          }),
        });
        const data = await response.json();
        if (!response.ok || data?.ok === false) {
          throw new Error(data?.error || "Failed to tag ticket");
        }
        // Reload the page to fetch updated CSV (simpler than diffing state for now)
        window.location.reload();
      } catch (error) {
        setTaggingError(error instanceof Error ? error.message : "Unknown tagging error");
      } finally {
        setTagging(null);
      }
    },
    [currentCsv, defaultSubdomain, taggingAllowed],
  );

  const closeConversation = useCallback(() => {
    setConversation(null);
    setSelectedTicket(null);
    setFetchError(null);
  }, []);

  useEffect(() => {
    if (!conversation) return undefined;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeConversation();
      }
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [conversation, closeConversation]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-white text-slate-900">
      <main className="mx-auto flex max-w-6xl gap-6 px-6 py-12 font-sans lg:px-10">
        <div className="transition-all duration-300 w-full">
          <header className="space-y-2" data-tour-id="dataset-controls">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Client View</p>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Zincwork Tagging Overview</h1>
              <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white/80 p-1 text-xs font-semibold text-slate-500 shadow-sm">
                {datasetEntries.map(([key, info]) => {
                  const isActive = key === datasetKey;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleDatasetChange(key)}
                      disabled={isActive}
                      aria-pressed={isActive}
                      className={`rounded-full px-3 py-1 transition ${
                        isActive
                          ? "bg-slate-900 text-white shadow-sm"
                          : "text-slate-600 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                      }`}
                    >
                      {info.label}
                    </button>
                  );
                })}
              </div>
            </div>
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm text-slate-600">
                  Showing {Math.min(PAGE_SIZE, pageRows.length).toLocaleString("en-US")} of {totalCount.toLocaleString("en-US")} tickets in{" "}
                  <span className="font-semibold text-slate-900">{currentDataset.label}</span> (
                  #{(pageStart + 1).toLocaleString("en-US")}–{Math.min(pageStart + PAGE_SIZE, totalCount).toLocaleString("en-US")}).
                </p>
              <div className="ml-auto flex items-center gap-3 text-xs">
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-500 shadow-sm">
                  Page {(page + 1).toLocaleString("en-US")} / {Math.max(1, Math.ceil(totalCount / PAGE_SIZE)).toLocaleString("en-US")}
                </span>
                <button
                  type="button"
                  disabled={!hasPrev}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border shadow-sm transition ${
                    hasPrev ? "border-slate-200 bg-white text-slate-600 hover:border-slate-300" : "border-slate-200 bg-slate-100 text-slate-400"
                  }`}
                >
                  ◀
                </button>
                <button
                  type="button"
                  disabled={!hasNext}
                  onClick={() => setPage((p) => p + 1)}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border shadow-sm transition ${
                    hasNext ? "border-slate-200 bg-white text-slate-600 hover:border-slate-300" : "border-slate-200 bg-slate-100 text-slate-400"
                  }`}
                >
                  ▶
                </button>
              </div>
            </div>
          </header>
          <div className="mt-6 space-y-4">
            {pageRows.map((row, index) => {
              const isFirstRow = index === 0;
              return (
              <article
                key={`${row.month}-${row.ticketId}`}
                className={`space-y-3 rounded-3xl border p-5 shadow-sm transition ${
                  selectedTicket === row.ticketId
                    ? "border-emerald-400 bg-emerald-50/40 shadow-md ring-2 ring-emerald-200"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-lg font-semibold text-slate-900">
                    Ticket {row.ticketId.toLocaleString("en-US").replace(/,/g, "")}
                  </div>
                  <div className="text-sm text-slate-500">{formatMonth(row.month)}</div>
                  <div className="ml-auto flex gap-2 text-xs">
                    <TooltipButton
                      type="button"
                      tooltip="Fetches raw conversation from Zendesk"
                      onClick={() => handleFetchConversation(row.ticketId)}
                      data-tour-id={isFirstRow ? "fetch-conversation" : undefined}
                      className={`rounded-full border px-4 py-2 font-semibold shadow-sm transition ${
                        selectedTicket === row.ticketId && loadingConversation
                          ? "border-slate-200 bg-slate-200 text-slate-500"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {selectedTicket === row.ticketId && loadingConversation ? "Loading…" : "Fetch conversation"}
                    </TooltipButton>
                    {taggingAllowed && (
                      <TooltipButton
                        type="button"
                        tooltip="This overwrites the CSV entry for this ticket"
                        onClick={() => handleRunTagging(row.ticketId)}
                        disabled={Boolean(tagging) && tagging !== row.ticketId}
                        className={`rounded-full border px-4 py-2 font-semibold shadow-sm transition ${
                          tagging === row.ticketId
                            ? "border-slate-200 bg-slate-200 text-slate-500"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {tagging === row.ticketId ? "Tagging…" : "Run tagging"}
                      </TooltipButton>
                    )}
                  </div>
                </div>
                <TagSummary tag={row.tags} dataTourId={isFirstRow ? "ticket-summary" : undefined} />
                <TagPills tag={row.tags} dataTourId={isFirstRow ? "ticket-tags" : undefined} />
                <TagReasoning tag={row.tags} dataTourId={isFirstRow ? "ticket-reasoning" : undefined} />
                {!row.tags && <p className="text-sm text-slate-500">Not tagged yet</p>}
                {taggingError && tagging === row.ticketId && (
                  <p className="text-xs text-rose-600">{taggingError}</p>
                )}
              </article>
            );
          })}
          </div>
        </div>
      </main>

      {conversation && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-4 py-6 sm:px-6">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            aria-hidden="true"
            onClick={closeConversation}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Conversation transcript"
            className="relative z-50 w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Conversation</h2>
                {selectedTicket && (
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Ticket {selectedTicket.toLocaleString("en-US").replace(/,/g, "")}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={closeConversation}
                className="text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Close
              </button>
            </div>
            {fetchError && <p className="mt-3 text-sm text-rose-600">{fetchError}</p>}
            <div className="mt-4 max-h-[70vh] space-y-3 overflow-y-auto pr-2">
              {conversation.transcript.length === 0 && !fetchError && (
                <p className="text-sm text-slate-500">No public messages.</p>
              )}
              {conversation.transcript.map((turn, index) => (
                <SpeakerBubble key={`${turn.created_at}-${turn.speaker}-${index}`} turn={turn} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
