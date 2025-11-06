export type ChannelOption = "All Channels" | "Chat" | "Email" | "WhatsApp";

export type IntentOption =
  | "All Intents"
  | "Cancellations"
  | "Refunds"
  | "Payments"
  | "Login Issues"
  | "Product Questions";

export type FilterState = {
  channel: ChannelOption;
  intent: IntentOption;
};

export type ConversationMessage = {
  role: "Customer" | "Agent" | "Fini";
  message: string;
};

export type ConversationTimelineEvent = {
  label: string;
  timestamp: string;
  durationMs?: number;
  notes?: string;
};

export type ConversationRecord = {
  id: string;
  timestamp: string;
  customer: string;
  source?: string | null;
  channel: ChannelOption;
  language: "English";
  intent: IntentOption;
  resolutionOutcome: "Resolved" | "Escalated" | "Pending";
  accuracyScore: number;
  timeToResolve?: string;
  escalationCorrect: boolean;
  confidence: number;
  userQuery: string;
  finiResponse: string;
  humanResponse: string;
  knowledgeUsed: string[];
  knowledgeDetails?: Array<{ label: string; content?: string; sourceType?: string; sourceId?: string; title?: string }>;
  reasoningSummary: {
    planning: string;
    knowledgeSearch: string;
    responseStrategy: string;
  };
  timeline: ConversationTimelineEvent[];
  conversation: {
    human: ConversationMessage[];
    fini: ConversationMessage[];
  };
  categories?: string[];
  preview?: string;
  evaluation?: {
    intentUnderstood?: boolean | null;
    resolutionReady?: boolean | null;
    languageMatch?: boolean | null;
    rationale?: string;
    comparisonTag?: "better" | "on_par" | "worse" | "different";
    comparisonRationale?: string;
  };
};

