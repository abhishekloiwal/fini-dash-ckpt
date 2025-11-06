export type DateRangeOption = "Last 7 days" | "Last 30 days" | "Last 90 days" | "Custom";
export type ChannelOption = "All Channels" | "Chat" | "Email" | "WhatsApp";
export type LanguageOption = "English" | "Spanish" | "French";
export type IntentOption = "All Intents" | "Cancellations" | "Refunds" | "Payments" | "Login Issues" | "Shipping" | "Product Questions";

export type FilterState = { dateRange: DateRangeOption; channel: ChannelOption; intent: IntentOption };
export type Metric = { label: string; value: string; tooltip: string; deltaLabel: string; deltaValue: string; trend?: Array<{ label: string; value: number }>; };
export type ConversationTimelineEvent = { label: string; timestamp: string; durationMs?: number; notes?: string };
export type ConversationMessage = { role: "Customer" | "Agent" | "Fini"; message: string };
export type ConversationRecord = {
  id: string; timestamp: string; customer: string; source?: string | null; channel: ChannelOption; language: LanguageOption; intent: IntentOption; resolutionOutcome: "Resolved" | "Escalated" | "Pending"; accuracyScore: number; sentimentScore?: number; timeToResolve?: string; escalationCorrect: boolean; confidence: number; userQuery: string; finiResponse: string; humanResponse: string; knowledgeUsed: string[]; knowledgeDetails?: Array<{ label: string; content?: string; sourceType?: string; sourceId?: string; title?: string }>; reasoningSummary: { planning: string; knowledgeSearch: string; responseStrategy: string }; timeline: ConversationTimelineEvent[]; conversation: { human: ConversationMessage[]; fini: ConversationMessage[] }; categories?: string[]; preview?: string; evaluation?: { intentUnderstood?: boolean | null; resolutionReady?: boolean | null; languageMatch?: boolean | null; rationale?: string; comparisonTag?: "better" | "on_par" | "worse" | "different"; comparisonRationale?: string }; };

export type SimulationDataPoint = { dataset: string; intent: IntentOption; channel: ChannelOption | "Mixed"; language: LanguageOption | "Mixed"; summary: { resolutionRate: number; accuracy: number; csat: number; escalationRate: number; escalationCorrectness: number }; preview: Array<{ title: string; prompt: string; finiAnswer: string; confidence: number }>; };
export type ComparisonSnapshot = { intent: IntentOption; channel: ChannelOption | "All Channels"; highlights: string; metrics: Array<{ label: string; fini: string; human: string; delta: string; positive: boolean }>; };

export const filterOptions: { dateRanges: DateRangeOption[]; channels: ChannelOption[]; intents: IntentOption[] } = {
  dateRanges: ["Last 7 days", "Last 30 days", "Last 90 days", "Custom"],
  channels: ["All Channels", "Chat", "Email", "WhatsApp"],
  intents: ["All Intents", "Cancellations", "Refunds", "Payments", "Login Issues", "Shipping", "Product Questions"],
};

const baseMetrics: Record<string, [number, number, number]> = { overall: [86, 95, 12], chat: [90, 96, 10], email: [82, 94, 18], whatsapp: [84, 95, 14], cancellations: [88, 97, 11], refunds: [78, 92, 19], payments: [92, 98, 9], "login issues": [94, 99, 7] };
const metricTemplates = [ { key: "resolutionRate", label: "Resolution Rate", tooltip: "Simulated human replies for multi-turn conversations and API actions.", formatter: (v:number)=>`${v}%`, delta: "Simulation coverage" }, { key: "accuracy", label: "Accuracy Score", tooltip: "Percent of responses grounded in verified knowledge.", formatter: (v:number)=>`${v}%`, delta: "Traceable knowledge match" }, { key: "avgResolutionTime", label: "Avg Resolution Time", tooltip: "Average handle time for fully resolved tickets.", formatter: (v:number)=>`${v} sec`, delta: "Median response speed" } ] as const;
const metricTrends: Record<string, Array<{ label: string; value: number }>> = { resolutionRate: [ { label: "Mon", value: 89 }, { label: "Tue", value: 90 }, { label: "Wed", value: 91 }, { label: "Thu", value: 92 }, { label: "Fri", value: 93 } ], avgResolutionTime: [ { label: "Mon", value: 14 }, { label: "Tue", value: 12 }, { label: "Wed", value: 12 }, { label: "Thu", value: 10 }, { label: "Fri", value: 10 } ], accuracy: [ { label: "Mon", value: 92 }, { label: "Tue", value: 93 }, { label: "Wed", value: 94 }, { label: "Thu", value: 95 }, { label: "Fri", value: 95 } ] };

