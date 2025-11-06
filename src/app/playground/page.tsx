"use client";

import { useMemo, useState } from "react";

type MessageRole = "system" | "user" | "assistant" | "function";

type MessageDraft = {
  role: MessageRole;
  content: string;
};

const API_ENDPOINT = "https://api-prod.usefini.com/v2/bots/ask-question";
const FINI_API_KEY = process.env.NEXT_PUBLIC_FINI_API_KEY ?? "";

const ROLE_OPTIONS: MessageRole[] = ["system", "user", "assistant", "function"];

const SAMPLE_QUESTIONS: string[] = [
  "Pilgrim Bank just moved to Apiture and my login URL changed—how do I update the institution link so Monarch stops timing out?",
  "My Vanguard brokerage cash balance in Monarch is lagging a few weeks behind the real value—what refresh steps can correct the holdings?",
  "Credit card swipes are syncing, but direct deposits from my checking account never appear; how can I pull in those ACH transactions?",
  "After reassigning a few spending categories, the budget view still treats them as income buckets—how do I flip them back to expenses?",
  "When I export a filtered transaction list, the CSV still includes every entry from the account—can I download only the filtered results?",
  "Reconnecting Rogers Bank Canada works briefly, then disconnects again—what permanent fix should I try next?",
  "A friend I referred subscribed yesterday, but the referral reward tile is empty—how can I confirm the credit was tracked?",
  "I found duplicate institution entries after troubleshooting—what’s the safest way to remove the extra account without losing history?",
  "My manual mortgage flipped to a positive balance on the dashboard—how do I correct it so the liability shows properly?",
  "I’m trying to cancel during my trial, but I can’t find a “Manage subscription” option in Billing—where should I go to stop the renewal?",
  "The welcome promo code showed as applied, yet my first charge posted at the full annual rate—can you verify the discount on my invoice?",
  "Transfers I make into my Robinhood goal aren’t increasing the goal progress—how should I record those contributions?",
  "I edited a recurring expense and now it’s classified as income in the budget rollup—what’s the right way to fix that category?",
  "My new Chase Amazon card is visible, but transactions still say “pending” with nothing downloading—should I switch data providers?",
  "The net worth card totals my investments differently than the accounts tab—what causes that mismatch and how do I reconcile it?",
];

type FiniFunctionCall = {
  name?: string;
  arguments?: unknown;
};

type FiniKnowledgeEntry = {
  answer?: string;
  question?: string;
  source_id?: string;
  source_type?: string;
  score?: number;
  merged_questions?: string;
};

type FiniResponse = {
  answer?: string;
  answer_uuid?: string;
  based_on?: unknown;
  function_call?: FiniFunctionCall;
  language?: string;
  conversation_id?: string;
  messages?: unknown;
};

type ParsedFunctionArgs = {
  escalation?: string | boolean;
  reasoning?: string;
  response?: string;
  [key: string]: unknown;
};

type ParsedKnowledge = {
  snippet?: string;
  question?: string;
  sourceId?: string;
  sourceType?: string;
  score?: number;
  mergedQuestions?: string;
};

type ParsedResponseSummary = {
  answer?: string;
  functionCallName?: string;
  functionArguments: ParsedFunctionArgs;
  isEscalated: boolean;
  reasoning?: string;
  knowledge: ParsedKnowledge[];
  raw: FiniResponse;
};

const parseFunctionArguments = (input: unknown): ParsedFunctionArgs => {
  if (!input) {
    return {};
  }

  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input);
      return typeof parsed === "object" && parsed !== null ? (parsed as ParsedFunctionArgs) : {};
    } catch {
      return { raw: input };
    }
  }

  if (typeof input === "object") {
    return input as ParsedFunctionArgs;
  }

  return {};
};

