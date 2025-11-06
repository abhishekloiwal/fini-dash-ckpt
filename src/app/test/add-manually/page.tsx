"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  Loader2,
  MessageSquareText,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react";

const API_ENDPOINT = "https://api-prod.usefini.com/v2/bots/ask-question";
const FINI_API_KEY = process.env.NEXT_PUBLIC_FINI_API_KEY ?? "";

const MAX_MANUAL_QUESTIONS = 25;

type ManualRow = {
  id: string;
  text: string;
};

type ParsedKnowledge = {
  title?: string;
  sourceType?: string;
  sourceId?: string;
  question?: string;
};

type ParsedFunctionArguments = {
  response?: string;
  reasoning?: string;
  escalation?: string | boolean;
  [key: string]: unknown;
};

type FiniResponse = {
  answer?: string;
  based_on?: unknown;
  function_call?: {
    arguments?: unknown;
  };
};

type SimulationResult = {
  question: string;
  answer: string;
  reasoning?: string;
  escalation: boolean;
  resolved: boolean;
  knowledge: ParsedKnowledge[];
  responseTimeMs: number;
  error?: string;
};

const parseFunctionArguments = (input: unknown): ParsedFunctionArguments => {
  if (!input) return {};
  if (typeof input === "string") {
    try {
      return (JSON.parse(input) as ParsedFunctionArguments) ?? {};
    } catch {
      return {};
    }
  }
  if (typeof input === "object") return input as ParsedFunctionArguments;
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
      };
      return parsed;
    })
    .filter((item): item is ParsedKnowledge => Boolean(item));
  return items;
};

const parseEscalationFlag = (value: string | boolean | undefined): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return false;
};

const formatDuration = (ms: number): string => {
  if (!Number.isFinite(ms) || ms < 0) return "—";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
};

const createBlankRows = (count: number): ManualRow[] =>
  Array.from({ length: count }, (_, idx) => ({
    id: `row-${Date.now()}-${idx}`,
    text: "",
  }));

