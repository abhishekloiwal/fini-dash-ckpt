"use client";

import { useEffect, useMemo, useState } from "react";

const API_ENDPOINT = "https://api-prod.usefini.com/v2/bots/requests/public";
const FINI_API_KEY = process.env.NEXT_PUBLIC_FINI_API_KEY ?? "";

type ConversationRecord = {
  id: string;
  externalId: string | null;
  source: string | null;
  channel: string | null;
  escalation: boolean;
  hasLinks: boolean;
  feedbackType: string | null;
  expectingUserFollowup: boolean;
  userId?: string | null;
  url: string | null;
  categories: string[];
  createdAt: number;
  updatedAt: number;
  botRequests: Array<{
    id?: string;
    question?: string;
    answer?: string;
    categories?: string[];
    escalation?: boolean;
    reasoning?: string | null;
    feedbackType?: string | null;
    expectingUserFollowup?: boolean;
    createdAt?: number;
    basedOn?: Array<{
      id?: string | string[];
      title?: string;
      sourceId?: string;
      sourceType?: string;
      score?: number;
    }>;
  }>;
};

type ConversationsResponse = {
  conversations: ConversationRecord[];
  hasMore: boolean;
  cursor?: string | null;
};

type FilterState = {
  source: string;
  limit: number;
  includeEscalated: "all" | "escalated" | "non-escalated";
  startDate?: string;
  endDate?: string;
};

const SOURCE_OPTIONS = [
  { label: "All sources", value: "" },
  { label: "API", value: "api" },
  { label: "Widget", value: "widget" },
  { label: "Zendesk", value: "zendesk" },
  { label: "Slack", value: "slack" },
  { label: "Discord", value: "discord" },
  { label: "Intercom", value: "intercom" },
  { label: "UI", value: "ui" },
];

const ESCALATION_OPTIONS: FilterState["includeEscalated"][] = [
  "all",
  "escalated",
  "non-escalated",
];

type FetchStatus =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "success"; fetched: number; timestamp: number }
  | { state: "error"; message: string };

const formatEpoch = (value?: number) => {
  if (!value) return "Unknown";
  try {
    const date = new Date(value);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  } catch {
    return String(value);
  }
};

const toStartOfDayEpoch = (dateString?: string) => {
  if (!dateString) return undefined;
  const date = new Date(`${dateString}T00:00:00Z`);
  const time = date.getTime();
  return Number.isFinite(time) ? time : undefined;
};

const toEndOfDayEpoch = (dateString?: string) => {
  if (!dateString) return undefined;
  const date = new Date(`${dateString}T23:59:59.999Z`);
  const time = date.getTime();
  return Number.isFinite(time) ? time : undefined;
};

