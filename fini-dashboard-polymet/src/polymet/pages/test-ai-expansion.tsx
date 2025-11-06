"use client";

import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Loader2, MessageSquareText, RefreshCw, Sparkles } from "lucide-react";

const API_ENDPOINT = "https://api-prod.usefini.com/v2/bots/ask-question";
const FINI_API_KEY = (import.meta.env.VITE_FINI_API_KEY ?? import.meta.env.NEXT_PUBLIC_FINI_API_KEY ?? "") as string;

const QUESTION_SETS: string[][] = [
  [
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
  ],
  [
    "Scotiabank keeps failing two-step verification through Plaid even though other accounts sync fine—how do I restore the connection?",
    "My Rogers credit card hasn't reconnected in months despite re-signing repeatedly—what should I do next?",
    "Mohela federal student loan shows a healthy status but an incorrect balance—how can I force the right amount to appear?",
    "Assiniboine Credit Union account hasn't updated for weeks while Monarch says it's updating—what troubleshooting steps can I take?",
    "After deleting a broken connection, Monarch still says the account is already associated—how do I clear the cached link to reconnect?",
    "My new card ending 4884 pauses syncing every other day with “data syncing is paused”—is there a way to keep it connected permanently?",
    "Plaid can't reach the Capital Group site we actually use (retirement.financialtrans.com); can Monarch add that login or suggest an alternative?",
    "Can Monarch bypass Stop Act restrictions for student loan payments, or is there another way to keep those transactions flowing?",
    "What's the best way to track a payroll deduction for a company car so it shows up correctly in my budget?",
    "Does Monarch support split transactions when importing a CSV, or how should I handle a file with lots of splits?",
    "The EZCardInfo connection errors out before sending an MFA code even though web login works—how can I stabilize the sync?",
    "Venmo reconnects sporadically; is there a checklist to follow before I escalate the connection issue?",
    "I renewed my subscription and was supposed to get a $30 credit—where can I verify that it applied?",
    "I was charged right after my trial ended and would like a refund—can you help with that?",
    "I need help linking two Novice savings accounts and can provide screenshots—what info do you need and how do I proceed?",
  ],
];

type Row = { id: string; question: string; answer?: string; error?: string; durationMs?: number };

export default function TestAiExpansion() {
  const [activeSet, setActiveSet] = useState(-1);
  const [items, setItems] = useState<string[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [running, setRunning] = useState(false);

  const handleGenerate = useCallback(() => { const next = (activeSet + 1) % QUESTION_SETS.length; setActiveSet(next); setItems(QUESTION_SETS[next]); setRows([]); }, [activeSet]);
  const canRun = useMemo(() => items.length > 0, [items]);
  const handleRun = useCallback(async () => { if (!canRun) return; setRunning(true); let working: Row[] = items.map((q, i) => ({ id: String(i), question: q })); setRows(working); for (let i = 0; i < items.length; i++) { const q = items[i]; const started = performance.now(); try { const res = await fetch(API_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${FINI_API_KEY}` }, body: JSON.stringify({ question: q, messageHistory: [], temperature: 0.2 }) }); const ansData = res.ok ? ((await res.json()) as any) : null; const ans = ansData?.answer?.trim?.() || ""; working[i] = { ...working[i], answer: ans, durationMs: performance.now() - started }; } catch (e) { working[i] = { ...working[i], error: e instanceof Error ? e.message : "error", durationMs: performance.now() - started }; } setRows([...working]); } setRunning(false); }, [items, canRun]);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[#f5f7fb] via-white to-white px-6 py-12 text-slate-900 md:px-10 lg:px-16">
      <header className="mx-auto mb-10 flex w-full max-w-6xl flex-col gap-3">
        <div className="flex items-center gap-3 text-sm text-slate-500"><Link to="/test" className="flex items-center gap-2 text-slate-500 hover:text-slate-800">Batch test</Link><span aria-hidden>›</span><span className="text-slate-700">AI‑generated questions</span></div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">AI‑generated questions</h1>
        <p className="max-w-3xl text-sm text-slate-600">Alternate between curated prompt sets, then simulate Fini's answers in sequence to inspect coverage, reasoning, and knowledge usage.</p>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 gap-6 lg:grid-cols-[320px,1fr]">
        <section className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white/90 p-7 shadow-sm shadow-slate-100">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Generation controls</h2>
            <p className="text-sm text-slate-600">We rotate between two 15‑question bundles sourced from recent customer themes. Hit generate to toggle sets, then simulate to replay them against the live Fini endpoint.</p>
          </div>
          <div className="grid gap-3">
            <button type="button" onClick={handleGenerate} className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"><RefreshCw className="h-4 w-4" />Generate 15 questions</button>
            <button type="button" onClick={handleRun} disabled={!canRun || running} className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400">{running ? (<Loader2 className="h-4 w-4 animate-spin" />) : (<MessageSquareText className="h-4 w-4" />)}{running ? "Simulating…" : "Simulate answers"}</button>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-inner">Current prompt bundle: {activeSet >= 0 ? `Set ${activeSet + 1} · ${items.length} prompts loaded` : "None loaded"}</div>
          </div>
        </section>
        <section className="rounded-3xl border border-slate-200 bg-white/90 p-7 shadow-sm shadow-slate-100">
          <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold text-slate-900">Generated questions</h2><span className="text-xs text-slate-500">{items.length} items</span></div>
          <ol className="grid gap-2">
            {items.map((q, i) => (
              <li key={`${i}-${q.slice(0,12)}`} className="rounded-lg border border-slate-200 bg-white p-3"><span className="mr-2 text-xs font-mono text-slate-400">{String(i + 1).padStart(2, "0")}</span><span className="text-sm">{q}</span></li>
            ))}
          </ol>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white/90 p-7 shadow-sm shadow-slate-100 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold text-slate-900">Generated answers</h2><span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{rows.filter((r)=>r.answer||r.error).length}/{rows.length} completed</span></div>
          <div className="grid gap-3">
            {rows.map((r, i) => (
              <details key={r.id} className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3"><div className="flex items-center gap-2 text-left text-sm"><span className="text-xs font-mono text-slate-400">{String(i + 1).padStart(2, "0")}</span><span className="font-semibold text-slate-800">{r.question}</span></div><ChevronDown className="h-4 w-4 text-slate-400" /></summary>
                <div className="border-t border-slate-100 px-4 py-3 text-sm">
                  {r.error ? (<p className="text-rose-600">Error: {r.error}</p>) : (<div className="space-y-3"><div><h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Answer</h4><p className="mt-1 whitespace-pre-wrap text-slate-800">{r.answer || "(empty)"}</p></div><div className="text-xs text-slate-500">Response time: {r.durationMs ? `${(r.durationMs/1000).toFixed(1)}s` : "—"}</div></div>)}
                </div>
              </details>
            ))}
            {!rows.length && <p className="text-sm text-slate-500">No results yet. Generate and simulate to see answers here.</p>}
          </div>
        </section>
      </main>
    </div>
  );
}

