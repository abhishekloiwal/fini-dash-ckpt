type SparklineProps = {
  data: Array<{ label: string; value: number }>;
  title?: string;
  color?: string;
};

const Sparkline = ({ data, title, color = "#0891b2" }: SparklineProps) => {
  if (!data.length) {
    return null;
  }

  const max = Math.max(...data.map((point) => point.value));
  const min = Math.min(...data.map((point) => point.value));
  const range = max - min || 1;
  const width = 120;
  const height = 38;
  const step = width / Math.max(data.length - 1, 1);

  const points = data
    .map((point, index) => {
      const x = index * step;
      const y = height - ((point.value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      role="img"
      aria-label={title ?? "Metric trend sparkline"}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="text-sky-500"
    >
      <polyline
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      {data.map((point, index) => {
        const x = index * step;
        const y = height - ((point.value - min) / range) * height;
        return <circle key={point.label} cx={x} cy={y} r={2} fill={color} />;
      })}
    </svg>
  );
};

export default Sparkline;

