"use client";

import { useCallback, useMemo, useState } from "react";
import FiltersBar from "@/components/filters-bar";
import MetricCard from "@/components/metric-card";
import SimulationPanel, { type SandboxSettings, type SimulationSummaryStats } from "@/components/simulation-panel";
import TraceabilityExplorer from "@/components/traceability-explorer";
import DataSummary from "@/components/data-summary";
import {
  defaultFilters,
  getMetricsForFilters,
  type ChannelOption,
  type ConversationMessage,
  type ConversationRecord,
  type ConversationTimelineEvent,
  type FilterState,
} from "@/data/mockData";

const CONVERSATIONS_ENDPOINT = "https://api-prod.usefini.com/v2/bots/requests/public";
const ASK_ENDPOINT = "https://api-prod.usefini.com/v2/bots/ask-question";

type ApiConversation = {
  id: string;
  source?: string | null;
  channel?: string | null;
  escalation?: boolean;
  categories?: string[];
  createdAt?: number;
  updatedAt?: number;
  botRequests?: Array<{
    question?: string;
    answer?: string;
    reasoning?: string | null;
    escalation?: boolean;
    createdAt?: number;
  }>;
};

type ConversationsApiResponse = {
  conversations: ApiConversation[];
  hasMore: boolean;
  cursor?: string | null;
};

type ParsedKnowledge = {
  title?: string;
  sourceType?: string;
  sourceId?: string;
  question?: string;
  content?: string;
};

type SimulationRun = {
  answer: string;
  reasoning?: string;
  knowledge: ParsedKnowledge[];
  escalation: boolean;
  resolved: boolean;
  responseTimeMs: number;
  raw: FiniResponse;
  evaluation?: SimulationEvaluation;
};

type ConversationSample = {
  id: string;
  createdAt: number;
  source?: string | null;
  channel?: string | null;
  categories?: string[];
  question: string;
  answer: string;
  turns: number;
  botRequests: NonNullable<ApiConversation["botRequests"]>;
  history: ConversationMessage[];
  simulation?: SimulationRun;
};

type SimulationEvaluation = {
  intentUnderstood: boolean | null;
  resolutionReady: boolean | null;
  languageMatch: boolean | null;
  rationale?: string;
  // Human vs. human agent answer comparison
  comparisonTag?: "better" | "on_par" | "worse" | "different";
  comparisonRationale?: string;
};

type ParsedFunctionArgs = {
  response?: string;
  reasoning?: string;
  escalation?: string | boolean;
  [key: string]: unknown;
};

type FiniResponse = {
  answer?: string;
  answer_uuid?: string;
  based_on?: unknown;
  function_call?: {
    name?: string;
    arguments?: unknown;
  };
};

const formatPercentage = (passed: number, total: number): string => {
  if (!total) return "—";
  return `${Math.round((passed / total) * 100)}%`;
};

const formatHelper = (passed: number, total: number): string => {
  if (!total) return "Not evaluated";
  return `${passed}/${total} pass`;
};

