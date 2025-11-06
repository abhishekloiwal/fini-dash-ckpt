"use client";

import { useEffect, useMemo, useState } from "react";
import type { IntentOption } from "@/data/mockData";
import { simulationData } from "@/data/mockData";

export const conversationTypes = [
  "Single-turn only",
  "Multi-turn (simulated human responses)",
] as const;

export type SandboxSettings = {
  selectedIntents: IntentOption[];
  conversationType: (typeof conversationTypes)[number];
  useSimulatedApi: boolean;
  startDate: string;
  endDate: string;
  conversationLimit: number;
};

export type SimulationSummaryStats = {
  total: number;
  resolved: number;
  grounded: number;
  escalated: number;
  predictedCsat?: number;
};

type ConversationPreview = {
  id: string;
  createdAt?: number;
  question: string;
  turns: number;
};

type SimulationPanelProps = {
  fetchedConversations: ConversationPreview[];
  isFetching: boolean;
  fetchError: string | null;
  isSimulating: boolean;
  onFetchConversations: (settings: SandboxSettings) => void;
  onRunSimulation: (settings: SandboxSettings) => void;
  onSettingsChange?: (settings: SandboxSettings) => void;
  simulationError?: string | null;
  initialSettings?: Partial<SandboxSettings>;
  summaryStats?: SimulationSummaryStats | null;
  initialConversationLimit?: number;
  qualityStats?: {
    total: number;
    evaluationCount: number;
    intentPass: number;
    resolutionPass: number;
    languagePass: number;
    parityPass: number;
    parityCount: number;
  } | null;
  evaluationWarning?: string | null;
};