export default function AddManuallyPage() {
  const [rows, setRows] = useState<ManualRow[]>(createBlankRows(4));
  const [showModal, setShowModal] = useState(true);
  const [questions, setQuestions] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [simulationError, setSimulationError] = useState<string | null>(null);
  const [simulationState, setSimulationState] = useState<"idle" | "running" | "completed">("idle");
  const [progress, setProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [results, setResults] = useState<Array<SimulationResult | undefined>>([]);

  const handleRowChange = useCallback((id: string, value: string) => {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, text: value } : row)),
    );
  }, []);

  const handleRowRemove = useCallback((id: string) => {
    setRows((current) => {
      const filtered = current.filter((row) => row.id !== id);
      return filtered.length ? filtered : createBlankRows(1);
    });
  }, []);

  const handleAddRow = useCallback(() => {
    setRows((current) => {
      if (current.length >= MAX_MANUAL_QUESTIONS) return current;
      return [...current, { id: `row-${Date.now()}`, text: "" }];
    });
  }, []);

  const handleSaveQuestions = useCallback(() => {
    const cleaned = rows
      .map((row) => row.text.trim())
      .filter((text, index, array) => text && array.indexOf(text) === index)
      .slice(0, MAX_MANUAL_QUESTIONS);

    if (!cleaned.length) {
      setFormError("Add at least one question before saving.");
      return;
    }

    setFormError(null);
    setQuestions(cleaned);
    setShowModal(false);
    setResults([]);
    setSimulationState("idle");
    setProgress({ current: 0, total: 0 });
  }, [rows]);

  const handleOpenEditor = useCallback(() => {
    setRows((current) => (current.length ? current : createBlankRows(1)));
    setShowModal(true);
    setFormError(null);
  }, []);

  const handleSimulate = useCallback(async () => {
    if (!questions.length) return;
    if (!FINI_API_KEY) {
      setSimulationError("Fini API key missing. Set NEXT_PUBLIC_FINI_API_KEY in your environment.");
      return;
    }
    setSimulationError(null);
    setSimulationState("running");
    setProgress({ current: 0, total: questions.length });
    setResults(Array(questions.length).fill(undefined));

    const simulate = async (question: string): Promise<SimulationResult> => {
      const startedAt = performance.now();
      try {
        const response = await fetch(API_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${FINI_API_KEY}`,
          },
          body: JSON.stringify({
            question,
            messageHistory: [],
            temperature: 0.2,
          }),
        });
        const duration = performance.now() - startedAt;

        if (!response.ok) {
          return {
            question,
            answer: "",
            reasoning: "",
            escalation: false,
            resolved: false,
            knowledge: [],
            responseTimeMs: duration,
            error: `HTTP ${response.status}`,
          };
        }

        const data = (await response.json()) as FiniResponse;
        const parsedArgs = parseFunctionArguments(data.function_call?.arguments);
        const answer =
          (typeof data.answer === "string" ? data.answer.trim() : "") ||
          (typeof parsedArgs.response === "string" ? parsedArgs.response.trim() : "");

        return {
          question,
          answer,
          reasoning:
            typeof parsedArgs.reasoning === "string" ? parsedArgs.reasoning.trim() : undefined,
          escalation: parseEscalationFlag(parsedArgs.escalation),
          resolved: !parseEscalationFlag(parsedArgs.escalation) && Boolean(answer),
          knowledge: parseKnowledgeList(data.based_on),
          responseTimeMs: duration,
        };
      } catch (err) {
        return {
          question,
          answer: "",
          reasoning: "",
          escalation: false,
          resolved: false,
          knowledge: [],
          responseTimeMs: performance.now() - startedAt,
          error: err instanceof Error ? err.message : "Unknown error",
        };
      }
    };
    for (let index = 0; index < questions.length; index += 1) {
      const question = questions[index];
      const result = await simulate(question);
      setResults((previous) => {
        const next = [...previous];
        next[index] = result;
        return next;
      });
      setProgress({ current: index + 1, total: questions.length });
    }

    setSimulationState("completed");
  }, [questions]);

  const summary = useMemo(() => {
    if (!results.length) return null;
    const completed = results.filter((item): item is SimulationResult => Boolean(item));
    if (!completed.length) return null;
    const total = results.length;
    const resolved = completed.filter((item) => item.resolved).length;
    const escalated = completed.filter((item) => item.escalation).length;
    const errors = completed.filter((item) => item.error).length;
    const averageDuration =
      completed.reduce((acc, item) => acc + item.responseTimeMs, 0) / Math.max(completed.length, 1);
    const grounded = completed.filter((item) => item.knowledge.length > 0).length;
    const reasoningProvided = completed.filter((item) => item.reasoning && item.reasoning.length > 0).length;
    return {
      total,
      completed: completed.length,
      resolved,
      escalated,
      errors,
      averageDuration,
      grounded,
      reasoningProvided,
      resolutionReady: resolved,
    };
  }, [results]);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[#f5f7fb] via-white to-white px-6 py-12 text-slate-900 md:px-10 lg:px-16">
      <header className="mx-auto mb-10 flex w-full max-w-6xl flex-col gap-3">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <Link
            href="https://fini-polymet-dashboard.netlify.app/test"
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800"
          >
            Batch test
          </Link>
          <span aria-hidden>›</span>
          <span className="text-slate-700">Add manually</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Manual question set</h1>
        <p className="max-w-3xl text-sm text-slate-600">
          Drop in up to 25 questions, then simulate Fini&apos;s answers without leaving the dashboard.
          You can revisit the editor at any time to adjust the list.
        </p>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 gap-6 lg:grid-cols-[320px,1fr]">
        <section className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white/90 p-7 shadow-sm shadow-slate-100">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Manual controls</h2>
            <p className="text-sm text-slate-600">
              Paste or refine your prompts, save the set, then run a full simulation whenever you&apos;re ready.
            </p>
          </div>
          <div className="grid gap-3">
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
              onClick={handleOpenEditor}
            >
              Edit questions
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              onClick={handleSimulate}
              disabled={!questions.length || simulationState === "running"}
            >
              {simulationState === "running" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MessageSquareText className="h-4 w-4" />
              )}
              {simulationState === "running" ? "Simulating…" : "Simulate answers"}
            </button>
            {progress.total > 0 && (
              <p className="text-xs font-medium text-slate-500">
                {simulationState === "running" ? "Processing" : "Completed"} {progress.current}/
                {progress.total} questions
              </p>
            )}
          </div>

          {simulationError && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {simulationError}
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-inner">
            <p className="font-semibold text-slate-900">Current selection</p>
            <p className="mt-1">{questions.length} questions saved</p>
            <p className="mt-3 text-xs text-slate-500">
              Manual sets support up to {MAX_MANUAL_QUESTIONS} prompts. Duplicate lines are deduped
              automatically when you save the list.
            </p>
          </div>

          {summary && (
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-inner">
              <div className="flex items-center gap-2 text-slate-900">
                <BarChart3 className="h-4 w-4" />
                <span className="text-sm font-semibold">Simulation summary</span>
              </div>
              <ul className="space-y-1 text-sm">
                <li className="flex items-center justify-between">
                  <span>Total questions</span>
                  <span className="font-semibold text-slate-900">{summary.total}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Completed runs</span>
                  <span className="font-semibold text-slate-900">
                    {summary.completed}/{summary.total}
                  </span>
                </li>
                <li className="flex items-center justify-between text-emerald-600">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Resolved
                  </span>
                  <span className="font-semibold">{summary.resolved}</span>
                </li>
                <li className="flex items-center justify-between text-amber-600">
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Escalated
                  </span>
                  <span className="font-semibold">{summary.escalated}</span>
                </li>
                <li className="flex items-center justify-between text-rose-600">
                  <span className="flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    Errors
                  </span>
                  <span className="font-semibold">{summary.errors}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Avg response time</span>
                  <span className="font-semibold text-slate-900">{formatDuration(summary.averageDuration)}</span>
                </li>
              </ul>
              <div className="grid gap-2 rounded-2xl border border-slate-100 bg-slate-50/80 p-3 text-xs text-slate-600">
                <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                  Quality checks
                </div>
                <div className="grid gap-2 md:grid-cols-3">
                  <div className="rounded-xl bg-white px-3 py-2 shadow-sm">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">Resolution-ready</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {summary.resolutionReady}/{summary.completed}{" "}
                      <span className="font-normal text-slate-500">
                        ({Math.round((summary.resolutionReady / Math.max(summary.completed, 1)) * 100)}%)
                      </span>
                    </p>
                  </div>
                  <div className="rounded-xl bg-white px-3 py-2 shadow-sm">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">Grounded answers</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {summary.grounded}/{summary.completed}{" "}
                      <span className="font-normal text-slate-500">
                        ({Math.round((summary.grounded / Math.max(summary.completed, 1)) * 100)}%)
                      </span>
                    </p>
                  </div>
                  <div className="rounded-xl bg-white px-3 py-2 shadow-sm">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">Reasoning included</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {summary.reasoningProvided}/{summary.completed}{" "}
                      <span className="font-normal text-slate-500">
                        ({Math.round((summary.reasoningProvided / Math.max(summary.completed, 1)) * 100)}%)
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/90 p-7 shadow-sm shadow-slate-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Questions</h2>
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              {questions.length} items
            </span>
          </div>

          {!questions.length && (
            <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-12 text-center text-sm text-slate-500">
              Add some questions to get started. They&apos;ll appear here once saved.
            </div>
          )}

          {!!questions.length && (
            <div className="space-y-4 overflow-y-auto pr-2">
              {questions.map((question, index) => {
                const result = results[index];
                const statusIcon = (() => {
                  if (!result) return null;
                  if (result.error) return <XCircle className="h-4 w-4 text-rose-500" />;
                  if (result.escalation) return <AlertTriangle className="h-4 w-4 text-amber-500" />;
                  if (result.resolved) return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
                  return null;
                })();

                return (
                  <details
                    key={`manual-${index}`}
                    className="group rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm open:bg-slate-50/60"
                  >
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                      <div className="flex flex-1 items-start gap-3 text-left">
                        <span className="mt-1 text-xs font-semibold text-slate-400">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start gap-2">
                            {statusIcon}
                            <p className="font-medium text-slate-900">{question}</p>
                          </div>
                          {result && (
                            <div className="space-y-1">
                              <p className="text-xs text-slate-500">
                                {result.error
                                  ? `Error: ${result.error}`
                                  : result.escalation
                                    ? "Escalated to human"
                                    : "Answered by Fini"}{" "}
                                · {formatDuration(result.responseTimeMs)}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                <span
                                  className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                                    result.resolved
                                      ? "bg-emerald-50 text-emerald-600"
                                      : "bg-slate-100 text-slate-500"
                                  }`}
                                >
                                  Resolution-ready {result.resolved ? "✓" : "–"}
                                </span>
                                <span
                                  className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                                    result.knowledge.length
                                      ? "bg-indigo-50 text-indigo-600"
                                      : "bg-slate-100 text-slate-500"
                                  }`}
                                >
                                  Grounded {result.knowledge.length ? "✓" : "–"}
                                </span>
                                <span
                                  className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                                    result.reasoning && result.reasoning.length
                                      ? "bg-sky-50 text-sky-600"
                                      : "bg-slate-100 text-slate-500"
                                  }`}
                                >
                                  Reasoning {result.reasoning && result.reasoning.length ? "✓" : "–"}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <ChevronDown className="mt-1 h-4 w-4 text-slate-400 transition group-open:rotate-180" />
                    </summary>
                    <div className="mt-4 space-y-4 text-sm text-slate-700">
                      {result ? (
                        <>
                          <div className="space-y-2">
                            <p className="font-semibold text-slate-900">Fini answer</p>
                            <p className="whitespace-pre-line rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                              {result.answer || "No answer returned."}
                            </p>
                          </div>
                          {result.reasoning && (
                            <div className="space-y-2">
                              <p className="font-semibold text-slate-900">Reasoning</p>
                              <p className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                                {result.reasoning}
                              </p>
                            </div>
                          )}
                          {!!result.knowledge.length && (
                            <div className="space-y-2">
                              <p className="font-semibold text-slate-900">Knowledge cited</p>
                              <ul className="space-y-1 text-sm text-slate-600">
                                {result.knowledge.map((entry, entryIndex) => {
                                  const label =
                                    entry.title &&
                                    /^\d+(,\s*\d+)*$/.test(entry.title) &&
                                    entry.question
                                      ? entry.question
                                      : entry.title ?? entry.question ?? entry.sourceId ?? "Untitled";
                                  return (
                                    <li key={`manual-${index}-kb-${entryIndex}`}>
                                      <span className="font-medium text-slate-800">{label}</span>
                                      {entry.sourceType && (
                                        <span className="text-xs text-slate-500"> · {entry.sourceType}</span>
                                      )}
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          )}
                          {result.error && (
                            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                              {result.error}
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-slate-500">Simulation not yet run for this prompt.</p>
                      )}
                    </div>
                  </details>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 px-6 py-10 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">Add manually</h2>
              <button
                type="button"
                className="text-sm text-slate-500 transition hover:text-slate-900"
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
              <div className="space-y-3">
                {rows.map((row, index) => (
                  <div key={row.id} className="flex items-start gap-3">
                    <textarea
                      className="h-12 flex-1 resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-inner focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                      placeholder={`Enter question ${index + 1}…`}
                      value={row.text}
                      onChange={(event) => handleRowChange(row.id, event.target.value)}
                      maxLength={500}
                    />
                    <button
                      type="button"
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-500"
                      onClick={() => handleRowRemove(row.id)}
                      aria-label="Remove question"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-slate-900 disabled:cursor-not-allowed disabled:text-slate-400"
                onClick={handleAddRow}
                disabled={rows.length >= MAX_MANUAL_QUESTIONS}
              >
                <Plus className="h-4 w-4" />
                Add another
                <span className="text-xs font-normal text-slate-400">
                  ({rows.length}/{MAX_MANUAL_QUESTIONS})
                </span>
              </button>
              {formError && <p className="mt-3 text-xs font-medium text-rose-600">{formError}</p>}
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                className="rounded-full px-4 py-2 text-sm font-semibold text-slate-500 transition hover:text-slate-800"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                onClick={handleSaveQuestions}
              >
                Save questions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
