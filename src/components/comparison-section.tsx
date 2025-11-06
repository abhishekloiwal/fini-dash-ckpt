"use client";

import { useMemo, useState } from "react";
import { comparisonSnapshots } from "@/data/mockData";

const ComparisonSection = () => {
  const options = useMemo(
    () => comparisonSnapshots.map((entry) => `${entry.intent} · ${entry.channel}`),
    [],
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSnapshot = comparisonSnapshots[activeIndex] ?? comparisonSnapshots[0];

  return (
    <section className="grid gap-6 rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-sm backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Comparison Mode</h2>
          <p className="text-sm text-slate-500">
            Quantify Fini against historical human responses for the same scope of work.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-sky-500" />
          Fini
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-slate-500" />
          Human
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {options.map((label, index) => (
          <button
            key={label}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              index === activeIndex
                ? "bg-sky-600 text-white shadow"
                : "bg-white text-slate-600 shadow-sm hover:bg-slate-100"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-inner">
        <p className="text-sm text-slate-600">{activeSnapshot.highlights}</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {activeSnapshot.metrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {metric.label}
              </p>
              <div className="mt-3 flex items-end justify-between">
                <span className="text-2xl font-semibold text-sky-600">{metric.fini}</span>
                <span className="text-sm font-semibold text-slate-500">vs {metric.human}</span>
              </div>
              <span
                className={`mt-3 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                  metric.positive ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                }`}
              >
                {metric.delta}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ComparisonSection;
