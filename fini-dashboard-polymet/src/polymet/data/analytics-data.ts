export interface Metric {
  label: string;
  value: string | number;
  change?: string;
  changeType?: "increase" | "decrease" | "neutral";
  info?: string;
}

export interface UsageDataPoint {
  date: string;
  value: number;
}

export const metrics: Metric[] = [
  {
    label: "Usage",
    value: 231,
    change: "6k from previous 31 days",
    changeType: "decrease",
    info: "Total number of conversations",
  },
  {
    label: "Fini Resolution Rate",
    value: "90.9%",
    change: "50% from previous 31 days",
    changeType: "increase",
    info: "Percentage of conversations resolved by AI",
  },
  {
    label: "Agent Transfer Rate",
    value: "9.1%",
    change: "77% from previous 31 days",
    changeType: "decrease",
    info: "Percentage of conversations transferred to human agents",
  },
  {
    label: "CSAT",
    value: "0%",
    change: "100% from previous 31 days",
    changeType: "decrease",
    info: "Customer satisfaction score",
  },
  {
    label: "Content in KB",
    value: "100%",
    change: "Same as previous period",
    changeType: "neutral",
    info: "Knowledge base content coverage",
  },
];

export const usageData: UsageDataPoint[] = [
  { date: "2025-10-03", value: 0 },
  { date: "2025-10-10", value: 0 },
  { date: "2025-10-17", value: 0 },
  { date: "2025-10-24", value: 115 },
  { date: "2025-10-31", value: 116 },
];
