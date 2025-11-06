"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { multiTurnScenarios } from "@/data/multiturnScenarios";
import type { MultiTurnScenario } from "@/data/multiturnScenarios";

type PersonaDraft = {
  name: string;
  archetype: string;
  objective: string;
  tone: string;
};

type ConversationTurn = {
  speaker: "User" | "Fini";
  content: string;
  reasoning?: string;
  knowledge?: string[];
  escalated?: boolean;
};

type ParsedKnowledge = {
  title?: string;
  question?: string;
  sourceId?: string;
};

type ParsedFunctionArgs = {
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

const defaultPersona: PersonaDraft = {
  name: "",
  archetype: "",
  objective: "",
  tone: "",
};

const parseFunctionArguments = (input: unknown): ParsedFunctionArgs => {
  if (!input) return {};
  if (typeof input === "string") {
    try {
      return (JSON.parse(input) as ParsedFunctionArgs) ?? {};
    } catch {
      return {};
    }
  }
  if (typeof input === "object") return input as ParsedFunctionArgs;
  return {};
};

const parseKnowledgeList = (input: unknown): ParsedKnowledge[] => {
  if (!Array.isArray(input)) return [];
  const items = (input as unknown[])
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const entry: ParsedKnowledge = {
        title: typeof record.title === "string" ? record.title : undefined,
        question: typeof record.question === "string" ? record.question : undefined,
        sourceId: typeof (record as any).source_id === "string" ? (record as any).source_id : undefined,
      };
      return entry;
    })
    .filter((entry): entry is ParsedKnowledge => Boolean(entry));
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

