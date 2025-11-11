"use client";

import { useMemo } from "react";

type FlattenedTag = {
  category: string;
  value: string;
};

const TAG_COLOR_MAP: Record<string, string> = {
  user: "bg-violet-100 text-violet-700",
  sentiment_service: "bg-emerald-100 text-emerald-700",
  segment: "bg-slate-100 text-slate-700",
  industry: "bg-slate-100 text-slate-700",
  service_positive: "bg-emerald-50 text-emerald-700",
  service_negative: "bg-rose-50 text-rose-700",
  interaction: "bg-sky-50 text-sky-700",
  tone: "bg-indigo-50 text-indigo-700",
  conversation_dynamics: "bg-amber-50 text-amber-700",
};

type TagPayload = Record<string, unknown>;

export const parseTagPayload = (input: unknown): TagPayload | null => {
  if (!input) return null;
  if (typeof input === "string") {
    try {
      return JSON.parse(input);
    } catch {
      return null;
    }
  }
  if (typeof input === "object") {
    return input as TagPayload;
  }
  return null;
};

const flattenTagValues = (tag: unknown): FlattenedTag[] => {
  const data = parseTagPayload(tag);
  if (!data) return [];

  const entries: FlattenedTag[] = [];
  const pushSingle = (category: string, value?: string | null) => {
    if (!value) return;
    if (value === "unknown" && category !== "user" && category !== "sentiment_service") return;
    entries.push({ category, value });
  };
  const pushArray = (category: string, list?: unknown[]) => {
    if (!Array.isArray(list)) return;
    list.forEach((value) => {
      if (typeof value === "string" && value) {
        pushSingle(category, value);
      }
    });
  };

  pushSingle("user", typeof data.user === "string" ? data.user : undefined);
  pushSingle("sentiment_service", typeof data.sentiment_service === "string" ? data.sentiment_service : undefined);
  pushSingle("segment", typeof data.segment === "string" ? data.segment : undefined);
  pushSingle("industry", typeof data.industry === "string" ? data.industry : undefined);
  pushArray("service_positive", Array.isArray(data.service_positive) ? (data.service_positive as unknown[]) : undefined);
  pushArray("service_negative", Array.isArray(data.service_negative) ? (data.service_negative as unknown[]) : undefined);
  pushArray("interaction", Array.isArray(data.interaction) ? (data.interaction as unknown[]) : undefined);
  pushArray("tone", Array.isArray(data.tone) ? (data.tone as unknown[]) : undefined);
  pushArray(
    "conversation_dynamics",
    Array.isArray(data.conversation_dynamics) ? (data.conversation_dynamics as unknown[]) : undefined,
  );

  return entries;
};

type TagDisplayProps = {
  tag: unknown;
  dataTourId?: string;
};

export function TagPills({ tag, dataTourId }: TagDisplayProps) {
  const items = useMemo(() => flattenTagValues(tag), [tag]);
  if (!items.length) return null;

  return (
    <div
      data-tour-id={dataTourId}
      className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white/80 p-3 shadow-inner"
    >
      {items.map((item, index) => (
        <span
          // eslint-disable-next-line react/no-array-index-key
          key={`${item.category}-${item.value}-${index}`}
          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
            TAG_COLOR_MAP[item.category] ?? "bg-slate-100 text-slate-700"
          }`}
        >
          <span className="text-[10px] uppercase tracking-wide text-slate-600">
            {item.category.replace(/_/g, " ")}
          </span>
          <span>{item.value}</span>
        </span>
      ))}
    </div>
  );
}

export function TagSummary({ tag, dataTourId }: TagDisplayProps) {
  const payload = useMemo(() => parseTagPayload(tag), [tag]);
  const summary = typeof payload?.conversation_summary === "string" ? payload.conversation_summary.trim() : "";
  if (!summary) return null;

  return (
    <div
      data-tour-id={dataTourId}
      className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-inner"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Summary</p>
      <p className="mt-1 text-sm text-slate-700">{summary}</p>
    </div>
  );
}

export function TagReasoning({ tag, dataTourId }: TagDisplayProps) {
  const payload = useMemo(() => parseTagPayload(tag), [tag]);
  const reasoning = typeof payload?.reasoning === "string" ? payload.reasoning.trim() : "";
  if (!reasoning) return null;

  return (
    <div
      data-tour-id={dataTourId}
      className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-inner"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reasoning</p>
      <p className="mt-1 text-sm text-slate-700">{reasoning}</p>
    </div>
  );
}
