"use client";

import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, BarChart3, CheckCircle2, Loader2, MessageSquareText, Plus, Trash2, XCircle } from "lucide-react";

const API_ENDPOINT = "https://api-prod.usefini.com/v2/bots/ask-question";
const FINI_API_KEY = (import.meta.env.VITE_FINI_API_KEY ?? import.meta.env.NEXT_PUBLIC_FINI_API_KEY ?? "") as string;

const MAX_MANUAL_QUESTIONS = 25;

type ManualRow = { id: string; text: string };
type ParsedKnowledge = { title?: string; sourceType?: string; sourceId?: string; question?: string };
type ParsedFunctionArguments = { response?: string; reasoning?: string; escalation?: string | boolean; [key: string]: unknown };
type FiniResponse = { answer?: string; based_on?: unknown; function_call?: { arguments?: unknown } };
type SimulationResult = { question: string; answer: string; reasoning?: string; escalation: boolean; resolved: boolean; knowledge: ParsedKnowledge[]; responseTimeMs: number; error?: string };

const parseFunctionArguments = (input: unknown): ParsedFunctionArguments => { if (!input) return {}; if (typeof input === "string") { try { return (JSON.parse(input) as ParsedFunctionArguments) ?? {}; } catch { return {}; } } if (typeof input === "object") return input as ParsedFunctionArguments; return {} };
const parseKnowledgeList = (input: unknown): ParsedKnowledge[] => { if (!Array.isArray(input)) return []; return input.map((item) => { if (!item || typeof item !== "object") return null; const record = item as Record<string, unknown>; const ids = record.id; let idLabel: string | undefined; if (typeof ids === "string" && ids.trim()) idLabel = ids; else if (Array.isArray(ids) && ids.length) idLabel = ids.map((value) => String(value)).join(", "); return { title: typeof record.title === "string" && record.title.trim() ? record.title : idLabel && !Number.isNaN(Number(idLabel)) ? `Knowledge #${idLabel}` : idLabel, sourceType: typeof record.source_type === "string" ? record.source_type : typeof record.sourceType === "string" ? record.sourceType : undefined, sourceId: typeof record.source_id === "string" ? record.source_id : typeof record.sourceId === "string" ? record.sourceId : undefined, question: typeof record.question === "string" ? record.question : undefined } as ParsedKnowledge; }).filter(Boolean) as ParsedKnowledge[] };
const parseEscalationFlag = (value: string | boolean | undefined): boolean => { if (typeof value === "boolean") return value; if (typeof value === "string") { const normalized = value.trim().toLowerCase(); if (normalized === "true") return true; if (normalized === "false") return false; } return false };
const formatDuration = (ms: number): string => { if (!Number.isFinite(ms) || ms < 0) return "—"; if (ms < 1000) return `${Math.round(ms)} ms`; return `${(ms / 1000).toFixed(1)} s` };
const createBlankRows = (count: number): ManualRow[] => Array.from({ length: count }, (_, idx) => ({ id: `row-${idx}`, text: "" }));

