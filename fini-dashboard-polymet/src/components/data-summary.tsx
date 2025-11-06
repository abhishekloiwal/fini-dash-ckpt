"use client";

const DataSummary = () => {
  const handleExport = (format: "csv" | "pdf" | "api") => {
    const message =
      format === "api"
        ? "API call simulated. Use /api/dashboard-metrics for programmatic access."
        : `Mock export generated as ${format.toUpperCase()}.`;
    window.alert(message);
  };

  return (
    <section className="grid gap-5 rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-sm backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Data Summary & Export</h2>
          <p className="text-sm text-slate-500">
            Share CX performance snapshots or plug results into your reporting stack.
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          Export-ready mock data
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <ExportButton
          label="Download CSV"
          description="Metric breakdown for selected filters"
          onClick={() => handleExport("csv")}
        />
        <ExportButton
          label="Generate PDF"
          description="Executive-ready snapshot with charts"
          onClick={() => handleExport("pdf")}
        />
        <ExportButton
          label="API Endpoint"
          description="Mock endpoint: /api/dashboard-metrics"
          onClick={() => handleExport("api")}
        />
      </div>

      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-xs text-slate-500">
        <p className="font-semibold text-slate-600">Future-ready hooks:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Multi-turn persona simulations with scripted journeys.</li>
          <li>Real-time industry benchmarks with anonymized aggregate data.</li>
          <li>Continuous learning tracker to visualize improvement over time.</li>
        </ul>
      </div>
    </section>
  );
};

type ExportButtonProps = {
  label: string;
  description: string;
  onClick: () => void;
};

const ExportButton = ({ label, description, onClick }: ExportButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white px-4 py-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-lg"
  >
    <div>
      <p className="text-sm font-semibold text-slate-700">{label}</p>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </div>
    <span className="mt-3 text-xs font-semibold text-sky-600">Mock action</span>
  </button>
);

export default DataSummary;

