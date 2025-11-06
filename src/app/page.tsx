"use client";

import { useMemo, useState } from "react";
import FiltersBar from "@/components/filters-bar";
import MetricCard from "@/components/metric-card";
import SimulationPanel from "@/components/simulation-panel";
import TraceabilityExplorer from "@/components/traceability-explorer";
import DataSummary from "@/components/data-summary";
import { defaultFilters, getMetricsForFilters, type FilterState } from "@/data/mockData";

export default function Home() {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const metrics = useMemo(() => getMetricsForFilters(filters), [filters]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-white text-slate-900">
      <main className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-12 font-sans lg:px-8 lg:py-16">
        <header className="rounded-3xl border border-slate-200 bg-white/80 p-10 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
                Fini Performance Report
              </h1>
              <p className="text-base text-slate-600 md:text-lg">
                See how Fini performed using only the past conversations and support documents you
                provided. Below is your instant coverage report.
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

        <SimulationPanel
          fetchedConversations={[]}
          isFetching={false}
          fetchError={null}
          isSimulating={false}
          onFetchConversations={() => undefined}
          onRunSimulation={() => undefined}
        />

        <TraceabilityExplorer filters={filters} />

        <DataSummary />
      </main>
    </div>
  );
}