const baseFilterState: FilterState = { dateRange: "Last 30 days", channel: "All Channels", intent: "All Intents" };
export const defaultFilters = baseFilterState;
const recordKey = (f: FilterState) => [f.channel.toLowerCase(), f.intent.toLowerCase()].join("|");
const metricsLookup = new Map<string, [number, number, number]>([
  [recordKey(baseFilterState), baseMetrics.overall],
  [recordKey({ ...baseFilterState, channel: "Chat" }), baseMetrics.chat],
  [recordKey({ ...baseFilterState, channel: "Email" }), baseMetrics.email],
  [recordKey({ ...baseFilterState, channel: "WhatsApp" }), baseMetrics.whatsapp],
  [recordKey({ ...baseFilterState, intent: "Cancellations" }), baseMetrics.cancellations],
  [recordKey({ ...baseFilterState, intent: "Refunds" }), baseMetrics.refunds],
  [recordKey({ ...baseFilterState, intent: "Payments" }), baseMetrics.payments],
  [recordKey({ ...baseFilterState, intent: "Login Issues" }), baseMetrics["login issues"]],
]);

export const getMetricsForFilters = (filters: FilterState): Metric[] => {
  const matchKey = recordKey(filters);
  const values = metricsLookup.get(matchKey) ?? metricsLookup.get(recordKey({ ...baseFilterState, channel: filters.channel })) ?? metricsLookup.get(recordKey({ ...baseFilterState, intent: filters.intent })) ?? metricsLookup.get(recordKey(baseFilterState)) ?? baseMetrics.overall;
  return metricTemplates.map((template, index) => ({ label: template.label, value: template.formatter(values[index]), tooltip: template.tooltip, deltaLabel: template.delta, deltaValue: template.delta, trend: metricTrends[template.key] }));
};

export const simulationData: SimulationDataPoint[] = [ { dataset: "Historic Zendesk Conversations", intent: "All Intents", channel: "Mixed", language: "Mixed", summary: { resolutionRate: 92, accuracy: 95, csat: 4.7, escalationRate: 8, escalationCorrectness: 94 }, preview: [ { title: "Subscription Upgrade", prompt: "How can I upgrade from Standard to Premium mid-cycle?", finiAnswer: "You can upgrade immediately from the Billing > Plans tab. Fini will prorate the cost and activate Premium instantly.", confidence: 93 }, { title: "Order Shipment Delay", prompt: "My order hasn’t shipped yet. Can you check the status?", finiAnswer: "Order #45829 is scheduled for shipment tomorrow due to warehouse backlog. You’ll receive a tracking link once it departs.", confidence: 89 } ] } ];

export const comparisonSnapshots: ComparisonSnapshot[] = [ { intent: "All Intents", channel: "All Channels", highlights: "Fini resolves faster across every channel while maintaining higher accuracy and sentiment than historical agents.", metrics: [ { label: "Resolution Rate", fini: "92%", human: "84%", delta: "+8%", positive: true }, { label: "Factual Accuracy", fini: "95%", human: "87%", delta: "+8%", positive: true }, { label: "Time to Resolve", fini: "0:11", human: "1:48", delta: "↓ 82%", positive: true }, { label: "Predicted CSAT", fini: "4.7 / 5", human: "4.1 / 5", delta: "+0.6", positive: true } ] } ];

export const conversations: ConversationRecord[] = [];