export default function GenerateFromConversationsPage() {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const metrics = useMemo(() => getMetricsForFilters(filters), [filters]);
  const [isFetching, setIsFetching] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [simulationError, setSimulationError] = useState<string | null>(null);
  const [evaluationWarning, setEvaluationWarning] = useState<string | null>(null);
  const [samples, setSamples] = useState<ConversationSample[]>([]);

  const conversationPreviews = useMemo(
    () =>
      samples.map((sample) => ({
        id: sample.id,
        createdAt: sample.createdAt,
        question: sample.question,
        turns: sample.turns,
      })),
    [samples],
  );

  const comparisonRecords = useMemo(() => {
    return samples
      .filter((sample) => sample.turns <= 1 && sample.question)
      .map((sample) => buildConversationRecord(sample, filters.intent));
  }, [samples, filters.intent]);

  const summaryStats = useMemo<SimulationSummaryStats | null>(() => {
    const completed = samples.filter((sample) => sample.simulation);
    if (!completed.length) {
      return null;
    }
    const initial: SimulationSummaryStats = {
      total: 0,
      resolved: 0,
      grounded: 0,
      escalated: 0,
      predictedCsat: 4.7,
    };
    return completed.reduce((acc, sample) => {
      acc.total += 1;
      const run = sample.simulation!;
      if (run.resolved) acc.resolved += 1;
      if (run.knowledge.length > 0) acc.grounded += 1;
      if (run.escalation) acc.escalated += 1;
      return acc;
    }, initial);
  }, [samples]);

  const qualityStats = useMemo(() => {
    const completed = samples.filter((sample) => sample.simulation);
    if (!completed.length) return null;

    let evaluationCount = 0;
    let intentPass = 0;
    let resolutionPass = 0;
    let languagePass = 0;
    let parityCount = 0;
    let parityPass = 0; // on_par or better

    completed.forEach((sample) => {
      const run = sample.simulation!;
      const evaluation = run.evaluation;
      if (evaluation && evaluation.intentUnderstood !== null) {
        evaluationCount += 1;
        if (evaluation.intentUnderstood) intentPass += 1;
        if (evaluation.resolutionReady) resolutionPass += 1;
        if (evaluation.languageMatch) languagePass += 1;
      }
      if (evaluation && evaluation.comparisonTag) {
        parityCount += 1;
        if (evaluation.comparisonTag === "better" || evaluation.comparisonTag === "on_par") {
          parityPass += 1;
        }
      }
    });

    return {
      total: completed.length,
      evaluationCount,
      intentPass,
      resolutionPass,
      languagePass,
      parityPass,
      parityCount,
    } as const;
  }, [samples]);

  const evaluateWithOpenAi = useCallback(
    async (question: string, answer: string): Promise<SimulationEvaluation | null> => {
      const openAiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY ?? "";
      if (!openAiKey) {
        setEvaluationWarning((current) =>
          current ?? "OpenAI API key missing. Set NEXT_PUBLIC_OPENAI_API_KEY to enable quality checks.",
        );
        return null;
      }

      try {
        const systemPrompt =
          "You are grading a customer support assistant. Reply in JSON only with keys intent_understood, resolution_ready, language_match (values 'pass' or 'fail') and rationale." +
          "\n- intent_understood: PASS if the reply addresses the user's request." +
          "\n- resolution_ready: PASS if the reply gives the user a complete, actionable next step or clear confirmation that nothing else is needed." +
          "\n- language_match: PASS if the assistant responds in the same main language as the user unless the user asked for a different language.";

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openAiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-5-mini",
            messages: [
              { role: "system", content: systemPrompt },
              {
                role: "user",
                content: `User message:\n${question}\n\nAssistant reply:\n${answer}\n\nRespond with JSON only.`,
              },
            ],
          }),
        });

        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || `OpenAI judge failed (${response.status})`);
        }

        const data = (await response.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const raw = data.choices?.[0]?.message?.content?.trim() ?? "";
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("Judge response missing JSON");
        }
        const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
        const normalize = (value: unknown): boolean | null => {
          if (typeof value !== "string") return null;
          const normalized = value.trim().toLowerCase();
          if (normalized === "pass") return true;
          if (normalized === "fail") return false;
          return null;
        };

        setEvaluationWarning(null);

        return {
          intentUnderstood: normalize(parsed.intent_understood),
          resolutionReady: normalize(parsed.resolution_ready),
          languageMatch: normalize(parsed.language_match),
          rationale: typeof parsed.rationale === "string" ? parsed.rationale : undefined,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "LLM judge error";
        setEvaluationWarning(`Quality checks unavailable: ${message}`);
        return null;
      }
    },
    [setEvaluationWarning],
  );

  const evaluateComparisonWithOpenAi = useCallback(
    async (
      question: string,
      humanReply: string,
      finiReply: string,
    ): Promise<{ tag: "better" | "on_par" | "worse" | "different"; rationale: string } | null> => {
      const openAiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY ?? "";
      if (!openAiKey) {
        // don't override any existing warning here; the top call already sets it
        return null;
      }

      try {
        const systemPrompt =
          "Compare two support replies (Fini vs Human) to the same user request. " +
          "Reply in JSON only with keys: comparison ('better' | 'on_par' | 'worse' | 'different') and rationale." +
          "\nScoring rules (be conservative):" +
          "\n- better: Fini is clearly superior: more accurate, safer, and gives concrete next steps." +
          "\n- on_par: Minor differences only (tone, ordering, small omissions) — treat as parity by default." +
          "\n- worse: Use only if Fini is clearly incorrect, unsafe, or omits a critical action (strict)." +
          "\n- different: Both answers are valid but take materially different paths; neither strictly better.";

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openAiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-5-mini",
            messages: [
              { role: "system", content: systemPrompt },
              {
                role: "user",
                content: `User message:\n${question}\n\nHuman reply:\n${humanReply}\n\nFini reply:\n${finiReply}\n\nRespond with JSON only.`,
              },
            ],
          }),
        });

        if (!response.ok) {
          return null;
        }

        const data = (await response.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const raw = data.choices?.[0]?.message?.content?.trim() ?? "";
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;
        const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
        const tagRaw = typeof parsed.comparison === "string" ? parsed.comparison.trim().toLowerCase() : "";
        let tag = ["better", "on_par", "worse", "different"].includes(tagRaw)
          ? (tagRaw as "better" | "on_par" | "worse" | "different")
          : ("different" as const);
        const rationale = typeof parsed.rationale === "string" ? parsed.rationale : "";
        // Heuristic: downgrade WORSE to ON_PAR unless rationale cites clear faults.
        if (tag === "worse") {
          const r = rationale.toLowerCase();
          const strongSignals = [
            "incorrect",
            "inaccurate",
            "unsafe",
            "contradict",
            "wrong",
            "misleading",
            "omits",
            "missing key",
            "does not address",
            "no steps",
            "incomplete guidance",
          ];
          const hasStrong = strongSignals.some((s) => r.includes(s));
          if (!hasStrong) {
            tag = "on_par";
          }
        }
        return { tag, rationale };
      } catch {
        return null;
      }
    },
    [],
  );

  const handleFetchConversations = useCallback(
    async (settings: SandboxSettings) => {
      setFetchError(null);
      setSimulationError(null);
      setIsFetching(true);

      const apiKey = process.env.NEXT_PUBLIC_FINI_API_KEY ?? "";
      if (!apiKey) {
        setFetchError("Fini API key missing. Set NEXT_PUBLIC_FINI_API_KEY in your environment.");
        setIsFetching(false);
        return;
      }

      try {
        const requestedLimit = Math.max(1, Math.min(50, Math.floor(settings.conversationLimit)));
        const url = new URL(CONVERSATIONS_ENDPOINT);
        url.searchParams.set("limit", String(requestedLimit));
        if (settings.startDate) {
          const startEpoch = Date.parse(`${settings.startDate}T00:00:00Z`);
          if (Number.isFinite(startEpoch)) {
            url.searchParams.set("startEpoch", String(startEpoch));
          }
        }
        if (settings.endDate) {
          const endEpoch = Date.parse(`${settings.endDate}T23:59:59.999Z`);
          if (Number.isFinite(endEpoch)) {
            url.searchParams.set("endEpoch", String(endEpoch));
          }
        }

        const response = await fetch(url.toString(), {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        });

        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || `Request failed with status ${response.status}`);
        }

        const data = (await response.json()) as ConversationsApiResponse;
        const conversations = data.conversations ?? [];
        const singles = conversations.filter((conversation) => (conversation.botRequests?.length ?? 0) <= 1);
        const normalized = singles
          .slice(0, requestedLimit)
          .map((conversation) => normalizeConversation(conversation))
          .filter((sample): sample is ConversationSample => Boolean(sample));

        setSamples(normalized);
      } catch (error) {
        setFetchError(error instanceof Error ? error.message : "Failed to fetch conversations.");
        setSamples([]);
      } finally {
        setIsFetching(false);
      }
    },
    [],
  );

  const handleRunSimulation = useCallback(async () => {
      const apiKey = process.env.NEXT_PUBLIC_FINI_API_KEY ?? "";
      if (!apiKey) {
        setSimulationError(
          "Fini API key missing. Set NEXT_PUBLIC_FINI_API_KEY in your environment before running a simulation.",
        );
        return;
      }
      if (!samples.length) {
        setSimulationError("Fetch conversations before running a simulation.");
        return;
      }

      setIsSimulating(true);
      setSimulationError(null);
      setEvaluationWarning(null);

      let workingSamples = samples;

      for (const sample of samples) {
        if (!sample.question || sample.turns > 1) {
          continue;
        }

        const startedAt = performance.now();
        try {
          const response = await fetch(ASK_ENDPOINT, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              question: sample.question,
              messageHistory: [],
              temperature: 0.2,
            }),
          });

          if (!response.ok) {
            const message = await response.text();
            throw new Error(message || `Simulation failed with status ${response.status}`);
          }

          const data = (await response.json()) as FiniResponse;
          const parsedArgs = parseFunctionArguments(data.function_call?.arguments);
          const answer =
            (typeof data.answer === "string" ? data.answer.trim() : "") ||
            (typeof parsedArgs.response === "string" ? parsedArgs.response.trim() : "");

          const knowledge = parseKnowledgeList(data.based_on);
          const reasoning =
            typeof parsedArgs.reasoning === "string" ? parsedArgs.reasoning.trim() : undefined;
          const escalation = parseEscalationFlag(parsedArgs.escalation);

          const evaluation = await evaluateWithOpenAi(sample.question, answer);
          // Optional: compare against historical human agent response if available
          let comparisonTag: SimulationEvaluation["comparisonTag"] | undefined = undefined;
          let comparisonRationale: string | undefined = undefined;
          if (sample.answer && answer) {
            const cmp = await evaluateComparisonWithOpenAi(sample.question, sample.answer, answer);
            if (cmp) {
              comparisonTag = cmp.tag;
              comparisonRationale = cmp.rationale;
            }
          }

          const simulation: SimulationRun = {
            answer,
            reasoning,
            knowledge,
            escalation,
            resolved: !escalation && Boolean(answer),
            responseTimeMs: performance.now() - startedAt,
            raw: data,
            evaluation: evaluation
              ? {
                  ...evaluation,
                  comparisonTag,
                  comparisonRationale,
                }
              : comparisonTag || comparisonRationale
                ? { intentUnderstood: null, resolutionReady: null, languageMatch: null, comparisonTag, comparisonRationale }
                : undefined,
          };

          workingSamples = workingSamples.map((entry) =>
            entry.id === sample.id ? { ...entry, simulation } : entry,
          );
          setSamples(workingSamples);
        } catch (error) {
          setSimulationError(
            error instanceof Error ? error.message : "Simulation encountered an unexpected error.",
          );
          break;
        }
      }

      setIsSimulating(false);
    },
    [samples, evaluateWithOpenAi, evaluateComparisonWithOpenAi],
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-white text-slate-900">
      <main className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-12 font-sans lg:px-8 lg:py-16">
        <header className="rounded-3xl border border-slate-200 bg-white/80 p-10 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
                Simulate Fini on Your Past Conversations
              </h1>
              <p className="text-base text-slate-600 md:text-lg">
                Fetch past queries, replay them through Fini, and compare with human responses.
              </p>
            </div>
            <div className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-5 text-right text-sm text-slate-600 shadow-inner">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Current Coverage Snapshot
              </p>
              <p>
                <span className="text-3xl font-semibold text-slate-900">36%</span> fully resolved by Fini
              </p>
              <p>
                Average time to answer{" "}
                <span className="font-semibold text-slate-900">12 sec</span>
              </p>
              <p className="text-xs text-emerald-600">
                ↓ <span className="font-semibold">1m 12s</span> vs human agents
              </p>
              <p className="text-xs text-slate-500">Based on your last 3,000 connected conversations.</p>
            </div>
          </div>
        </header>

        <SimulationPanel
          fetchedConversations={conversationPreviews}
          isFetching={isFetching}
          fetchError={fetchError}
          isSimulating={isSimulating}
          simulationError={simulationError}
          onFetchConversations={handleFetchConversations}
          onRunSimulation={handleRunSimulation}
          summaryStats={summaryStats}
          qualityStats={qualityStats ?? undefined}
          evaluationWarning={evaluationWarning ?? undefined}
        />

        <TraceabilityExplorer filters={filters} records={comparisonRecords} />

        <section className="grid gap-6 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Performance Metrics</h2>
                <p className="text-sm text-slate-500">
                  Live comparison against historical benchmarks with applied filters.
                </p>
              </div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Filters: {filters.dateRange} · {filters.channel} · {filters.intent}
              </div>
            </div>
            <FiltersBar value={filters} onChange={setFilters} />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {metrics.map((metric) => (
              <MetricCard key={metric.label} metric={metric} />
            ))}
          </div>
        </section>

        <DataSummary />
      </main>
    </div>
  );
}