const SimulationPanel = ({
  fetchedConversations,
  isFetching,
  fetchError,
  isSimulating,
  onFetchConversations,
  onRunSimulation,
  onSettingsChange,
  simulationError,
  initialSettings,
  summaryStats,
  initialConversationLimit,
  qualityStats,
  evaluationWarning,
}: SimulationPanelProps) => {
  const intentOptions = useMemo(
    () => Array.from(new Set(simulationData.map((entry) => entry.intent))) as IntentOption[],
    [],
  );
  const filteredIntentOptions = useMemo(
    () => intentOptions.filter((intent) => intent !== "All Intents"),
    [intentOptions],
  );
  const intentChoices = filteredIntentOptions.length > 0 ? filteredIntentOptions : intentOptions;

  const defaultEnd = useMemo(() => {
    const now = new Date();
    return now.toISOString().slice(0, 10);
  }, []);
  const defaultStart = useMemo(() => {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 30);
    return endDate.toISOString().slice(0, 10);
  }, []);

  const [selectedIntents, setSelectedIntents] = useState<IntentOption[]>(
    initialSettings?.selectedIntents ?? intentChoices,
  );
  const [conversationType, setConversationType] = useState<(typeof conversationTypes)[number]>(
    initialSettings?.conversationType ?? conversationTypes[0],
  );
  const [useSimulatedApi, setUseSimulatedApi] = useState<boolean>(
    initialSettings?.useSimulatedApi ?? false,
  );
  const [startDate, setStartDate] = useState<string>(initialSettings?.startDate ?? defaultStart);
  const [endDate, setEndDate] = useState<string>(initialSettings?.endDate ?? defaultEnd);
  const [conversationLimit, setConversationLimit] = useState<number>(
    initialConversationLimit ?? 25,
  );

  useEffect(() => {
    const settings: SandboxSettings = {
      selectedIntents,
      conversationType,
      useSimulatedApi,
      startDate,
      endDate,
      conversationLimit,
    };
    onSettingsChange?.(settings);
  }, [
    selectedIntents,
    conversationType,
    useSimulatedApi,
    startDate,
    endDate,
    conversationLimit,
    onSettingsChange,
  ]);

  const datasetLabel = simulationData[0]?.dataset ?? "Historic Zendesk Conversations";
  const displayIntents = selectedIntents.length ? selectedIntents : [intentChoices[0]];
  const resolvedCount = summaryStats?.resolved ?? 0;
  const groundedCount = summaryStats?.grounded ?? 0;
  const escalatedCount = summaryStats?.escalated ?? 0;
  const totalRuns = summaryStats?.total ?? 0;
  const hasStats = totalRuns > 0;

  const resolutionRate = hasStats
    ? `${Math.round((resolvedCount / totalRuns) * 100)}%`
    : "—";
  const resolutionHelper = hasStats
    ? `${resolvedCount}/${totalRuns} solved without human handoffs`
    : "Run a simulation to populate this metric.";

  const factualAccuracy = hasStats
    ? `${Math.round((groundedCount / totalRuns) * 100)}%`
    : "—";
  const accuracyHelper = hasStats
    ? `${groundedCount}/${totalRuns} grounded in verified knowledge`
    : "Run a simulation to populate this metric.";

  const predictedCsat = hasStats && summaryStats?.predictedCsat
    ? `${summaryStats.predictedCsat.toFixed(1)} / 5`
    : hasStats
      ? "0.0 / 5"
      : "—";

  const escalationRate = hasStats
    ? `${Math.round((escalatedCount / totalRuns) * 100)}%`
    : "—";
  const escalationHelper = hasStats
    ? `${escalatedCount}/${totalRuns} escalated`
    : "Run a simulation to populate this metric.";

  const pct = (passed: number, total: number) => {
    if (!total) return "—";
    return `${Math.round((passed / total) * 100)}%`;
  };
  const ratio = (passed: number, total: number) => {
    if (!total) return "Not evaluated";
    return `${passed}/${total} pass`;
  };

  const handleFetchClick = () => {
    const settings: SandboxSettings = {
      selectedIntents,
      conversationType,
      useSimulatedApi,
      startDate,
      endDate,
      conversationLimit,
    };
    onFetchConversations(settings);
  };

  const handleRunClick = () => {
    const settings: SandboxSettings = {
      selectedIntents,
      conversationType,
      useSimulatedApi,
      startDate,
      endDate,
      conversationLimit,
    };
    onRunSimulation(settings);
  };

  return (
    <section className="grid gap-6 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Simulation Sandbox</h2>
          <p className="text-sm text-slate-500">
            Evaluate how Fini handles scenarios based on your historical conversations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleFetchClick}
            disabled={isFetching}
            className="rounded-full border border-sky-200 bg-white px-5 py-2 text-sm font-semibold text-sky-600 shadow-sm transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
          >
            {isFetching ? "Fetching…" : "Fetch conversations"}
          </button>
          <button
            type="button"
            onClick={handleRunClick}
            disabled={isSimulating || !fetchedConversations.length}
            className="rounded-full bg-sky-600 px-6 py-2 text-sm font-semibold text-white shadow transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-sky-300"
          >
            {isSimulating ? "Running..." : "Run simulation"}
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-5">
        <ChoiceGroup
          label="Intent / Tag"
          values={selectedIntents}
          options={intentChoices}
          onToggle={(intent) => {
            setSelectedIntents((current) => {
              const exists = current.includes(intent as IntentOption);
              if (exists) {
                const updated = current.filter((item) => item !== intent);
                return updated.length ? updated : [intent as IntentOption];
              }
              return [intent as IntentOption, ...current];
            });
          }}
          multi
        />
        <ChoiceGroup
          label="Conversation Type"
          values={[conversationType]}
          options={conversationTypes}
          onToggle={(option) =>
            setConversationType(option as (typeof conversationTypes)[number])
          }
        />
        <ChoiceGroup
          label="Use simulated API calls"
          values={[useSimulatedApi ? "Enabled" : "Disabled"]}
          options={["Enabled", "Disabled"]}
          onToggle={(option) => setUseSimulatedApi(option === "Enabled")}
        />
        <ConversationLimitField
          label="Number of conversations"
          value={conversationLimit}
          onChange={(next) => setConversationLimit(next)}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <DateField label="Start date" value={startDate} onChange={setStartDate} />
        <DateField label="End date" value={endDate} onChange={setEndDate} />
      </div>

      <p className="rounded-xl bg-sky-50 px-5 py-3 text-sm text-sky-700">
        Using {datasetLabel} · {displayIntents.join(", ")} · {conversationType} · Limit{" "}
        {conversationLimit} · Simulated API{" "}
        {useSimulatedApi ? "enabled" : "off"} · Date range {startDate || "—"} → {endDate || "—"}
      </p>

      <div className="grid gap-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
          Key Outcomes
        </h3>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Resolution Rate"
            value={resolutionRate}
            helper={resolutionHelper}
          />
          <SummaryCard
            label="Factual Accuracy"
            value={factualAccuracy}
            helper={accuracyHelper}
          />
          <SummaryCard
            label="Predicted CSAT"
            value={predictedCsat}
            helper="Modeled sentiment versus baseline"
          />
          <SummaryCard
            label="Escalation Rate"
            value={escalationRate}
            helper={escalationHelper}
          />
        </div>
        {(() => {
          const q = qualityStats ?? {
            total: 0,
            evaluationCount: 0,
            intentPass: 0,
            resolutionPass: 0,
            languagePass: 0,
            parityPass: 0,
            parityCount: 0,
          };
          return (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <SummaryCard
                label="Intent understood"
                value={pct(q.intentPass, q.evaluationCount)}
                helper={ratio(q.intentPass, q.evaluationCount)}
              />
              <SummaryCard
                label="Resolution-ready"
                value={pct(q.resolutionPass, q.evaluationCount)}
                helper={ratio(q.resolutionPass, q.evaluationCount)}
              />
              <SummaryCard
                label="Language match"
                value={pct(q.languagePass, q.evaluationCount)}
                helper={ratio(q.languagePass, q.evaluationCount)}
              />
              <SummaryCard
                label="Human parity"
                value={pct(q.parityPass, q.parityCount || q.total)}
                helper={q.parityCount ? ratio(q.parityPass, q.parityCount) : "No human replies available"}
              />
              {evaluationWarning ? (
                <div className="col-span-full rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  {evaluationWarning}
                </div>
              ) : null}
            </div>
          );
        })()}
        <p className="text-xs text-slate-400">
          Metrics compare against your historical agents for the same filters.
        </p>
      </div>

      {(fetchError || simulationError) && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {fetchError ?? simulationError}
        </div>
      )}

      {(isFetching || fetchedConversations.length > 0) && (
        <details className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm" open>
          <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold uppercase tracking-wider text-slate-500">
            Fetched Conversations (preview)
            {isFetching ? (
              <span className="text-xs font-medium text-slate-500">Loading…</span>
            ) : (
              <span className="text-xs font-medium text-slate-500">
                {fetchedConversations.length} items
              </span>
            )}
          </summary>
          {!isFetching && fetchedConversations.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">
              No conversations fetched yet. Use the button above to pull a sample from your history.
            </p>
          ) : null}
          {fetchedConversations.length > 0 && (
            <div className="mt-4 space-y-3">
              {fetchedConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-wide text-slate-500">
                    <span>Conversation · {conversation.id.slice(0, 8)}</span>
                    <span>
                      {conversation.createdAt
                        ? new Date(conversation.createdAt).toLocaleString()
                        : "Unknown timestamp"}
                    </span>
                    <span>
                      {conversation.turns} turn{conversation.turns === 1 ? "" : "s"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-700">
                    {conversation.question || "No question captured in this transcript."}
                  </p>
                </div>
              ))}
            </div>
          )}
        </details>
      )}
    </section>
  );
};

