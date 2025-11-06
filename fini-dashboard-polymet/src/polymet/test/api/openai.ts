const OPENAI_KEY = (import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.NEXT_PUBLIC_OPENAI_API_KEY) as
  | string
  | undefined;

const model = "gpt-4o-mini";

export async function judgeIntentResolutionLanguage(question: string, answer: string) {
  if (!OPENAI_KEY) return null;
  const system =
    "You are grading a customer support assistant. Reply in JSON only with keys intent_understood, resolution_ready, language_match (values 'pass' or 'fail') and rationale." +
    "\n- intent_understood: PASS if the reply addresses the user's request." +
    "\n- resolution_ready: PASS if the reply gives a complete, actionable next step or confirms none is needed." +
    "\n- language_match: PASS if reply matches the user's main language unless asked otherwise.";

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({
      model,
      temperature: 0,
      messages: [
        { role: "system", content: system },
        { role: "user", content: `User message:\n${question}\n\nAssistant reply:\n${answer}\n\nRespond with JSON only.` },
      ],
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const raw = data.choices?.[0]?.message?.content?.trim() ?? "";
  const json = raw.match(/\{[\s\S]*\}/)?.[0];
  if (!json) return null;
  const parsed = JSON.parse(json) as Record<string, unknown>;
  const norm = (v: unknown) => (typeof v === "string" ? (v.toLowerCase() === "pass" ? true : v.toLowerCase() === "fail" ? false : null) : null);
  return {
    intentUnderstood: norm(parsed.intent_understood),
    resolutionReady: norm(parsed.resolution_ready),
    languageMatch: norm(parsed.language_match),
    rationale: typeof parsed.rationale === "string" ? parsed.rationale : undefined,
  } as const;
}

export async function compareHumanVsFini(question: string, humanReply: string, finiReply: string) {
  if (!OPENAI_KEY) return null;
  const system =
    "Compare two support replies (Fini vs Human) to the same user request. Reply in JSON only with keys: comparison ('better' | 'on_par' | 'worse' | 'different') and rationale." +
    "\nScoring rules (be conservative):" +
    "\n- better: Fini is clearly superior: more accurate, safer, and gives concrete next steps." +
    "\n- on_par: Minor differences only — treat as parity by default." +
    "\n- worse: Use only if Fini is clearly incorrect, unsafe, or omits a critical action (strict)." +
    "\n- different: Both valid but materially different paths; neither strictly better.";

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({
      model,
      temperature: 0,
      messages: [
        { role: "system", content: system },
        { role: "user", content: `User message:\n${question}\n\nHuman reply:\n${humanReply}\n\nFini reply:\n${finiReply}\n\nRespond with JSON only.` },
      ],
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const raw = data.choices?.[0]?.message?.content?.trim() ?? "";
  const json = raw.match(/\{[\s\S]*\}/)?.[0];
  if (!json) return null;
  const parsed = JSON.parse(json) as Record<string, unknown>;
  const tagRaw = typeof parsed.comparison === "string" ? parsed.comparison.trim().toLowerCase() : "";
  let tag = ["better", "on_par", "worse", "different"].includes(tagRaw)
    ? (tagRaw as "better" | "on_par" | "worse" | "different")
    : ("different" as const);
  const rationale = typeof parsed.rationale === "string" ? parsed.rationale : "";
  if (tag === "worse") {
    const r = rationale.toLowerCase();
    const strong = ["incorrect", "unsafe", "wrong", "misleading", "omits", "missing key", "does not address", "no steps", "incomplete guidance"];
    if (!strong.some((s) => r.includes(s))) tag = "on_par";
  }
  return { tag, rationale } as const;
}