export default function TestAddManually() {
  const [rows, setRows] = useState<ManualRow[]>(createBlankRows(4));
  const [showModal, setShowModal] = useState(true);
  const [questions, setQuestions] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [simulationError, setSimulationError] = useState<string | null>(null);
  const [simulationState, setSimulationState] = useState<"idle" | "running" | "completed">("idle");
  const [progress, setProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [results, setResults] = useState<Array<SimulationResult | undefined>>([]);

  const handleRowChange = useCallback((id: string, value: string) => { setRows((current) => current.map((row) => (row.id === id ? { ...row, text: value } : row))); }, []);
  const handleRowRemove = useCallback((id: string) => { setRows((current) => { const filtered = current.filter((row) => row.id !== id); return filtered.length ? filtered : createBlankRows(1); }); }, []);
  const handleAddRow = useCallback(() => { setRows((current) => { if (current.length >= MAX_MANUAL_QUESTIONS) return current; return [...current, { id: `row-${Date.now()}`, text: "" }]; }); }, []);
  const handleSaveQuestions = useCallback(() => { const cleaned = rows.map((row) => row.text.trim()).filter((text, index, array) => text && array.indexOf(text) === index).slice(0, MAX_MANUAL_QUESTIONS); if (!cleaned.length) { setFormError("Add at least one question before saving."); return; } setFormError(null); setQuestions(cleaned); setShowModal(false); setResults([]); setSimulationState("idle"); setProgress({ current: 0, total: 0 }); }, [rows]);
  const handleOpenEditor = useCallback(() => { setRows((current) => (current.length ? current : createBlankRows(1))); setShowModal(true); setFormError(null); }, []);

  const handleSimulate = useCallback(async () => {
    if (!questions.length) return;
    if (!FINI_API_KEY) { setSimulationError("Fini API key missing. Set VITE_FINI_API_KEY in your environment."); return; }
    setSimulationError(null); setSimulationState("running"); setProgress({ current: 0, total: questions.length }); setResults(Array(questions.length).fill(undefined));
    const simulate = async (question: string): Promise<SimulationResult> => {
      const startedAt = performance.now();
      try {
        const response = await fetch(API_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${FINI_API_KEY}` }, body: JSON.stringify({ question, messageHistory: [], temperature: 0.2 }) });
        const duration = performance.now() - startedAt;
        if (!response.ok) { return { question, answer: "", reasoning: "", escalation: false, resolved: false, knowledge: [], responseTimeMs: duration, error: `HTTP ${response.status}` }; }
        const data = (await response.json()) as FiniResponse;
        const parsedArgs = parseFunctionArguments(data.function_call?.arguments);
        const answer = (typeof data.answer === "string" ? data.answer.trim() : "") || (typeof parsedArgs.response === "string" ? parsedArgs.response.trim() : "");
        return { question, answer, reasoning: typeof parsedArgs.reasoning === "string" ? parsedArgs.reasoning.trim() : undefined, escalation: parseEscalationFlag(parsedArgs.escalation), resolved: !parseEscalationFlag(parsedArgs.escalation) && Boolean(answer), knowledge: parseKnowledgeList(data.based_on), responseTimeMs: duration };
      } catch (err) { return { question, answer: "", reasoning: "", escalation: false, resolved: false, knowledge: [], responseTimeMs: performance.now() - startedAt, error: err instanceof Error ? err.message : "Unknown error" }; }
    };
    for (let index = 0; index < questions.length; index += 1) {
      const question = questions[index];
      const result = await simulate(question);
      setResults((previous) => { const next = [...previous]; next[index] = result; return next; });
      setProgress({ current: index + 1, total: questions.length });
    }
    setSimulationState("completed");
  }, [questions]);

  const summary = useMemo(() => {
    if (!results.length) return null; const completed = results.filter((item): item is SimulationResult => Boolean(item)); if (!completed.length) return null; const total = results.length; const resolved = completed.filter((item) => item.resolved).length; const escalated = completed.filter((item) => item.escalation).length; const errors = completed.filter((item) => item.error).length; const averageDuration = completed.reduce((acc, item) => acc + item.responseTimeMs, 0) / Math.max(completed.length, 1); const grounded = completed.filter((item) => item.knowledge.length > 0).length; const reasoningProvided = completed.filter((item) => item.reasoning && item.reasoning.length > 0).length; return { total, completed: completed.length, resolved, escalated, errors, averageDuration, grounded, reasoningProvided, resolutionReady: resolved }; }, [results]);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[#f5f7fb] via-white to-white px-6 py-12 text-slate-900 md:px-10 lg:px-16">
      <header className="mx-auto mb-10 flex w-full max-w-6xl flex-col gap-3">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <Link to="/test" className="flex items-center gap-2 text-slate-500 hover:text-slate-800">Batch test</Link>
          <span aria-hidden>›</span>
          <span className="text-slate-700">Add manually</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Manual question set</h1>
        <p className="max-w-3xl text-sm text-slate-600">Drop in up to 25 questions, then simulate Fini's answers without leaving the dashboard. You can revisit the editor at any time to adjust the list.</p>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 gap-6 lg:grid-cols-[320px,1fr]">
        <section className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white/90 p-7 shadow-sm shadow-slate-100">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Manual controls</h2>
            <p className="text-sm text-slate-600">Paste or refine your prompts, save the set, then run a full simulation whenever you're ready.</p>
          </div>
          <div className="grid gap-3">
            <button type="button" className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-700" onClick={handleOpenEditor}>Edit questions</button>
            <button type="button" className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400" onClick={handleSimulate} disabled={!questions.length || simulationState === "running"}>{simulationState === "running" ? (<Loader2 className="h-4 w-4 animate-spin" />) : (<MessageSquareText className="h-4 w-4" />)}{simulationState === "running" ? "Simulating…" : "Simulate answers"}</button>
            {progress.total > 0 && (<p className="text-xs font-medium text-slate-500">{simulationState === "running" ? "Processing" : "Completed"} {progress.current}/{progress.total} questions</p>)}
          </div>
          {simulationError && (<div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{simulationError}</div>)}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-inner">
            <p className="font-semibold text-slate-900">Current selection</p>
            <p className="mt-1">{questions.length} questions saved</p>
            <p className="mt-3 text-xs text-slate-500">Manual sets support up to {MAX_MANUAL_QUESTIONS} prompts. Duplicate lines are deduped automatically when you save the list.</p>
          </div>
          {summary && (
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-inner">
              <div className="flex items-center gap-2 text-slate-900"><BarChart3 className="h-4 w-4" /><span className="text-sm font-semibold">Simulation summary</span></div>
              <ul className="space-y-1 text-sm">
                <li className="flex items-center justify-between"><span>Total questions</span><span className="font-semibold text-slate-900">{summary.total}</span></li>
                <li className="flex items-center justify-between"><span>Completed runs</span><span className="font-semibold text-slate-900">{summary.completed}/{summary.total}</span></li>
                <li className="flex items-center justify-between text-emerald-600"><span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />Resolved</span><span className="font-semibold">{summary.resolved}</span></li>
                <li className="flex items-center justify-between text-amber-600"><span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Escalated</span><span className="font-semibold">{summary.escalated}</span></li>
                <li className="flex items-center justify-between text-rose-600"><span className="flex items-center gap-2"><XCircle className="h-4 w-4" />Errors</span><span className="font-semibold">{summary.errors}</span></li>
                <li className="flex items-center justify-between"><span>Avg response time</span><span className="font-semibold text-slate-900">{formatDuration(summary.averageDuration)}</span></li>
              </ul>
              <div className="grid gap-2 rounded-2xl border border-slate-100 bg-slate-50/80 p-3 text-xs text-slate-600">
                <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Quality checks</div>
                <div className="grid gap-2 md:grid-cols-3">
                  <div className="rounded-xl bg-white px-3 py-2 shadow-sm"><p className="text-[11px] uppercase tracking-wide text-slate-500">Resolution-ready</p><p className="text-sm font-semibold text-slate-900">{summary.resolutionReady}</p></div>
                  <div className="rounded-xl bg-white px-3 py-2 shadow-sm"><p className="text-[11px] uppercase tracking-wide text-slate-500">Grounded answers</p><p className="text-sm font-semibold text-slate-900">{summary.grounded}</p></div>
                  <div className="rounded-xl bg-white px-3 py-2 shadow-sm"><p className="text-[11px] uppercase tracking-wide text-slate-500">Reasoning provided</p><p className="text-sm font-semibold text-slate-900">{summary.reasoningProvided}</p></div>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white/90 p-7 shadow-sm shadow-slate-100">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Generated answers</h2>
            {summary ? (
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{summary.completed}/{summary.total} completed<span className="inline-flex h-1.5 w-24 overflow-hidden rounded bg-slate-200"><span className="h-full bg-slate-800" style={{ width: `${(summary.completed / Math.max(summary.total,1)) * 100}%` }} /></span></div>
            ) : null}
          </div>
          <div className="grid gap-3">
            {results.map((entry, index) => (
              <details key={index} className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3">
                  <div className="flex items-center gap-2 text-left text-sm"><span className="text-xs font-mono text-slate-400">{String(index + 1).padStart(2, "0")}</span><span className="font-semibold text-slate-800">{entry?.question ?? "(pending)"}</span></div>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </summary>
                <div className="border-t border-slate-100 px-4 py-3 text-sm">
                  {entry ? (
                    entry.error ? (
                      <p className="text-rose-600">Error: {entry.error}</p>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Answer</h4>
                          <p className="mt-1 whitespace-pre-wrap text-slate-800">{entry.answer || "(empty)"}</p>
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Reasoning</h4>
                          <p className="mt-1 whitespace-pre-wrap text-slate-700">{entry.reasoning || "(not provided)"}</p>
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Knowledge references</h4>
                          {entry.knowledge.length ? (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {entry.knowledge.map((ref, i) => (
                                <span key={`${ref.title ?? ref.sourceId ?? i}-${i}`} className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">{ref.title ?? ref.question ?? ref.sourceId ?? `Ref #${i+1}`}</span>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-1 text-slate-500">No knowledge references.</p>
                          )}
                        </div>
                        <div className="text-xs text-slate-500">Response time: {formatDuration(entry.responseTimeMs)}</div>
                      </div>
                    )
                  ) : (
                    <p className="text-slate-500">Waiting for simulation…</p>
                  )}
                </div>
              </details>
            ))}
            {!results.length && <p className="text-sm text-slate-500">No results yet. Add and simulate to see answers here.</p>}
          </div>
        </section>
      </main>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Edit questions</h3>
            <p className="mb-3 text-sm text-slate-600">Add up to {MAX_MANUAL_QUESTIONS} questions. Duplicate lines are removed automatically.</p>
            {formError && <div className="mb-3 rounded-md border border-rose-200 bg-rose-50 p-2 text-sm text-rose-700">{formError}</div>}
            <div className="grid gap-2">
              {rows.map((row, idx) => (
                <div key={row.id} className="flex items-center gap-2">
                  <span className="w-8 text-center text-xs font-mono text-slate-400">{String(idx + 1).padStart(2, "0")}</span>
                  <input value={row.text} onChange={(e) => handleRowChange(row.id, e.target.value)} placeholder="Type a question…" className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-slate-400" />
                  <button type="button" onClick={() => handleRowRemove(row.id)} className="inline-flex items-center rounded-md border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              <div className="flex items-center justify-between">
                <button type="button" onClick={handleAddRow} className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"><Plus className="h-4 w-4" />Add row</button>
                <div className="text-xs text-slate-500">{rows.length}/{MAX_MANUAL_QUESTIONS}</div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button type="button" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="button" className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white" onClick={handleSaveQuestions}>Save questions</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