const parseKnowledge = (data: unknown): ParsedKnowledge[] => {
  if (!Array.isArray(data)) {
    return [];
  }

  const items = (data as unknown[])
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }
      const record = entry as FiniKnowledgeEntry & Record<string, unknown>;
      const k: ParsedKnowledge = {
        snippet: typeof record.answer === "string" ? record.answer : undefined,
        question: typeof record.question === "string" ? record.question : undefined,
        sourceId: typeof record.source_id === "string" ? record.source_id : undefined,
        sourceType: typeof record.source_type === "string" ? record.source_type : undefined,
        score: typeof record.score === "number" ? record.score : undefined,
        mergedQuestions:
          typeof record.merged_questions === "string" ? record.merged_questions : undefined,
      };
      return k;
    })
    .filter((entry): entry is ParsedKnowledge => Boolean(entry));
  return items;
};

const parseResponseSummary = (data: unknown): ParsedResponseSummary | null => {
  if (!data || typeof data !== "object") {
    return null;
  }

  const raw = data as FiniResponse;
  const functionArgs = parseFunctionArguments(raw.function_call?.arguments);

  const escalationValue = functionArgs.escalation;
  const isEscalated =
    typeof escalationValue === "string"
      ? escalationValue.toLowerCase() === "true"
      : Boolean(escalationValue);

  const reasoning =
    typeof functionArgs.reasoning === "string" ? functionArgs.reasoning : undefined;

  return {
    answer: typeof raw.answer === "string" ? raw.answer : undefined,
    functionCallName:
      raw.function_call && typeof raw.function_call.name === "string"
        ? raw.function_call.name
        : undefined,
    functionArguments: functionArgs,
    isEscalated,
    reasoning,
    knowledge: parseKnowledge(raw.based_on),
    raw,
  };
};

