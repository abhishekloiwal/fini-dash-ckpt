import type { Metric } from "@/data/mockData";
import Sparkline from "./sparkline";

type MetricCardProps = {
  metric: Metric;
};

const MetricCard = ({ metric }: MetricCardProps) => {
  return (
    <article className="flex h-full w-full flex-col justify-between rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-medium text-slate-500">{metric.label}</h3>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{metric.value}</p>
        </div>
        <span className="inline-flex items-center rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-600">
          {metric.deltaLabel}
        </span>
      </div>
      <p className="mt-4 text-sm text-slate-500">{metric.tooltip}</p>
      {metric.trend ? (
        <div className="mt-6 flex items-end justify-between">
          <Sparkline data={metric.trend} title={`${metric.label} trend`} />
          <div className="text-right text-xs text-slate-400">
            <p>Trend (last 5 days)</p>
            <p>Mock data</p>
          </div>
        </div>
      ) : null}
    </article>
  );
};

export default MetricCard;