const normalizeConversation = (conversation: ApiConversation): ConversationSample | null => {
  const firstRequest = conversation.botRequests?.[0];
  const question = firstRequest?.question?.trim() ?? "";
  if (!question) {
    return null;
  }
  const answer = firstRequest?.answer?.trim() ?? "";

  const history: ConversationMessage[] = [
    { role: "Customer", message: question },
  ];
  if (answer) {
    history.push({ role: "Agent", message: answer });
  }

  return {
    id: conversation.id,
    createdAt: conversation.createdAt ?? Date.now(),
    source: conversation.source,
    channel: conversation.channel,
    categories: conversation.categories ?? [],
    question,
    answer,
    turns: conversation.botRequests?.length ?? 0,
    botRequests: conversation.botRequests ?? [],
    history,
  };
};

const buildConversationRecord = (
  sample: ConversationSample,
  intent: FilterState["intent"],
): ConversationRecord => {
  const simulation = sample.simulation;
  const preview = createPreview(sample.question, 6);
  const knowledgeLabels = simulation?.knowledge.map((entry) =>
    entry.title ?? entry.question ?? entry.sourceId ?? "Knowledge reference",
  );
  const knowledgeDetails = simulation?.knowledge.map((entry) => ({
    label: entry.title ?? entry.question ?? entry.sourceId ?? "Knowledge reference",
    content: entry.content,
    sourceType: entry.sourceType,
    sourceId: entry.sourceId,
    title: entry.title,
  }));

  const humanMessages: ConversationMessage[] = sample.history.length
    ? sample.history
    : [{ role: "Customer", message: sample.question }];

  const finiMessages: ConversationMessage[] = simulation
    ? [
        { role: "Customer", message: sample.question },
        {
          role: "Fini",
          message: simulation.answer || "Simulation returned an empty response.",
        },
      ]
    : [
        { role: "Customer", message: sample.question },
        { role: "Fini", message: "Run the simulation to view Fini’s reply." },
      ];

  const timeline: ConversationTimelineEvent[] = simulation
    ? [
        {
          label: "Simulation runtime",
          timestamp: "0ms",
          durationMs: Math.round(simulation.responseTimeMs),
          notes: simulation.escalation ? "Escalated" : "Resolved",
        },
      ]
    : [];

  const reasoningSummary = simulation
    ? {
        planning: simulation.reasoning ?? "Reasoning not provided by Fini.",
        knowledgeSearch: simulation.knowledge.length
          ? "Grounded in referenced knowledge"
          : "No knowledge references",
        responseStrategy: simulation.escalation
          ? "Escalated to a human agent."
          : "Answered directly by Fini.",
      }
    : {
        planning: "Run the simulation to inspect reasoning.",
        knowledgeSearch: "—",
        responseStrategy: "—",
      };

  return {
    id: sample.id,
    timestamp: new Date(sample.createdAt).toISOString(),
    customer: sample.source ?? "Historical user",
    source: sample.source,
    channel: normalizeChannel(sample.channel),
    language: "English",
    intent: intent,
    resolutionOutcome: simulation
      ? simulation.escalation
        ? "Escalated"
        : "Resolved"
      : "Pending",
    accuracyScore: simulation ? (simulation.knowledge.length ? 100 : 0) : 0,
    timeToResolve: simulation ? formatDuration(simulation.responseTimeMs) : undefined,
    escalationCorrect: !simulation?.escalation,
    confidence: 90,
    userQuery: sample.question,
    finiResponse: simulation?.answer ?? "",
    humanResponse: sample.answer,
    knowledgeUsed: knowledgeLabels ?? [],
    knowledgeDetails: knowledgeDetails ?? [],
    reasoningSummary,
    timeline,
    conversation: {
      human: humanMessages,
      fini: finiMessages,
    },
    categories: sample.categories,
    preview,
    evaluation: simulation?.evaluation,
  };
};