export default function PlaygroundPage() {
  const [instruction, setInstruction] = useState("");
  const [question, setQuestion] = useState("");
  const [messageDrafts, setMessageDrafts] = useState<MessageDraft[]>([
    { role: "system", content: "" },
  ]);
  const [temperature, setTemperature] = useState(0.4);
  const [categories, setCategories] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [responseData, setResponseData] = useState<unknown>(null);
  const [lastPayload, setLastPayload] = useState<unknown>(null);
  const [showRawResponse, setShowRawResponse] = useState(false);

  const sanitizedMessages = useMemo(() => {
    return messageDrafts
      .map((draft) => ({
        role: draft.role,
        content: draft.content.trim(),
      }))
      .filter((draft) => draft.content.length > 0);
  }, [messageDrafts]);

  const handleDraftChange = (index: number, field: keyof MessageDraft, value: string) => {
    setMessageDrafts((current) => {
      const next = [...current];
      if (field === "role") {
        next[index] = { ...next[index], role: value as MessageRole };
      } else {
        next[index] = { ...next[index], content: value };
      }
      return next;
    });
  };

  const handleAddDraft = () => {
    setMessageDrafts((current) => [...current, { role: "user", content: "" }]);
  };

  const handleRemoveDraft = (index: number) => {
    if (messageDrafts.length === 1) {
      setMessageDrafts([{ role: "system", content: "" }]);
      return;
    }
    setMessageDrafts((current) => current.filter((_, idx) => idx !== index));
  };

  const handleApplySampleQuestion = (prompt: string) => {
    setQuestion(prompt);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setResponseData(null);
    setShowRawResponse(false);

    if (!FINI_API_KEY) {
      setError("Fini API key missing. Set NEXT_PUBLIC_FINI_API_KEY in your environment.");
      return;
    }

    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      setError("Question is required.");
      return;
    }

    const categoriesList = categories
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    const payload: Record<string, unknown> = {
      question: trimmedQuestion,
      messageHistory: sanitizedMessages,
    };

    if (instruction.trim()) {
      payload.instruction = instruction.trim();
    }
    if (categoriesList.length) {
      payload.categories = categoriesList;
    }
    if (Math.abs(temperature - 0.4) > 0.0001) {
      payload.temperature = temperature;
    }

    setIsSubmitting(true);
    setLastPayload(payload);

    try {
        const response = await fetch(API_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${FINI_API_KEY}`,
          },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Request failed with status ${response.status}`);
      }

      const data = await response.json();
      setResponseData(data);
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : "Unknown error occurred.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const responseSummary = useMemo(
    () => parseResponseSummary(responseData),
    [responseData],
  );

  const functionArgsDisplay = useMemo(() => {
    if (!responseSummary) {
      return null;
    }
    const { functionArguments } = responseSummary;
    const { reasoning: _reasoning, ...rest } = functionArguments;
    const filtered = Object.entries(rest).filter(([, value]) => value !== undefined);
    return filtered.length ? Object.fromEntries(filtered) : null;
  }, [responseSummary]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-white text-slate-900">
      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-16 font-sans lg:px-8">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Experimental tools
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Playground
          </h1>
          <p className="text-sm text-slate-600">
            Configure prompts, send requests to the Fini Answer endpoint, and inspect live responses.
            API key is hardcoded for now—swap to a secure store before shipping.
          </p>
        </header>

        <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Sample Scenarios</h2>
            <p className="text-xs text-slate-500">
              Click any prompt to load it into the request builder.
            </p>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {SAMPLE_QUESTIONS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handleApplySampleQuestion(prompt)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:bg-slate-50 hover:shadow-md"
              >
                {prompt}
              </button>
            ))}
          </div>
        </section>

        <section className="grid gap-6 rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-sm backdrop-blur">
          <h2 className="text-lg font-semibold text-slate-900">Request Builder</h2>
          <form className="grid gap-5" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Instruction (optional)
              </label>
              <textarea
                value={instruction}
                onChange={(event) => setInstruction(event.target.value)}
                placeholder="Answer as if you are replying to an email..."
                rows={2}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Question<span className="text-rose-500">*</span>
              </label>
              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="How do I upgrade to premium?"
                rows={3}
                required
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
            </div>

            <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Message History
                </span>
                <button
                  type="button"
                  onClick={handleAddDraft}
                  className="rounded-full bg-sky-600 px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-500"
                >
                  Add message
                </button>
              </div>
              <p className="text-xs text-slate-500">
                Builds the conversation context. Empty messages are ignored.
              </p>
              <div className="grid gap-4">
                {messageDrafts.map((draft, index) => (
                  <div
                    key={`${draft.role}-${index}`}
                    className="grid gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Role
                      </label>
                      <button
                        type="button"
                        onClick={() => handleRemoveDraft(index)}
                        className="text-xs font-semibold text-rose-500 hover:text-rose-400"
                      >
                        Remove
                      </button>
                    </div>
                    <select
                      value={draft.role}
                      onChange={(event) => handleDraftChange(index, "role", event.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                    >
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                    <textarea
                      value={draft.content}
                      onChange={(event) => handleDraftChange(index, "content", event.target.value)}
                      placeholder="Message content..."
                      rows={2}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white/80 p-4">
              <div className="grid gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Temperature ({temperature.toFixed(2)})
                </label>
                <input
                  type="range"
                  min={0}
                  max={2}
                  step={0.1}
                  value={temperature}
                  onChange={(event) => setTemperature(Number(event.target.value))}
                  className="w-full accent-sky-600"
                />
                <p className="text-xs text-slate-500">
                  Higher values boost creativity, lower values improve determinism. Default is 0.4.
                </p>
              </div>

              <div className="grid gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Categories (comma separated)
                </label>
                <input
                  type="text"
                  value={categories}
                  onChange={(event) => setCategories(event.target.value)}
                  placeholder="Fini intro, Billing"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-full bg-sky-600 px-6 py-2 text-sm font-semibold text-white shadow transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-sky-300"
              >
                {isSubmitting ? "Sending..." : "Send request"}
              </button>
              <p className="text-xs text-slate-500">
                Calls {API_ENDPOINT}. Replace the API key with env-based secrets before production.
              </p>
            </div>
          </form>
        </section>

        <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-sm backdrop-blur">
          <h2 className="text-lg font-semibold text-slate-900">Inspector</h2>
          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {error}
            </div>
          ) : null}
          {lastPayload ? (
            <details className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-2xl px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-600 transition hover:bg-slate-50">
                <span>Request payload</span>
                <span className="text-[10px] font-semibold text-slate-400">Toggle</span>
              </summary>
              <pre className="max-h-56 overflow-auto rounded-b-2xl border-t border-slate-100 bg-slate-950/90 p-4 text-xs text-slate-100">
                {JSON.stringify(lastPayload, null, 2)}
              </pre>
            </details>
          ) : null}

          {responseSummary ? (
            <div className="grid gap-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Answer
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                      responseSummary.isEscalated
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {responseSummary.isEscalated ? "Escalated" : "Resolved"}
                  </span>
                </div>
                <div className="prose prose-sm max-w-none">
                  <div className="mt-3 max-h-48 overflow-y-auto rounded-xl bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700">
                    {responseSummary.answer ?? "No answer returned."}
                  </div>
                </div>
                {responseSummary.reasoning ? (
                  <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm text-slate-600">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Reasoning
                    </p>
                    <p className="mt-1 max-h-40 overflow-y-auto text-sm leading-relaxed text-slate-600">
                      {responseSummary.reasoning}
                    </p>
                  </div>
                ) : null}
              </div>

              {responseSummary.knowledge.length ? (
                <div className="grid gap-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Knowledge References ({responseSummary.knowledge.length})
                  </p>
                  <div className="grid gap-3">
                    {responseSummary.knowledge.map((entry, index) => {
                      const keySegments = [
                        entry.sourceId,
                        entry.question,
                        entry.mergedQuestions,
                        String(index),
                      ].filter(Boolean);
                      const compositeKey = keySegments.join("|") || `knowledge-${index}`;

                      return (
                      <details
                        key={compositeKey}
                        className="rounded-xl border border-slate-200 bg-white shadow-sm"
                      >
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                          <span className="max-w-[80%] truncate">
                            {entry.question ?? entry.sourceId ?? "Knowledge snippet"}
                          </span>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            Details
                          </span>
                        </summary>
                        <div className="border-t border-slate-100 px-4 py-3 text-sm text-slate-600">
                          <div className="flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-wider text-slate-400">
                            {entry.sourceType ? <span>{entry.sourceType}</span> : null}
                            {typeof entry.score === "number" ? (
                              <span>Score {entry.score.toFixed(3)}</span>
                            ) : null}
                          </div>
                          {entry.mergedQuestions ? (
                            <p className="mt-2 text-[11px] text-slate-400">
                              {entry.mergedQuestions}
                            </p>
                          ) : null}
                          {entry.snippet ? (
                            <div className="mt-3 max-h-44 overflow-y-auto rounded-lg bg-slate-50 px-3 py-2 leading-relaxed">
                              {entry.snippet}
                            </div>
                          ) : null}
                          {entry.sourceId ? (
                            <a
                              href={entry.sourceId}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-3 inline-flex break-all text-xs font-semibold text-sky-600 hover:text-sky-500"
                            >
                              {entry.sourceId}
                            </a>
                          ) : null}
                        </div>
                      </details>
                    );
                    })}
                  </div>
                </div>
              ) : null}

              {responseSummary.functionCallName || functionArgsDisplay ? (
                <div className="grid gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Function Call
                  </p>
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    {responseSummary.functionCallName ? (
                      <p className="text-sm font-semibold text-slate-700">
                        Name: {responseSummary.functionCallName}
                      </p>
                    ) : null}
                    {functionArgsDisplay ? (
                      <div className="mt-3 space-y-1 text-sm text-slate-600">
                        {Object.entries(functionArgsDisplay).map(([key, value]) => (
                          <div
                            key={key}
                            className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500"
                          >
                            <span>{key}</span>
                            <span className="text-slate-700 normal-case">
                              {typeof value === "string"
                                ? value
                                : JSON.stringify(value, null, 2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {responseData ? (
            <div className="grid gap-2">
              <button
                type="button"
                onClick={() => setShowRawResponse((prev) => !prev)}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-sky-300 hover:bg-slate-50"
              >
                <span>API response details</span>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {showRawResponse ? "Hide" : "Show"}
                </span>
              </button>
              {showRawResponse ? (
                <pre className="max-h-[32rem] overflow-auto rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-900">
                  {JSON.stringify(responseData, null, 2)}
                </pre>
              ) : null}
            </div>
          ) : null}

          {!error && !responseData ? (
            <p className="text-sm text-slate-500">
              Submit a request to inspect the payload and response here.
            </p>
          ) : null}
        </section>
      </main>
    </div>
  );
}
