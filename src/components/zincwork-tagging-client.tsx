"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "intro.js/introjs.css";
import {
  ProductReasoning,
  ProductTagPills,
  TagPills,
  TagReasoning,
  TagSummary,
  parseTagPayload,
} from "@/components/tag-display";

type Row = {
  month: string;
  ticketId: number;
  serviceTags: string | null;
  productTags: string | null;
  companyName: string | null;
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

type OutsideClickRef = { current: HTMLElement | null };

function useOutsideClick(ref: OutsideClickRef, handler: () => void, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return undefined;
    const listener = (event: MouseEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler();
    };
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [ref, handler, enabled]);
}

type FilterMultiSelectProps = {
  label: string;
  options: string[];
  selected: string[];
  disabled?: boolean;
  onChange: (values: string[]) => void;
};

function FilterMultiSelect({ label, options, selected, disabled, onChange }: FilterMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  useOutsideClick(containerRef, () => setOpen(false), open);

  const toggle = useCallback(
    (value: string) => {
      if (selected.includes(value)) {
        onChange(selected.filter((item) => item !== value));
      } else {
        onChange([...selected, value]);
      }
    },
    [onChange, selected],
  );

  const summary = selected.length === 0 ? "All" : selected.length === 1 ? selected[0] : `${selected.length} selected`;

  const mergedOptions = useMemo(() => {
    const set = new Set(options);
    selected.forEach((value) => set.add(value));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [options, selected]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2 text-sm font-normal shadow-inner transition ${
          disabled
            ? "border-slate-200 bg-slate-100 text-slate-400"
            : "border-slate-200 bg-white text-slate-900 hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
        }`}
        aria-label={label}
      >
        <span className="truncate">{summary}</span>
        <span className="ml-2 text-xs text-slate-500">{open ? "▲" : "▼"}</span>
      </button>
      {open && !disabled && (
        <div className="absolute z-20 mt-2 w-full rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
          <button
            type="button"
            className="mb-1 w-full rounded-xl px-2 py-1 text-left text-xs font-semibold text-emerald-600 hover:bg-emerald-50"
            onClick={() => onChange([])}
          >
            Clear selection
          </button>
          <div className="max-h-56 space-y-1 overflow-y-auto">
            {mergedOptions.map((option) => (
              <label
                key={option}
                className="flex items-center gap-2 rounded-xl px-2 py-1 text-sm text-slate-700 hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(option)}
                  onChange={() => toggle(option)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-200"
                />
                <span className="truncate">{option}</span>
              </label>
            ))}
            {!mergedOptions.length && <p className="px-2 py-1 text-sm text-slate-400">No options</p>}
          </div>
        </div>
      )}
    </div>
  );
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
    element: '[data-tour-id="filters"]',
    title: "Filters",
    intro: "Toggle open to focus on specific companies or taxonomy values.",
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

const SERVICE_SINGLE_FILTERS = ["user", "sentiment_service", "industry"] as const;
const SERVICE_MULTI_FILTERS = ["interaction", "tone", "conversation_dynamics"] as const;
const PRODUCT_MULTI_FILTERS = ["primary_checks", "check_sub_items", "platform"] as const;

type ServiceSingleFilter = (typeof SERVICE_SINGLE_FILTERS)[number];
type ServiceMultiFilter = (typeof SERVICE_MULTI_FILTERS)[number];
type ProductFilter = (typeof PRODUCT_MULTI_FILTERS)[number];

type FilterKey = ServiceSingleFilter | ServiceMultiFilter | ProductFilter | "company";

type FilterState = Record<FilterKey, string[]>;
type FilterOptions = Record<FilterKey, string[]>;

const FILTER_KEYS: FilterKey[] = [
  ...SERVICE_SINGLE_FILTERS,
  ...SERVICE_MULTI_FILTERS,
  ...PRODUCT_MULTI_FILTERS,
  "company",
];

const FILTER_LABELS: Record<FilterKey, string> = {
  company: "Company",
  user: "User",
  sentiment_service: "Sentiment",
  industry: "Industry",
  interaction: "Interaction",
  tone: "Tone",
  conversation_dynamics: "Conversation dynamics",
  primary_checks: "Primary checks",
  check_sub_items: "Check sub items",
  platform: "Platform",
};

const FILTER_GROUPS: Array<{ title: string; keys: FilterKey[] }> = [
  { title: "Company", keys: ["company"] },
  {
    title: "Service taxonomy",
    keys: [...SERVICE_SINGLE_FILTERS, ...SERVICE_MULTI_FILTERS],
  },
  {
    title: "Product taxonomy",
    keys: [...PRODUCT_MULTI_FILTERS],
  },
];

const getEmptyFilters = (): FilterState =>
  FILTER_KEYS.reduce(
    (acc, key) => {
      acc[key] = [];
      return acc;
    },
    {} as FilterState,
  );

const normalizeString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item): item is string => Boolean(item));
};

const collectFilterOptions = (rows: Row[]): FilterOptions => {
  const sets = FILTER_KEYS.reduce(
    (acc, key) => {
      acc[key] = new Set<string>();
      return acc;
    },
    {} as Record<FilterKey, Set<string>>,
  );

  rows.forEach((row) => {
    if (row.companyName) {
      sets.company.add(row.companyName);
    }
    const service = parseTagPayload(row.serviceTags);
    const product = parseTagPayload(row.productTags);

    SERVICE_SINGLE_FILTERS.forEach((field) => {
      const value = normalizeString(service?.[field]);
      if (value) sets[field].add(value);
    });

    SERVICE_MULTI_FILTERS.forEach((field) => {
      toStringArray(service?.[field]).forEach((value) => sets[field].add(value));
    });

    PRODUCT_MULTI_FILTERS.forEach((field) => {
      toStringArray(product?.[field]).forEach((value) => sets[field].add(value));
    });
  });

  return FILTER_KEYS.reduce(
    (acc, key) => {
      acc[key] = Array.from(sets[key]).sort((a, b) => a.localeCompare(b));
      return acc;
    },
    {} as FilterOptions,
  );
};

const rowMatchesFilters = (row: Row, filters: FilterState): boolean => {
  if (filters.company.length && (!row.companyName || !filters.company.includes(row.companyName))) {
    return false;
  }

  const service = parseTagPayload(row.serviceTags);
  const product = parseTagPayload(row.productTags);

  const checkSingle = (field: ServiceSingleFilter, source: Record<string, unknown> | null) => {
    const filterValues = filters[field];
    if (!filterValues.length) return true;
    const value = normalizeString(source?.[field]);
    if (!value) return false;
    return filterValues.includes(value);
  };

  const checkArray = (
    field: ServiceMultiFilter | ProductFilter,
    source: Record<string, unknown> | null,
  ) => {
    const filterValues = filters[field];
    if (!filterValues.length) return true;
    const values = toStringArray(source?.[field]);
    if (!values.length) return false;
    return values.some((value) => filterValues.includes(value));
  };

  if (
    !SERVICE_SINGLE_FILTERS.every((field) => checkSingle(field, service)) ||
    !SERVICE_MULTI_FILTERS.every((field) => checkArray(field, service)) ||
    !PRODUCT_MULTI_FILTERS.every((field) => checkArray(field, product))
  ) {
    return false;
  }

  return true;
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
  const PAGE_SIZE = 100;
  const [datasetKey, setDatasetKey] = useState<keyof DatasetMap>(defaultDataset);
  const [page, setPage] = useState(0);
  const [selectedTicket, setSelectedTicket] = useState<number | null>(null);
  const [conversation, setConversation] = useState<ConversationPayload | null>(null);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [tagging, setTagging] = useState<number | null>(null);
  const [taggingError, setTaggingError] = useState<string | null>(null);
  const [tourReady, setTourReady] = useState(false);
  const [filters, setFilters] = useState<FilterState>(() => getEmptyFilters());
  const [filtersExpanded, setFiltersExpanded] = useState(false);
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
  const datasetEntries = Object.entries(datasets) as Array<[keyof DatasetMap, DatasetInfo]>;

  const currentFilterOptions = useMemo(() => collectFilterOptions(currentDataset.rows), [currentDataset.rows]);

  const hasActiveFilters = useMemo(() => FILTER_KEYS.some((key) => filters[key].length > 0), [filters]);
  const activeFilterCount = useMemo(
    () => FILTER_KEYS.reduce((count, key) => count + (filters[key].length ? 1 : 0), 0),
    [filters],
  );

  const filteredRows = useMemo(() => {
    if (!hasActiveFilters) {
      return currentDataset.rows;
    }
    return currentDataset.rows.filter((row) => rowMatchesFilters(row, filters));
  }, [currentDataset.rows, filters, hasActiveFilters]);

  const totalCount = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const maxPageIndex = totalPages - 1;
  const safePage = Math.min(page, maxPageIndex);
  const pageStart = safePage * PAGE_SIZE;
  const pageRows = filteredRows.slice(pageStart, pageStart + PAGE_SIZE);
  const rangeStart = totalCount === 0 ? 0 : pageStart + 1;
  const rangeEnd = totalCount === 0 ? 0 : Math.min(pageStart + PAGE_SIZE, totalCount);
  const hasPrev = safePage > 0;
  const hasNext = safePage < maxPageIndex;

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

  useEffect(() => {
    setPage((prev) => (prev > maxPageIndex ? maxPageIndex : prev));
  }, [maxPageIndex]);

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

  const handleFilterChange = useCallback((key: FilterKey, values: string[]) => {
    const normalized = Array.from(new Set(values)).filter(Boolean);
    setFilters((prev) => {
      const prevValue = prev[key];
      if (prevValue.length === normalized.length && prevValue.every((value) => normalized.includes(value))) {
        return prev;
      }
      return { ...prev, [key]: normalized };
    });
    setPage(0);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(getEmptyFilters());
    setPage(0);
  }, []);

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
                  #{rangeStart.toLocaleString("en-US")}–{rangeEnd.toLocaleString("en-US")}).
                </p>
              <div className="ml-auto flex items-center gap-3 text-xs">
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-500 shadow-sm">
                  Page {(safePage + 1).toLocaleString("en-US")} / {totalPages.toLocaleString("en-US")}
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
          <section className="mt-6 rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm" data-tour-id="filters">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-sm font-semibold text-slate-800">Filters</h2>
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {activeFilterCount ? `${activeFilterCount} active` : "None active"}
              </span>
              <div className="ml-auto flex items-center gap-3 text-xs font-semibold uppercase tracking-wide">
                <button
                  type="button"
                  onClick={clearFilters}
                  disabled={!hasActiveFilters}
                  className={hasActiveFilters ? "text-emerald-600 hover:text-emerald-700" : "text-slate-400"}
                >
                  Clear filters
                </button>
                <button
                  type="button"
                  onClick={() => setFiltersExpanded((prev) => !prev)}
                  className="text-slate-600 hover:text-slate-900"
                >
                  {filtersExpanded ? "Hide filters" : "Show filters"}
                </button>
              </div>
            </div>
            {filtersExpanded && (
              <div className="mt-4 space-y-5">
                {FILTER_GROUPS.map((group) => (
                  <div key={group.title} className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      {group.title}
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {group.keys.map((key) => {
                        const options = currentFilterOptions[key] || [];
                        const disabled = options.length === 0 && filters[key].length === 0;
                        return (
                          <div key={key} className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
                            <span>{FILTER_LABELS[key]}</span>
                            <FilterMultiSelect
                              label={FILTER_LABELS[key]}
                              options={options}
                              selected={filters[key]}
                              disabled={disabled}
                              onChange={(values) => handleFilterChange(key, values)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
          <div className="mt-6 space-y-4">
            {pageRows.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-600 shadow-sm">
                No tickets match the selected filters.
              </div>
            ) : (
              pageRows.map((row, index) => {
                const isFirstRow = index === 0;
                const hasServiceTags = Boolean(row.serviceTags);
                const companyName = row.companyName?.trim();
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
                      {companyName ? (
                        <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                          <span className="text-[10px] uppercase tracking-wide text-slate-500">Company</span>
                          <span>{companyName}</span>
                        </span>
                      ) : null}
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
                    <TagSummary tag={row.serviceTags} dataTourId={isFirstRow ? "ticket-summary" : undefined} />
                    <TagPills tag={row.serviceTags} dataTourId={isFirstRow ? "ticket-tags" : undefined} />
                    <TagReasoning tag={row.serviceTags} dataTourId={isFirstRow ? "ticket-reasoning" : undefined} />
                    {!hasServiceTags && <p className="text-sm text-slate-500">Not tagged yet</p>}
                    {row.productTags ? (
                      <div className="mt-4 space-y-3" data-tour-id={isFirstRow ? "product-tags" : undefined}>
                        <ProductTagPills tag={row.productTags} />
                        <ProductReasoning tag={row.productTags} />
                      </div>
                    ) : null}
                    {taggingError && tagging === row.ticketId && (
                      <p className="text-xs text-rose-600">{taggingError}</p>
                    )}
                  </article>
                );
              })
            )}
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