type SummaryCardProps = {
  label: string;
  value: string;
  helper: string;
};

const SummaryCard = ({ label, value, helper }: SummaryCardProps) => (
  <div className="rounded-xl border border-slate-100 bg-white/90 p-4 shadow-sm">
    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
    <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    <p className="text-xs text-slate-500">{helper}</p>
  </div>
);

type ChoiceGroupProps = {
  label: string;
  values: ReadonlyArray<string>;
  options: ReadonlyArray<string>;
  onToggle: (option: string) => void;
  multi?: boolean;
};

const ChoiceGroup = ({ label, values, options, onToggle, multi = false }: ChoiceGroupProps) => {
  const inputType = multi ? "checkbox" : "radio";
  const name = label.replace(/\s+/g, "-").toLowerCase();

  return (
    <div className="space-y-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
      <span>{label}</span>
      <div className="flex flex-col gap-2">
        {options.map((option) => {
          const isActive = values.includes(option);
          return (
            <label
              key={option}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                isActive
                  ? "border-sky-500 bg-white text-sky-700"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              <input
                type={inputType}
                name={multi ? undefined : name}
                checked={isActive}
                onChange={() => onToggle(option)}
                className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <span className="text-xs font-semibold">{option}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
};

type DateFieldProps = {
  label: string;
  value: string;
  onChange: (next: string) => void;
};

const DateField = ({ label, value, onChange }: DateFieldProps) => (
  <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
    <span>{label}</span>
    <input
      type="date"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-inner focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
    />
  </label>
);

type ConversationLimitFieldProps = {
  label: string;
  value: number;
  onChange: (next: number) => void;
};

const ConversationLimitField = ({ label, value, onChange }: ConversationLimitFieldProps) => (
  <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
    <span>{label}</span>
    <input
      type="number"
      min={1}
      max={50}
      value={value}
      onChange={(event) => {
        const parsed = Number(event.target.value);
        if (Number.isNaN(parsed)) {
          onChange(25);
          return;
        }
        const clamped = Math.max(1, Math.min(50, parsed));
        onChange(clamped);
      }}
      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-inner focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
    />
    <span className="text-[10px] uppercase tracking-wider text-slate-400">
      Default 25 · Max 50
    </span>
  </label>
);

export default SimulationPanel;