const normalizeChannel = (channel?: string | null): ChannelOption => {
  if (!channel) return "Chat";
  const normalized = channel.toLowerCase();
  if (normalized.includes("email")) return "Email";
  if (normalized.includes("whatsapp")) return "WhatsApp";
  return "Chat";
};

const parseFunctionArguments = (input: unknown): ParsedFunctionArgs => {
  if (!input) return {};
  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input) as ParsedFunctionArgs;
      return parsed ?? {};
    } catch {
      return {};
    }
  }
  if (typeof input === "object") {
    return input as ParsedFunctionArgs;
  }
  return {};
};

const parseKnowledgeList = (input: unknown): ParsedKnowledge[] => {
  if (!Array.isArray(input)) return [];
  const items = (input as unknown[])
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const ids = (record as any).id;
      let idLabel: string | undefined;
      if (typeof ids === "string" && ids.trim()) {
        idLabel = ids;
      } else if (Array.isArray(ids) && ids.length) {
        idLabel = ids.map((value) => String(value)).join(", ");
      }
      const contentCandidate =
        typeof (record as any).text === "string"
          ? (record as any).text
          : typeof (record as any).answer === "string"
            ? (record as any).answer
            : undefined;
      const parsed: ParsedKnowledge = {
        title:
          typeof record.title === "string" && record.title.trim()
            ? record.title
            : idLabel && !Number.isNaN(Number(idLabel))
              ? `Knowledge #${idLabel}`
              : idLabel,
        sourceType:
          typeof (record as any).source_type === "string"
            ? (record as any).source_type
            : typeof (record as any).sourceType === "string"
              ? (record as any).sourceType
              : undefined,
        sourceId:
          typeof (record as any).source_id === "string"
            ? (record as any).source_id
            : typeof (record as any).sourceId === "string"
              ? (record as any).sourceId
              : undefined,
        question: typeof record.question === "string" ? record.question : undefined,
        content: contentCandidate,
      };
      return parsed;
    })
    .filter((entry): entry is ParsedKnowledge => Boolean(entry));
  return items;
};

const parseEscalationFlag = (value: string | boolean | undefined): boolean => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return false;
};

const formatDuration = (ms: number): string => {
  if (!Number.isFinite(ms) || ms <= 0) return "—";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)} sec`;
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
};

type QualityCardProps = {
  label: string;
  value: string;
  helper: string;
};

function QualityCard({ label, value, helper }: QualityCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{helper}</p>
    </div>
  );
}

const createPreview = (text: string, maxWords: number): string => {
  const cleaned = text?.trim() ?? "";
  if (!cleaned) return "";
  const words = cleaned.split(/\s+/);
  if (words.length <= maxWords) {
    return cleaned;
  }
  return `${words.slice(0, maxWords).join(" ")}…`;
};