export default function MultiTurnPlaygroundPage() {
  const [persona, setPersona] = useState<PersonaDraft>(defaultPersona);
  const [scenario, setScenario] = useState("");
  const [maxTurns, setMaxTurns] = useState(4);
  const [status, setStatus] = useState<"idle" | "running" | "completed">("idle");
  const [conversation, setConversation] = useState<ConversationTurn[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(
    multiTurnScenarios[0]?.id ?? null,
  );
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationError, setSimulationError] = useState<string | null>(null);
  const scenarioScrollRef = useRef<HTMLDivElement>(null);

  const previewSummary = useMemo(() => {
    const words = scenario.trim().split(/\s+/).filter(Boolean);
    return words.length ? `${words.length} words scenario` : "Add a scenario prompt to begin.";
  }, [scenario]);

  const handleReset = () => {
    setPersona(defaultPersona);
    setScenario("");
    setMaxTurns(4);
    setStatus("idle");
    setConversation([]);
    setSimulationError(null);
  };

  const handleApplyScenario = (scenarioConfig: MultiTurnScenario) => {
    setSelectedScenarioId(scenarioConfig.id);
    setPersona({
      name: scenarioConfig.personaName,
      archetype: scenarioConfig.personaSummary,
      objective: scenarioConfig.primaryObjective,
      tone: `${scenarioConfig.tone} — sentiment: ${scenarioConfig.sentiment}`,
    });
    setScenario(scenarioConfig.scenarioSeed);
    setStatus("idle");
    setConversation([]);
    setSimulationError(null);
  };

  const callFini = useCallback(
    async (
      question: string,
      history: Array<{ role: "user" | "assistant"; content: string }>,
    ) => {
      const apiKey = process.env.NEXT_PUBLIC_FINI_API_KEY ?? "";
      if (!apiKey) {
        throw new Error("Fini API key missing. Set NEXT_PUBLIC_FINI_API_KEY to run simulations.");
      }

      const response = await fetch("https://api-prod.usefini.com/v2/bots/ask-question", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          question,
          messageHistory: history,
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Fini call failed (${response.status})`);
      }

      const data = (await response.json()) as FiniResponse;
      const parsedArgs = parseFunctionArguments(data.function_call?.arguments);
      const answer =
        (typeof data.answer === "string" ? data.answer.trim() : "") ||
        (typeof parsedArgs.response === "string" ? parsedArgs.response.trim() : "");
      const knowledge = parseKnowledgeList(data.based_on)
        .map((entry) => entry.title ?? entry.question ?? entry.sourceId)
        .filter((value): value is string => Boolean(value));

      return {
        answer,
        reasoning:
          typeof parsedArgs.reasoning === "string" ? parsedArgs.reasoning.trim() : undefined,
        knowledge,
        escalation: parseEscalationFlag(parsedArgs.escalation),
      };
    },
    [],
  );

  const callOpenAi = useCallback(
    async ({
      scenarioConfig,
      conversationLog,
      turnIndex,
      scenarioContext,
    }: {
      scenarioConfig: MultiTurnScenario;
      conversationLog: ConversationTurn[];
      turnIndex: number;
      scenarioContext: string;
    }): Promise<string> => {
      const openAiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY ?? "";
      if (!openAiKey) {
        throw new Error("OpenAI API key missing. Add NEXT_PUBLIC_OPENAI_API_KEY to continue.");
      }

      const messages = [
        {
          role: "system",
          content:
            "You are simulating a Monarch Money customer in a support chat. Reply in 1-2 sentences. Stay on topic, follow the persona, and output <END> if no further follow-up is needed.",
        },
        {
          role: "user",
          content: [
            `Persona: ${scenarioConfig.personaName}`,
            `Background: ${scenarioConfig.personaSummary}`,
            `Primary objective: ${scenarioConfig.primaryObjective}`,
            `Scenario context: ${scenarioContext}`,
            `Tone: ${scenarioConfig.tone}`,
            `Sentiment: ${scenarioConfig.sentiment}`,
            `Conversation so far:\n${conversationLog
              .map((entry) => `${entry.speaker}: ${entry.content}`)
              .join("\n")}`,
            `Turn index: ${turnIndex + 1}`,
            "Respond as the user in first person. Keep it casual and a little messy (short sentences, filler like 'ugh' or 'hey' when natural). If it feels wrapped up, reply with <END>.",
          ].join("\n"),
        },
      ];

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openAiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-5-mini",
          messages,
        }),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `OpenAI call failed (${response.status})`);
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = data.choices?.[0]?.message?.content?.trim();
      return content ?? "<END>";
    },
    [],
  );

  const handleSimulateConversation = useCallback(async () => {
    const scenarioConfig = selectedScenarioId
      ? multiTurnScenarios.find((entry) => entry.id === selectedScenarioId)
      : null;

    if (!scenarioConfig) {
      setSimulationError("Select a scenario before running the simulation.");
      return;
    }

    const scenarioContext = scenario.trim() || scenarioConfig.scenarioSeed;
    const openingMessage =
      scenarioConfig.initialUserMessage?.trim() ||
      (scenarioContext && scenarioContext.length < 220 ? scenarioContext : "Hey, I have a quick question about my Monarch Money account.");

    setSimulationError(null);
    setIsSimulating(true);
    setStatus("running");
    setConversation([]);

    const conversationLog: ConversationTurn[] = [];
    const finiHistory: Array<{ role: "user" | "assistant"; content: string }> = [];

    let nextUserMessage: string | null = openingMessage;

    for (let turnIndex = 0; turnIndex < maxTurns && nextUserMessage; turnIndex += 1) {
      conversationLog.push({
        speaker: "User",
        content: nextUserMessage,
      });
      setConversation([...conversationLog]);

      let finiResult;
      try {
        finiResult = await callFini(nextUserMessage, [...finiHistory]);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to reach Fini.";
        setSimulationError(message);
        setIsSimulating(false);
        setStatus("idle");
        return;
      }

      const finiMessage: ConversationTurn = {
        speaker: "Fini",
        content: finiResult.answer || "Fini returned an empty response.",
        reasoning: finiResult.reasoning,
        knowledge: finiResult.knowledge.length ? finiResult.knowledge : undefined,
        escalated: finiResult.escalation,
      };
      conversationLog.push(finiMessage);
      setConversation([...conversationLog]);

      finiHistory.push({ role: "user", content: nextUserMessage });
      finiHistory.push({ role: "assistant", content: finiResult.answer || "" });

      const shouldStop =
        turnIndex === maxTurns - 1 ||
        !finiResult.answer ||
        finiResult.escalation ||
        (finiResult.reasoning &&
          /resolved|complete|no further action|required no further action/i.test(
            finiResult.reasoning.toLowerCase(),
          ));

      if (shouldStop) {
        break;
      }

      try {
        const followUp = await callOpenAi({
          scenarioConfig,
          conversationLog,
          turnIndex,
          scenarioContext,
        });
        if (!followUp || followUp.trim().toUpperCase() === "<END>") {
          break;
        }
        nextUserMessage = followUp.replace(/<END>$/i, "").trim();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to generate follow-up.";
        setSimulationError(message);
        break;
      }
    }

    setConversation([...conversationLog]);
    setIsSimulating(false);
    setStatus(conversationLog.length ? "completed" : "idle");
  }, [callFini, callOpenAi, maxTurns, scenario, selectedScenarioId]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-white text-slate-900">
      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12 font-sans lg:px-10">
        <header className="space-y-4 rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                Multi-turn Playground
              </h1>
              <p className="text-sm text-slate-600">
                Re-create multi-turn customer journeys with personas drawn from Aug–Sep 2025 Zendesk
                conversations, then inspect how Fini’s follow-up responses evolve across four turns.
              </p>
            </div>
          </div>
        </header>

        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Scenario library</h2>
              <p className="text-sm text-slate-600">
                These personas were synthesized from 200 Zendesk conversations between Aug–Sep 2025.
                Load one to prefill the playground or tweak the fields before simulating.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {multiTurnScenarios.length} presets
            </span>
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-white via-white to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white via-white to-transparent" />
            <div className="flex items-center justify-center gap-3 pb-2">
              <button
                type="button"
                onClick={() => scenarioScrollRef.current?.scrollBy({ left: -320, behavior: "smooth" })}
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
              >
                ◀
              </button>
              <button
                type="button"
                onClick={() => scenarioScrollRef.current?.scrollBy({ left: 320, behavior: "smooth" })}
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
              >
                ▶
              </button>
            </div>
            <div
              ref={scenarioScrollRef}
              className="overflow-x-auto pb-2"
            >
              <div className="flex min-w-max gap-4">
                {multiTurnScenarios.map((entry) => {
                  const isActive = selectedScenarioId === entry.id;
                  return (
                    <article
                      key={entry.id}
                      className={`flex w-80 flex-col justify-between rounded-2xl border px-4 py-4 shadow-sm transition ${
                        isActive
                          ? "border-sky-300 bg-sky-50/70"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-semibold text-slate-900">{entry.personaName}</h3>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                            {entry.focusCategory}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">{entry.personaSummary}</p>
                        <div className="space-y-1 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                          <p>
                            <span className="font-semibold text-slate-700">Objective:</span>{" "}
                            {entry.primaryObjective}
                          </p>
                          <p>
                            <span className="font-semibold text-slate-700">Tone:</span> {entry.tone}
                          </p>
                          <p>
                            <span className="font-semibold text-slate-700">Sentiment:</span>{" "}
                            {entry.sentiment}
                          </p>
                        </div>
                        <p className="text-xs text-slate-500">{entry.scenarioSeed}</p>
                        <p className="text-[10px] uppercase tracking-widest text-slate-400">
                          Source: {entry.sourceNotes}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleApplyScenario(entry)}
                        className={`mt-4 rounded-full px-4 py-2 text-xs font-semibold shadow transition ${
                          isActive
                            ? "bg-sky-600 text-white hover:bg-sky-500"
                            : "bg-slate-900 text-white hover:bg-slate-700"
                        }`}
                      >
                        {isActive ? "Selected" : "Load scenario"}
                      </button>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm backdrop-blur-sm lg:grid-cols-[320px,1fr]">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Persona blueprint</h2>
            <p className="text-sm text-slate-600">
              Adjust the persona, objective, and tone before you run the simulation. These fields
              influence OpenAI’s follow-up questions.
            </p>
            <fieldset className="space-y-3">
              <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Persona name
                <input
                  type="text"
                  value={persona.name}
                  onChange={(event) =>
                    setPersona((current) => ({ ...current, name: event.target.value }))
                  }
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  placeholder="e.g., Chloe – budgeting-focused power user"
                />
              </label>
              <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Archetype / background
                <textarea
                  value={persona.archetype}
                  onChange={(event) =>
                    setPersona((current) => ({ ...current, archetype: event.target.value }))
                  }
                  rows={3}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  placeholder="Summarize past conversations, job role, financial goals…"
                />
              </label>
              <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Primary objective
                <textarea
                  value={persona.objective}
                  onChange={(event) =>
                    setPersona((current) => ({ ...current, objective: event.target.value }))
                  }
                  rows={2}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  placeholder="What outcome is the user trying to achieve?"
                />
              </label>
              <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Tone & sentiment
                <textarea
                  value={persona.tone}
                  onChange={(event) =>
                    setPersona((current) => ({ ...current, tone: event.target.value }))
                  }
                  rows={2}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  placeholder="Frustrated, calm, curious, time-pressured…"
                />
              </label>
            </fieldset>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Persona controls
              </h3>
              <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Scenario seed
                <textarea
                  value={scenario}
                  onChange={(event) => setScenario(event.target.value)}
                  rows={4}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  placeholder="Outline the situation that will kick off the conversation."
                />
              </label>
              <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Max turns
                <input
                  type="number"
                  min={2}
                  max={4}
                  value={maxTurns}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    if (Number.isNaN(next)) return;
                    setMaxTurns(Math.max(2, Math.min(4, next)));
                  }}
                  className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
              </label>
              <p className="text-xs text-slate-500">
                {previewSummary} · {maxTurns} turn cap · Uses OpenAI for human follow-up.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleSimulateConversation}
                disabled={isSimulating}
                className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isSimulating ? "Simulating…" : "Run simulation"}
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={isSimulating}
                className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                Reset
              </button>
            </div>
            {simulationError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {simulationError}
              </div>
            ) : null}
          </div>

          <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-6 shadow-inner">
            <header className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                  Conversation storyboard
                </h2>
                <p className="text-xs text-slate-500">
                  Each turn is streamed as the simulation progresses. Knowledge badges reflect the
                  sources Fini cited.
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  status === "running"
                    ? "bg-emerald-100 text-emerald-700"
                    : status === "completed"
                      ? "bg-sky-100 text-sky-700"
                      : "bg-slate-200 text-slate-600"
                }`}
              >
                {status === "running" ? "Simulating" : status === "completed" ? "Completed" : "Idle"}
              </span>
            </header>

            {conversation.length === 0 ? (
              <div className="flex min-h-[12rem] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-10 text-sm text-slate-500">
                Load a scenario, adjust the persona, and click “Run simulation” to see the
                transcript populate here.
              </div>
            ) : (
              <ol className="space-y-4">
                {conversation.map((turn, index) => (
                  <li
                    key={`${turn.speaker}-${index}`}
                    className={`flex ${turn.speaker === "Fini" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-3xl border px-5 py-4 shadow-sm ${
                        turn.speaker === "Fini"
                          ? "border-sky-200 bg-sky-50"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        {turn.speaker}
                      </div>
                      <p className="mt-2 text-sm text-slate-700">{turn.content}</p>
                      {turn.escalated ? (
                        <div className="mt-3 inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-700">
                          Escalated
                        </div>
                      ) : null}
                      {turn.reasoning || (turn.knowledge && turn.knowledge.length) ? (
                        <details className="group mt-4 cursor-pointer text-left">
                          <summary className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 transition hover:text-slate-600 focus:outline-none">
                            Reasoning trace
                          </summary>
                          <div className="mt-2 space-y-3">
                            {turn.reasoning ? (
                              <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
                                {turn.reasoning}
                              </p>
                            ) : null}
                            {turn.knowledge && turn.knowledge.length ? (
                              <div className="flex flex-wrap gap-2">
                                {turn.knowledge.map((item, knowledgeIndex) => (
                                  <span
                                    key={`${item}-${knowledgeIndex}`}
                                    className="rounded-full bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500"
                                  >
                                    {item}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </details>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </section>

        <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-slate-900">Next steps</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
            <li>Persist simulated transcripts so you can review them alongside batch runs.</li>
            <li>Add grading criteria (resolution-ready, escalation handling, tone) per turn.</li>
            <li>Plug these runs into the from-conversations dashboard for side-by-side comparison.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
