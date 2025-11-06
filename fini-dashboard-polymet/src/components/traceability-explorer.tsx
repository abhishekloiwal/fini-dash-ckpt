"use client";

import { useMemo, useState } from "react";
import type { ConversationMessage, ConversationRecord, FilterState } from "@/data/mockData";
import { conversations } from "@/data/mockData";

type TraceabilityExplorerProps = {
  filters: FilterState;
  records?: ConversationRecord[];
};

const formatTimestamp = (isoString: string) => {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return isoString;
  }
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const day = date.getUTCDate();
  const monthLabel = date.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
  const year = date.getUTCFullYear();
  const suffix = (() => {
    const remainder = day % 10;
    if (day >= 11 && day <= 13) return "th";
    if (remainder === 1) return "st";
    if (remainder === 2) return "nd";
    if (remainder === 3) return "rd";
    return "th";
  })();
  return `${hours}:${minutes} UTC | ${day}${suffix} ${monthLabel} ${year}`;
};

const limitWords = (text: string, maxWords = 6): string => {
  const cleaned = text?.trim() ?? "";
  if (!cleaned) return "";
  const words = cleaned.split(/\s+/);
  if (words.length <= maxWords) return cleaned;
  return `${words.slice(0, maxWords).join(" ")}…`;
};

const formatSourceLabel = (source?: string | null): string | undefined => {
  if (!source) return undefined;
  const trimmed = source.trim();
  if (!trimmed) return undefined;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

const TraceabilityExplorer = ({ filters, records }: TraceabilityExplorerProps) => {
  const fallbackFiltered = useMemo(() => {
    return conversations.filter((conversation) => {
      if (filters.channel !== "All Channels" && conversation.channel !== filters.channel) return false;
      if (filters.intent !== "All Intents" && conversation.intent !== filters.intent) return false;
      return true;
    });
  }, [filters]);
  const dataset = records ? records : fallbackFiltered;
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const activeConversationId = selectedId && dataset.some((c) => c.id === selectedId) ? selectedId : dataset[0]?.id;
  const selectedConversation = dataset.find((c) => c.id === activeConversationId);
  const conversationOptions = dataset.map((conversation) => conversation.id);
  const knowledgeUsed = selectedConversation?.knowledgeUsed ?? [];
  const knowledgeDetails = selectedConversation?.knowledgeDetails ?? [];
  const evaluation = selectedConversation?.evaluation;
  const reasoningSummary = selectedConversation?.reasoningSummary ?? { planning: "Reasoning not available.", knowledgeSearch: "—", responseStrategy: "—" };
  const timelineEntries = selectedConversation?.timeline ?? [];

  return (
    <section className="grid gap-6 rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-sm backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Chat Comparison & Traceability</h2>
          <p className="text-sm text-slate-500">Compare simulated Fini responses against historical agent replies and inspect every step in the reasoning trail.</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{dataset.length > 0 ? `${dataset.length} conversations` : "No conversations yet"}</span>
      </div>

      <div className="space-y-6">
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <div className="max-h-72 overflow-y-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="sticky top-0 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Conversation</th>
                  <th className="px-4 py-3">Factual Accuracy</th>
                  <th className="px-4 py-3">Time to Resolve</th>
                  <th className="px-4 py-3">Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {dataset.map((conversation) => {
                  const previewSource = conversation.preview ?? conversation.conversation?.human?.[0]?.message ?? conversation.userQuery ?? conversation.id;
                  const preview = limitWords(previewSource, 6);
                  const details: string[] = [];
                  if (conversation.categories && conversation.categories.length) details.push(conversation.categories[0]);
                  else if (conversation.intent && conversation.intent !== "All Intents") details.push(conversation.intent);
                  if (conversation.channel && conversation.channel !== "All Channels") details.push(conversation.channel);
                  if (conversation.language && conversation.language !== "English") details.push(conversation.language);
                  const sourceLabel = formatSourceLabel(conversation.source);
                  if (sourceLabel) details.push(sourceLabel);
                  const detailText = details.length ? details.join(" · ") : undefined;
                  return (
                    <tr key={conversation.id} className={`cursor-pointer transition hover:bg-sky-50 ${conversation.id === activeConversationId ? "bg-sky-50/70" : ""}`} onClick={() => setSelectedId(conversation.id)}>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">{preview}</div>
                        {detailText ? (<div className="text-xs text-slate-500">{detailText}</div>) : null}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-700">{typeof conversation.accuracyScore === "number" ? `${conversation.accuracyScore}%` : "—"}</td>
                      <td className="px-4 py-3 font-semibold text-slate-700">{conversation.timeToResolve ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${conversation.resolutionOutcome === "Resolved" ? "bg-emerald-50 text-emerald-600" : conversation.resolutionOutcome === "Escalated" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{conversation.resolutionOutcome}</span>
                      </td>
                    </tr>
                  );
                })}
                {!dataset.length ? (
                  <tr><td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-500">{records ? "Run a simulation to populate this table." : "No conversations match the current filters."}</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        {selectedConversation ? (
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Selected Conversation</h3>
                <p className="mt-1 text-sm text-slate-600">{selectedConversation.channel ?? "Chat"} • {formatTimestamp(selectedConversation.timestamp)}</p>
              </div>
              {conversationOptions.length > 1 ? (
                <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Conversation
                  <select value={activeConversationId ?? ""} onChange={(event) => setSelectedId(event.target.value)} className="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-600 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200">
                    {conversationOptions.map((id) => (<option key={id} value={id}>{id.slice(0, 8).toUpperCase()}</option>))}
                  </select>
                </label>
              ) : null}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <ChatColumn title="Historical Human Conversation" messages={selectedConversation?.conversation?.human ?? []} />
              <ChatColumn title="Fini Simulation" messages={selectedConversation?.conversation?.fini ?? []} highlightRole="Fini" />
            </div>

            <div className="grid gap-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Internal Reasoning</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><span className="font-semibold text-slate-700">Planning:</span> {reasoningSummary.planning}</li>
                <li><span className="font-semibold text-slate-700">Knowledge Search:</span> {reasoningSummary.knowledgeSearch}</li>
                <li><span className="font-semibold text-slate-700">Response Strategy:</span> {reasoningSummary.responseStrategy}</li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Knowledge References</h4>
              {knowledgeUsed.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {(knowledgeDetails.length ? knowledgeDetails : knowledgeUsed.map((label) => ({ label })) ).map((entry, index) => {
                    const label = (entry as any).label ?? (entry as any);
                    const content = (entry as any).content as string | undefined;
                    const title = content ? (content.length > 300 ? content.slice(0, 300) + "…" : content) : undefined;
                    return (
                      <span key={`${label}-${index}`} title={title} className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">{label}</span>
                    );
                  })}
                </div>
              ) : (<p className="mt-2 text-sm text-slate-500">No knowledge references captured.</p>)}
            </div>

            <div className="mt-2 space-y-3">
              <QualityBlock title="Intent Understood" status={evaluation?.intentUnderstood === true ? "Pass" : evaluation?.intentUnderstood === false ? "Fail" : "Not evaluated"} rationale={evaluation?.rationale ?? "Reason not captured."} />
              <QualityBlock title="Resolution-Ready" status={evaluation?.resolutionReady === true ? "Pass" : evaluation?.resolutionReady === false ? "Fail" : "Not evaluated"} rationale={evaluation?.rationale ?? "Reason not captured."} />
              <QualityBlock title="Answer Comparison" status={evaluation?.comparisonTag ? evaluation.comparisonTag.replace("_"," ") : "Not evaluated"} rationale={evaluation?.comparisonRationale ?? "No comparison rationale captured."} comparison />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-sm text-slate-500">Select a conversation on the left to view the full reasoning trace.</div>
        )}
      </div>
    </section>
  );
};

type ChatColumnProps = { title: string; messages: ConversationMessage[]; highlightRole?: "Fini" | "Agent" };
const ChatColumn = ({ title, messages, highlightRole }: ChatColumnProps) => (
  <div className="space-y-3">
    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</h4>
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      {messages.map((message, index) => {
        const isCustomer = message.role === "Customer";
        const isHighlight = message.role === highlightRole;
        const isSimulatedCustomer = highlightRole === "Fini" && message.role === "Customer" && index > 0;
        const bubbleClasses = isCustomer ? (isSimulatedCustomer ? "bg-slate-200 text-slate-700" : "bg-slate-100 text-slate-700") : isHighlight ? "bg-sky-100 text-sky-700" : "bg-emerald-100 text-emerald-700";
        return (
          <div key={`${title}-${index}-${message.role}`} className={`flex ${isCustomer ? "justify-start" : "justify-end"}`}>
            <div className={`group relative max-w-[90%] rounded-2xl px-4 py-2 shadow-sm ${bubbleClasses}`} aria-label={isSimulatedCustomer ? "Simulated human response" : undefined}>
              <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">{message.role}</p>
              <p className="mt-1 text-sm leading-relaxed">{message.message}</p>
              {isSimulatedCustomer ? (
                <span className="pointer-events-none absolute -top-8 right-0 z-10 rounded-md bg-slate-900 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">Simulated human response</span>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

function QualityBlock({ title, status, rationale, comparison }: { title: string; status: string; rationale: string; comparison?: boolean }) {
  const chip = comparison ? (status === "better" ? "bg-emerald-50 text-emerald-600" : status === "on par" ? "bg-amber-50 text-amber-700" : status === "worse" ? "bg-rose-50 text-rose-600" : status === "different" ? "bg-sky-50 text-sky-600" : "bg-slate-100 text-slate-600") : status === "Pass" ? "bg-emerald-50 text-emerald-600" : status === "Fail" ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-600";
  return (
    <div className="rounded-xl border border-slate-200 bg-white/90 px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-slate-700">{title}</span>
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${chip}`}>{status}</span>
      </div>
      <p className="mt-1 text-xs text-slate-600">{rationale}</p>
    </div>
  );
}

export default TraceabilityExplorer;