export default function ConversationsPage() {
  const [filters, setFilters] = useState<FilterState>({
    source: "",
    limit: 10,
    includeEscalated: "all",
    startDate: "",
    endDate: "",
  });
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [status, setStatus] = useState<FetchStatus>({ state: "idle" });
  const [showRaw, setShowRaw] = useState(false);
  const [rawResponse, setRawResponse] = useState<ConversationsResponse | null>(null);

  const handleFetch = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (!FINI_API_KEY) {
      setStatus({
        state: "error",
        message: "Fini API key missing. Set NEXT_PUBLIC_FINI_API_KEY in your environment.",
      });
      return;
    }
    setStatus({ state: "loading" });
    setShowRaw(false);

    const params = new URLSearchParams();
    params.set("limit", String(filters.limit));
    if (filters.source) {
      params.set("source", filters.source);
    }
    if (filters.includeEscalated === "escalated") {
      params.set("escalation", "true");
    } else if (filters.includeEscalated === "non-escalated") {
      params.set("escalation", "false");
    }
    const startEpoch = toStartOfDayEpoch(filters.startDate);
    const endEpoch = toEndOfDayEpoch(filters.endDate);
    if (typeof startEpoch === "number") {
      params.set("startEpoch", String(startEpoch));
    }
    if (typeof endEpoch === "number") {
      params.set("endEpoch", String(endEpoch));
    }

    try {
      const url = `${API_ENDPOINT}?${params.toString()}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${FINI_API_KEY}`,
        },
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(body || `Request failed with status ${response.status}`);
      }

      const data = (await response.json()) as ConversationsResponse;
      setConversations(data.conversations);
      setRawResponse(data);
      setStatus({
        state: "success",
        fetched: data.conversations.length,
        timestamp: Date.now(),
      });

      if (filters.includeEscalated !== "all") {
        const shouldInclude = filters.includeEscalated === "escalated";
        setConversations((current) =>
          current.filter((conversation) => conversation.escalation === shouldInclude),
        );
      }
    } catch (fetchError) {
      const message =
        fetchError instanceof Error ? fetchError.message : "Unknown error while fetching history.";
      setStatus({ state: "error", message });
    }
  };

  useEffect(() => {
    void handleFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summaryText = useMemo(() => {
    if (status.state === "loading") {
      return "Fetching conversations…";
    }
    if (status.state === "success") {
      const timestamp = new Date(status.timestamp).toLocaleTimeString();
      const pieces = [`Fetched ${status.fetched} conversations`, timestamp];
      if (filters.startDate || filters.endDate) {
        const range = `${filters.startDate ?? "…" } → ${filters.endDate ?? "today"}`;
        pieces.splice(1, 0, range);
      }
      return pieces.join(" · ");
    }
    if (status.state === "error") {
      return status.message;
    }
    return "Fetch conversation history from Fini";
  }, [status, filters.startDate, filters.endDate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-white text-slate-900">
      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-16 font-sans lg:px-8">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Conversation archives
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Recent Conversations
          </h1>
          <p className="text-sm text-slate-600">
            Fetch chat history from the Fini API. Use filters to narrow by source and escalation
            state. The API key is hardcoded; move to a secure store before production.
          </p>
        </header>

        <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-sm backdrop-blur">
          <form
            className="grid gap-4 md:grid-cols-[repeat(3,minmax(0,1fr))] xl:grid-cols-[repeat(5,minmax(0,1fr)),auto]"
            onSubmit={handleFetch}
          >
            <label className="grid gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Source
              <select
                value={filters.source}
                onChange={(event) => setFilters((current) => ({ ...current, source: event.target.value }))}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
              >
                {SOURCE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Result limit
              <input
                type="number"
                min={1}
                max={50}
                value={filters.limit}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    limit: Number(event.target.value),
                  }))
                }
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
            </label>

            <label className="grid gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Escalation filter
              <select
                value={filters.includeEscalated}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    includeEscalated: event.target.value as FilterState["includeEscalated"],
                  }))
                }
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
              >
                {ESCALATION_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option === "all"
                      ? "Show all"
                      : option === "escalated"
                        ? "Escalated only"
                        : "Non-escalated only"}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Start date
              <input
                type="date"
                value={filters.startDate ?? ""}
                max={filters.endDate ?? undefined}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    startDate: event.target.value,
                  }))
                }
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
            </label>

            <label className="grid gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
              End date
              <input
                type="date"
                value={filters.endDate ?? ""}
                min={filters.startDate ?? undefined}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    endDate: event.target.value,
                  }))
                }
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
            </label>

            <button
              type="submit"
              disabled={status.state === "loading"}
              className="self-end rounded-full bg-sky-600 px-6 py-2 text-sm font-semibold text-white shadow transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-sky-300"
            >
              {status.state === "loading" ? "Fetching…" : "Refresh"}
            </button>
          </form>
          <p className="text-xs text-slate-500">{summaryText}</p>
        </section>

        <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-sm backdrop-blur">
          {status.state === "error" ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {status.message}
            </div>
          ) : null}

          {!conversations.length && status.state !== "loading" ? (
            <div className="flex min-h-[12rem] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
              No conversations found for the current filters.
            </div>
          ) : null}

          <div className="grid gap-4">
            {conversations.map((conversation) => (
              <details
                key={`${conversation.id}-${conversation.updatedAt}`}
                className="rounded-2xl border border-slate-200 bg-white shadow-sm"
                open
              >
                <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{conversation.id}</p>
                    <p className="text-xs text-slate-500">
                      Source: {conversation.source ?? "unknown"} · Created:{" "}
                      {formatEpoch(conversation.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider">
                    <span
                      className={`rounded-full px-3 py-1 ${
                        conversation.escalation
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {conversation.escalation ? "Escalated" : "Resolved"}
                    </span>
                    {conversation.categories.length ? (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                        {conversation.categories.join(", ")}
                      </span>
                    ) : null}
                    {conversation.botRequests.length > 1 ? (
                      <span className="rounded-full bg-sky-100 px-3 py-1 text-sky-700">
                        Multi-turn
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-500">
                        Single-turn
                      </span>
                    )}
                  </div>
                </summary>
                <div className="border-t border-slate-100 p-4">
                  <div className="grid gap-4">
                    {conversation.botRequests
                      .map((request, originalIndex) => ({ request, originalIndex }))
                      .sort((a, b) => {
                        const timeA = a.request.createdAt ?? Number.MAX_SAFE_INTEGER;
                        const timeB = b.request.createdAt ?? Number.MAX_SAFE_INTEGER;
                        if (timeA === timeB) {
                          return a.originalIndex - b.originalIndex;
                        }
                        return timeA - timeB;
                      })
                      .map(({ request }, index) => {
                      const reasonsId = `${conversation.id}-${request.id ?? index}-reasoning`;
                      const sourcesId = `${conversation.id}-${request.id ?? index}-sources`;
                      return (
                        <div
                          key={`${conversation.id}-${request.id ?? index}`}
                          className="space-y-4"
                        >
                          <div className="flex flex-col gap-3">
                            <div className="self-start max-w-3xl">
                              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                  User message
                                </p>
                                <p className="mt-1 whitespace-pre-line leading-relaxed">
                                  {request.question ?? "Unknown question"}
                                </p>
                              </div>
                            </div>
                            <div className="self-end max-w-3xl">
                              <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-slate-700 shadow-sm">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-[10px] font-semibold uppercase tracking-wider text-sky-700">
                                    Fini reply · {formatEpoch(request.createdAt)}
                                  </p>
                                  <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                    <span>
                                      {request.escalation ? "Escalated" : "Resolved"} ·{" "}
                                      {request.categories?.join(", ") ?? "uncategorized"}
                                    </span>
                                    {request.feedbackType ? <span>{request.feedbackType}</span> : null}
                                  </div>
                                </div>
                                {request.answer ? (
                                  <p className="mt-2 whitespace-pre-line leading-relaxed">
                                    {request.answer}
                                  </p>
                                ) : (
                                  <p className="mt-2 italic text-slate-500">
                                    No assistant response recorded.
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                            {request.reasoning ? (
                              <button
                                type="button"
                                className="rounded-full border border-slate-200 bg-white px-3 py-1 shadow-sm transition hover:border-sky-300 hover:text-sky-600"
                                onClick={() => {
                                  const details = document.getElementById(reasonsId);
                                  details?.toggleAttribute("open");
                                }}
                              >
                                Toggle reasoning
                              </button>
                            ) : null}
                            {request.basedOn && request.basedOn.length ? (
                              <button
                                type="button"
                                className="rounded-full border border-slate-200 bg-white px-3 py-1 shadow-sm transition hover:border-sky-300 hover:text-sky-600"
                                onClick={() => {
                                  const details = document.getElementById(sourcesId);
                                  details?.toggleAttribute("open");
                                }}
                              >
                                Toggle sources ({request.basedOn.length})
                              </button>
                            ) : null}
                          </div>

                          {request.reasoning ? (
                            <details id={reasonsId} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                              <summary className="cursor-pointer text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                Reasoning
                              </summary>
                              <p className="mt-2 whitespace-pre-line leading-relaxed">
                                {request.reasoning}
                              </p>
                            </details>
                          ) : null}

                          {request.basedOn && request.basedOn.length ? (
                            <details id={sourcesId} className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-600">
                              <summary className="cursor-pointer text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                Knowledge sources ({request.basedOn.length})
                              </summary>
                              <div className="mt-3 space-y-2">
                                {request.basedOn.map((source, sourceIndex) => (
                                  <div
                                    key={`${conversation.id}-${request.id ?? index}-source-${sourceIndex}`}
                                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600"
                                  >
                                    <p className="font-semibold text-slate-700">
                                      {source.title ?? "Knowledge item"}
                                    </p>
                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wider text-slate-400">
                                      {source.sourceType ? <span>{source.sourceType}</span> : null}
                                      {typeof source.score === "number" ? (
                                        <span>Score {source.score.toFixed(3)}</span>
                                      ) : null}
                                      {typeof source.id === "string"
                                        ? <span>ID {source.id}</span>
                                        : Array.isArray(source.id)
                                          ? <span>IDs {source.id.join(", ")}</span>
                                          : null}
                                    </div>
                                    {source.sourceId ? (
                                      <a
                                        href={source.sourceId}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="mt-1 inline-flex break-all text-[11px] font-semibold text-sky-600 hover:text-sky-500"
                                      >
                                        {source.sourceId}
                                      </a>
                                    ) : null}
                                  </div>
                                ))}
                              </div>
                            </details>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </details>
            ))}
          </div>

          {rawResponse ? (
            <div className="grid gap-2">
              <button
                type="button"
                onClick={() => setShowRaw((current) => !current)}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-sky-300 hover:bg-slate-50"
              >
                <span>Raw API payload</span>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {showRaw ? "Hide" : "Show"}
                </span>
              </button>
              {showRaw ? (
                <pre className="max-h-[28rem] overflow-auto rounded-xl border border-slate-200 bg-slate-950/90 p-4 text-xs text-slate-100">
                  {JSON.stringify(rawResponse, null, 2)}
                </pre>
              ) : null}
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
