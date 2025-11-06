export type DateRangeOption = "Last 7 days" | "Last 30 days" | "Last 90 days" | "Custom";

export type ChannelOption = "All Channels" | "Chat" | "Email" | "WhatsApp";

export type LanguageOption = "English" | "Spanish" | "French";

export type IntentOption =
  | "All Intents"
  | "Cancellations"
  | "Refunds"
  | "Payments"
  | "Login Issues"
  | "Shipping"
  | "Product Questions";

export type FilterState = {
  dateRange: DateRangeOption;
  channel: ChannelOption;
  intent: IntentOption;
};

export type Metric = {
  label: string;
  value: string;
  tooltip: string;
  deltaLabel: string;
  deltaValue: string;
  trend?: Array<{ label: string; value: number }>;
};

export type ConversationTimelineEvent = {
  label: string;
  timestamp: string;
  durationMs?: number;
  notes?: string;
};

export type ConversationMessage = {
  role: "Customer" | "Agent" | "Fini";
  message: string;
};

export type ConversationRecord = {
  id: string;
  timestamp: string;
  customer: string;
  source?: string | null;
  channel: ChannelOption;
  language: LanguageOption;
  intent: IntentOption;
  resolutionOutcome: "Resolved" | "Escalated" | "Pending";
  accuracyScore: number;
  sentimentScore?: number;
  timeToResolve?: string;
  escalationCorrect: boolean;
  confidence: number;
  userQuery: string;
  finiResponse: string;
  humanResponse: string;
  knowledgeUsed: string[];
  // Optional rich knowledge entries (label + snippet) for tooltips/previews
  knowledgeDetails?: Array<{
    label: string;
    content?: string;
    sourceType?: string;
    sourceId?: string;
    title?: string;
  }>;
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
  // Optional per-conversation evaluation from LLM-as-a-judge.
  // When absent, the UI will show "Not evaluated".
  evaluation?: {
    intentUnderstood?: boolean | null;
    resolutionReady?: boolean | null;
    languageMatch?: boolean | null;
    rationale?: string;
    // Human parity comparison between Fini reply and historical human agent reply
    comparisonTag?: "better" | "on_par" | "worse" | "different";
    comparisonRationale?: string;
  };
};

export type SimulationDataPoint = {
  dataset: string;
  intent: IntentOption;
  channel: ChannelOption | "Mixed";
  language: LanguageOption | "Mixed";
  summary: {
    resolutionRate: number;
    accuracy: number;
    csat: number;
    escalationRate: number;
    escalationCorrectness: number;
  };
  preview: Array<{
    title: string;
    prompt: string;
    finiAnswer: string;
    confidence: number;
  }>;
};

export type ComparisonSnapshot = {
  intent: IntentOption;
  channel: ChannelOption | "All Channels";
  highlights: string;
  metrics: Array<{
    label: string;
    fini: string;
    human: string;
    delta: string;
    positive: boolean;
  }>;
};

export const filterOptions: {
  dateRanges: DateRangeOption[];
  channels: ChannelOption[];
  intents: IntentOption[];
} = {
  dateRanges: ["Last 7 days", "Last 30 days", "Last 90 days", "Custom"],
  channels: ["All Channels", "Chat", "Email", "WhatsApp"],
  intents: [
    "All Intents",
    "Cancellations",
    "Refunds",
    "Payments",
    "Login Issues",
    "Shipping",
    "Product Questions",
  ],
};

const baseMetrics: Record<string, [number, number, number]> = {
  overall: [86, 95, 12],
  chat: [90, 96, 10],
  email: [82, 94, 18],
  whatsapp: [84, 95, 14],
  cancellations: [88, 97, 11],
  refunds: [78, 92, 19],
  payments: [92, 98, 9],
  "login issues": [94, 99, 7],
};

const metricTemplates = [
  {
    key: "resolutionRate",
    label: "Resolution Rate",
    tooltip: "Simulated human replies for multi-turn conversations and API actions.",
    formatter: (value: number) => `${value}%`,
    delta: "Simulation coverage",
  },
  {
    key: "accuracy",
    label: "Accuracy Score",
    tooltip: "Percent of responses grounded in verified knowledge.",
    formatter: (value: number) => `${value}%`,
    delta: "Traceable knowledge match",
  },
  {
    key: "avgResolutionTime",
    label: "Avg Resolution Time",
    tooltip: "Average handle time for fully resolved tickets.",
    formatter: (value: number) => `${value} sec`,
    delta: "Median response speed",
  },
] as const;

const metricTrends: Record<string, Array<{ label: string; value: number }>> = {
  resolutionRate: [
    { label: "Mon", value: 89 },
    { label: "Tue", value: 90 },
    { label: "Wed", value: 91 },
    { label: "Thu", value: 92 },
    { label: "Fri", value: 93 },
  ],
  avgResolutionTime: [
    { label: "Mon", value: 14 },
    { label: "Tue", value: 12 },
    { label: "Wed", value: 12 },
    { label: "Thu", value: 10 },
    { label: "Fri", value: 10 },
  ],
  accuracy: [
    { label: "Mon", value: 92 },
    { label: "Tue", value: 93 },
    { label: "Wed", value: 94 },
    { label: "Thu", value: 95 },
    { label: "Fri", value: 95 },
  ],
};

const baseFilterState: FilterState = {
  dateRange: "Last 30 days",
  channel: "All Channels",
  intent: "All Intents",
};

export const defaultFilters = baseFilterState;

const recordKey = (filters: FilterState) =>
  [
    filters.channel.toLowerCase(),
    filters.intent.toLowerCase(),
  ].join("|");

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
  const values =
    metricsLookup.get(matchKey) ??
    metricsLookup.get(
      recordKey({
        ...baseFilterState,
        channel: filters.channel,
      }),
    ) ??
    metricsLookup.get(
      recordKey({
        ...baseFilterState,
        intent: filters.intent,
      }),
    ) ??
    metricsLookup.get(recordKey(baseFilterState)) ??
    baseMetrics.overall;

  return metricTemplates.map((template, index) => ({
    label: template.label,
    value: template.formatter(values[index]),
    tooltip: template.tooltip,
    deltaLabel: template.delta,
    deltaValue: template.delta,
    trend: metricTrends[template.key],
  }));
};

export const simulationData: SimulationDataPoint[] = [
  {
    dataset: "Historic Zendesk Conversations",
    intent: "All Intents",
    channel: "Mixed",
    language: "Mixed",
    summary: {
      resolutionRate: 92,
      accuracy: 95,
      csat: 4.7,
      escalationRate: 8,
      escalationCorrectness: 94,
    },
    preview: [
      {
        title: "Subscription Upgrade",
        prompt: "How can I upgrade from Standard to Premium mid-cycle?",
        finiAnswer:
          "You can upgrade immediately from the Billing > Plans tab. Fini will prorate the cost and activate Premium instantly.",
        confidence: 93,
      },
      {
        title: "Order Shipment Delay",
        prompt: "My order hasn’t shipped yet. Can you check the status?",
        finiAnswer:
          "Order #45829 is scheduled for shipment tomorrow due to warehouse backlog. You’ll receive a tracking link once it departs.",
        confidence: 89,
      },
    ],
  },
  {
    dataset: "Historic Zendesk Conversations",
    intent: "Cancellations",
    channel: "Chat",
    language: "English",
    summary: {
      resolutionRate: 82,
      accuracy: 94,
      csat: 0,
      escalationRate: 11,
      escalationCorrectness: 89,
    },
    preview: [
      {
        title: "Cancellation window",
        prompt: "Can I cancel before my renewal tomorrow?",
        finiAnswer:
          "Yes, I’ve scheduled the cancellation prior to renewal so no additional charge goes through. Access remains active until the current cycle ends.",
        confidence: 92,
      },
      {
        title: "Pause request",
        prompt: "I’d rather pause than cancel. What options do I have?",
        finiAnswer:
          "You can pause for up to 90 days from the Billing dashboard. I’ve outlined the steps and logged this preference to your account.",
        confidence: 89,
      },
    ],
  },
  {
    dataset: "Historic Zendesk Conversations",
    intent: "Refunds",
    channel: "Email",
    language: "English",
    summary: {
      resolutionRate: 68,
      accuracy: 92,
      csat: 0,
      escalationRate: 24,
      escalationCorrectness: 82,
    },
    preview: [
      {
        title: "Refund timeline",
        prompt: "I was told my refund was processed yesterday. When should I see it?",
        finiAnswer:
          "The refund cleared on our side and typically appears within 3–5 business days depending on your bank. I’ll notify you as soon as it posts.",
        confidence: 87,
      },
    ],
  },
  {
    dataset: "Historic Zendesk Conversations",
    intent: "Payments",
    channel: "Email",
    language: "English",
    summary: {
      resolutionRate: 74,
      accuracy: 96,
      csat: 0,
      escalationRate: 14,
      escalationCorrectness: 93,
    },
    preview: [
      {
        title: "Card declined abroad",
        prompt: "My card keeps failing when I try to pay from Europe.",
        finiAnswer:
          "International payments are blocked on this card. I’ve enabled your backup method and sent a reminder to enable travel mode with your bank.",
        confidence: 95,
      },
    ],
  },
  {
    dataset: "Historic Zendesk Conversations",
    intent: "Login Issues",
    channel: "Chat",
    language: "English",
    summary: {
      resolutionRate: 88,
      accuracy: 97,
      csat: 0,
      escalationRate: 6,
      escalationCorrectness: 91,
    },
    preview: [
      {
        title: "MFA fallback",
        prompt: "I can’t receive my 2FA code while traveling.",
        finiAnswer:
          "I’ve enabled email backup codes and pushed a push-notification fallback to your mobile app so you can log in while abroad.",
        confidence: 97,
      },
    ],
  },
  {
    dataset: "Knowledge Base Scenarios",
    intent: "Cancellations",
    channel: "Chat",
    language: "English",
    summary: {
      resolutionRate: 91,
      accuracy: 96,
      csat: 4.8,
      escalationRate: 7,
      escalationCorrectness: 95,
    },
    preview: [
      {
        title: "Cancel subscription after renewal",
        prompt: "I forgot to cancel and was charged again. Can I get a refund?",
        finiAnswer:
          "You’re within the 14-day grace period, so I’ve initiated the refund. Expect it in 3–5 business days.",
        confidence: 96,
      },
      {
        title: "Pause vs cancel",
        prompt: "Do you offer an option to pause rather than cancel my plan?",
        finiAnswer:
          "Yes. Choose Pause Plan inside Billing > Status. You can pause up to 90 days without losing discounts.",
        confidence: 94,
      },
    ],
  },
  {
    dataset: "Edge Case Stress Tests",
    intent: "Payments",
    channel: "Email",
    language: "English",
    summary: {
      resolutionRate: 95,
      accuracy: 97,
      csat: 4.9,
      escalationRate: 5,
      escalationCorrectness: 97,
    },
    preview: [
      {
        title: "International card decline",
        prompt: "My card keeps getting declined when I’m abroad.",
        finiAnswer:
          "Please enable international payments with your bank and add a backup payment via the Billing > Payment Methods page.",
        confidence: 97,
      },
    ],
  },
];

export const comparisonSnapshots: ComparisonSnapshot[] = [
  {
    intent: "All Intents",
    channel: "All Channels",
    highlights:
      "Fini resolves faster across every channel while maintaining higher accuracy and sentiment than historical agents.",
    metrics: [
      { label: "Resolution Rate", fini: "92%", human: "84%", delta: "+8%", positive: true },
      { label: "Factual Accuracy", fini: "95%", human: "87%", delta: "+8%", positive: true },
      { label: "Time to Resolve", fini: "0:11", human: "1:48", delta: "↓ 82%", positive: true },
      { label: "Predicted CSAT", fini: "4.7 / 5", human: "4.1 / 5", delta: "+0.6", positive: true },
    ],
  },
  {
    intent: "Cancellations",
    channel: "Chat",
    highlights:
      "Fini quickly identifies retention opportunities and escalates edge cases properly, leading to better customer sentiment.",
    metrics: [
      { label: "Resolution Rate", fini: "91%", human: "79%", delta: "+12%", positive: true },
      { label: "Accuracy", fini: "96%", human: "88%", delta: "+8%", positive: true },
      { label: "Escalation Correctness", fini: "95%", human: "81%", delta: "+14%", positive: true },
      { label: "Sentiment", fini: "4.8 / 5", human: "4.2 / 5", delta: "+0.6", positive: true },
    ],
  },
  {
    intent: "Payments",
    channel: "Email",
    highlights:
      "Payment-related emails see a major drop in over-escalation thanks to Fini’s knowledge-grounded playbooks.",
    metrics: [
      { label: "Resolution Rate", fini: "95%", human: "86%", delta: "+9%", positive: true },
      { label: "Accuracy", fini: "97%", human: "90%", delta: "+7%", positive: true },
      { label: "Sentiment", fini: "4.9 / 5", human: "4.3 / 5", delta: "+0.6", positive: true },
      { label: "Escalation Rate", fini: "5%", human: "18%", delta: "↓ 13pts", positive: true },
    ],
  },
];

export const conversations: ConversationRecord[] = [
  {
    id: "CX-48291",
    timestamp: "2024-06-12T09:18:00Z",
    customer: "Dana Romero",
    channel: "Chat",
    language: "English",
  intent: "Cancellations",
  resolutionOutcome: "Resolved",
  accuracyScore: 97,
  timeToResolve: "11 sec",
  escalationCorrect: true,
  confidence: 92,
    userQuery: "I need to cancel before my renewal tomorrow. Will I be charged?",
    finiResponse:
      "I’ve scheduled the cancellation before your renewal, so you won’t be charged. You’ll keep access until the end of the billing cycle.",
    humanResponse:
      "I can help cancel the subscription. You might still see a pending charge but it will fall off in 2-3 days.",
    knowledgeUsed: ["KB-1289: Cancellation policy", "Workflow: Scheduled cancellations"],
    reasoningSummary: {
      planning: "Confirm renewal date, assess cancellation window, avoid unnecessary escalation.",
      knowledgeSearch:
        "Fetched cancellation SLA policy and account subscription status from connected Zendesk data.",
      responseStrategy:
        "Provide reassurance, confirm no charges, explain access window, log event to CRM.",
    },
    timeline: [
      { label: "Plan", timestamp: "0ms", durationMs: 110 },
      { label: "Knowledge Search", timestamp: "110ms", durationMs: 250, notes: "Matched KB-1289" },
      { label: "Draft Response", timestamp: "360ms", durationMs: 90 },
      { label: "Deliver Reply", timestamp: "450ms", durationMs: 25 },
      { label: "CRM Update", timestamp: "475ms", durationMs: 150, notes: "Canceled renewal job queued" },
    ],
    conversation: {
      human: [
        {
          role: "Customer",
          message: "I need to cancel before my renewal tomorrow. Will I be charged?",
        },
        {
          role: "Agent",
          message:
            "I can help cancel the subscription. You might still see a pending charge but it will fall off in 2-3 days.",
        },
        {
          role: "Customer",
          message: "Will I still have access to the product after you cancel it?",
        },
        {
          role: "Agent",
          message: "Yes, you keep access until the current billing cycle ends, then it stops automatically.",
        },
      ],
      fini: [
        {
          role: "Customer",
          message: "I need to cancel before my renewal tomorrow. Will I be charged?",
        },
        {
          role: "Fini",
          message:
            "I’ve scheduled the cancellation before your renewal, so you won’t be charged. You’ll keep access until the end of the billing cycle.",
        },
        {
          role: "Customer",
          message: "Great, will I lose access right away once it’s canceled?",
        },
        {
          role: "Fini",
          message:
            "You’ll keep full access until the billing period ends tomorrow night. I’ll also send a confirmation email.",
        },
      ],
    },
  },
  {
    id: "CX-48310",
    timestamp: "2024-06-12T11:42:00Z",
    customer: "Miguel Alvarez",
    channel: "Email",
    language: "Spanish",
  intent: "Payments",
  resolutionOutcome: "Escalated",
  accuracyScore: 92,
  timeToResolve: "1m 38s",
  escalationCorrect: true,
  confidence: 88,
    userQuery:
      "Mi tarjeta fue rechazada tres veces y ya verifiqué con el banco. ¿Pueden ayudarme con otra forma de pago?",
    finiResponse:
      "Puedo habilitar el pago via transferencia bancaria y agregar un recordatorio para nuestro equipo de facturación. También puedes intentar con PayPal si prefieres.",
    humanResponse:
      "Nuestro equipo de facturación se comunicará contigo pronto para ofrecer opciones de pago alternas.",
    knowledgeUsed: ["KB-992: Métodos de pago alternativos", "Macro: Transferencia bancaria manual"],
    reasoningSummary: {
      planning: "Detect payment retries, check for manual invoicing, ensure multilingual compliance.",
      knowledgeSearch:
        "Consultó políticas de pago alternativo y verificación de riesgo para clientes enterprise.",
      responseStrategy:
        "Ofrecer opciones de pago inmediato, crear recordatorio, documentar en CRM, escalar al equipo adecuado.",
    },
    timeline: [
      { label: "Plan", timestamp: "0ms", durationMs: 160, notes: "Language: es-ES" },
      { label: "Knowledge Search", timestamp: "160ms", durationMs: 280 },
      { label: "Draft Response", timestamp: "440ms", durationMs: 140 },
      { label: "Escalation", timestamp: "580ms", durationMs: 200, notes: "Flagged billing involvement" },
      { label: "Deliver Reply", timestamp: "780ms", durationMs: 35 },
    ],
    conversation: {
      human: [
        {
          role: "Customer",
          message:
            "Mi tarjeta fue rechazada tres veces y ya verifiqué con el banco. ¿Pueden ayudarme con otra forma de pago?",
        },
        {
          role: "Agent",
          message:
            "Nuestro equipo de facturación se comunicará contigo pronto para ofrecer opciones de pago alternas.",
        },
        {
          role: "Customer",
          message: "Necesito pagar hoy. ¿Tienen transferencia bancaria o un enlace seguro?",
        },
        {
          role: "Agent",
          message: "Puedo generar una transferencia manual, pero debe aprobarla facturación primero.",
        },
      ],
      fini: [
        {
          role: "Customer",
          message:
            "Mi tarjeta fue rechazada tres veces y ya verifiqué con el banco. ¿Pueden ayudarme con otra forma de pago?",
        },
        {
          role: "Fini",
          message:
            "Puedo habilitar el pago via transferencia bancaria y agregar un recordatorio para nuestro equipo de facturación. También puedes intentar con PayPal si prefieres.",
        },
        {
          role: "Customer",
          message: "Perfecto, ¿puedes enviarme los datos de la transferencia ahora mismo?",
        },
        {
          role: "Fini",
          message:
            "Claro, te acabo de enviar la ficha de transferencia y confirmé el recordatorio para facturación. También dejé un enlace a PayPal por si prefieres usarlo.",
        },
      ],
    },
  },
  {
    id: "CX-48345",
    timestamp: "2024-06-12T14:08:00Z",
    customer: "Priya Sharma",
    channel: "Chat",
    language: "English",
  intent: "Login Issues",
  resolutionOutcome: "Resolved",
  accuracyScore: 99,
  timeToResolve: "9 sec",
  escalationCorrect: true,
  confidence: 96,
    userQuery: "I can’t receive MFA codes on my phone when I try to log in from abroad.",
    finiResponse:
      "Your account is set to SMS-only. I’ve enabled email backup codes and pushed a push-notification option via the mobile app.",
    humanResponse:
      "Please check if your phone plan allows international texts. If not, we can try email verification or escalate to security.",
    knowledgeUsed: ["KB-1455: Multi-factor authentication options", "Workflow: MFA fallback paths"],
    reasoningSummary: {
      planning: "Identify MFA method, ensure secure fallback, avoid unnecessary escalation.",
      knowledgeSearch:
        "Searched MFA fallback playbook, confirmed user region, retrieved new login policy updates.",
      responseStrategy:
        "Activate alternate MFA methods, confirm to user, update audit logs, monitor next login attempt.",
    },
    timeline: [
      { label: "Plan", timestamp: "0ms", durationMs: 90 },
      { label: "Knowledge Search", timestamp: "90ms", durationMs: 200, notes: "Matched MFA fallback" },
      { label: "Draft Response", timestamp: "290ms", durationMs: 120 },
      { label: "Automation", timestamp: "410ms", durationMs: 170, notes: "Enabled backup options" },
      { label: "Deliver Reply", timestamp: "580ms", durationMs: 25 },
    ],
    conversation: {
      human: [
        {
          role: "Customer",
          message: "I can’t receive MFA codes on my phone when I try to log in from abroad.",
        },
        {
          role: "Agent",
          message:
            "Please check if your phone plan allows international texts. If not, we can try email verification or escalate to security.",
        },
        {
          role: "Customer",
          message: "Can you enable email codes for me now? I need access urgently.",
        },
        {
          role: "Agent",
          message: "I’ve sent a request to security—they’ll enable it shortly.",
        },
      ],
      fini: [
        {
          role: "Customer",
          message: "I can’t receive MFA codes on my phone when I try to log in from abroad.",
        },
        {
          role: "Fini",
          message:
            "Your account is set to SMS-only. I’ve enabled email backup codes and pushed a push-notification option via the mobile app.",
        },
        {
          role: "Customer",
          message: "Thanks! Do I need to do anything else before I log in?",
        },
        {
          role: "Fini",
          message:
            "No extra steps needed. Use the email code or push prompt on your next login. I’ve logged the change and will monitor the next attempt.",
        },
      ],
    },
  },
  {
    id: "CX-48388",
    timestamp: "2024-06-12T16:37:00Z",
    customer: "Hélène Dupont",
    channel: "Email",
    language: "French",
  intent: "Refunds",
  resolutionOutcome: "Resolved",
  accuracyScore: 90,
  timeToResolve: "2m 04s",
  escalationCorrect: false,
  confidence: 82,
    userQuery:
      "J’ai demandé un remboursement il y a cinq jours et je n’ai toujours rien reçu. Pouvez-vous vérifier ?",
    finiResponse:
      "Le remboursement a été traité hier. Selon votre banque, il peut prendre jusqu’à 3 jours ouvrés pour apparaître.",
    humanResponse:
      "Nous avons lancé le remboursement et vous devriez le recevoir sous peu. Je vais demander au service financier de confirmer.",
    knowledgeUsed: ["KB-1012: Politique de remboursement UE"],
    reasoningSummary: {
      planning: "Confirmer statut du remboursement, rassurer sur les délais, éviter double escalade.",
      knowledgeSearch:
        "Consulté la politique UE et vérifié le journal de remboursement dans Zendesk.",
      responseStrategy:
        "Communiquer délai standard, offrir suivi proactif, consigner la mise à jour pour CX manager.",
    },
    timeline: [
      { label: "Plan", timestamp: "0ms", durationMs: 120 },
      { label: "Knowledge Search", timestamp: "120ms", durationMs: 260 },
      { label: "Draft Response", timestamp: "380ms", durationMs: 130 },
      { label: "Deliver Reply", timestamp: "510ms", durationMs: 30 },
    ],
    conversation: {
      human: [
        {
          role: "Customer",
          message:
            "J’ai demandé un remboursement il y a cinq jours et je n’ai toujours rien reçu. Pouvez-vous vérifier ?",
        },
        {
          role: "Agent",
          message:
            "Nous avons lancé le remboursement et vous devriez le recevoir sous peu. Je vais demander au service financier de confirmer.",
        },
        {
          role: "Customer",
          message: "Merci. Pouvez-vous m’envoyer un suivi par email quand c’est confirmé ?",
        },
        {
          role: "Agent",
          message: "Bien sûr, je vous écris dès que j’ai la confirmation du service financier.",
        },
      ],
      fini: [
        {
          role: "Customer",
          message:
            "J’ai demandé un remboursement il y a cinq jours et je n’ai toujours rien reçu. Pouvez-vous vérifier ?",
        },
        {
          role: "Fini",
          message:
            "Le remboursement a été traité hier. Selon votre banque, il peut prendre jusqu’à 3 jours ouvrés pour apparaître.",
        },
        {
          role: "Customer",
          message: "Alertez-moi dès qu’il est visible ?",
        },
        {
          role: "Fini",
          message:
            "Je viens d’activer une alerte et je vous enverrai un email de confirmation sitôt que votre banque confirme le crédit.",
        },
      ],
    },
  },
  {
    id: "CX-48390",
    timestamp: "2024-06-12T18:05:00Z",
    customer: "Jordan Klein",
    channel: "Chat",
    language: "English",
    intent: "Shipping",
    resolutionOutcome: "Resolved",
    accuracyScore: 94,
    sentimentScore: 4.6,
    escalationCorrect: true,
    confidence: 91,
    userQuery: "My replacement order shows 'label created' for two days. When will it ship?",
    finiResponse:
      "Your replacement is queued at the Dallas warehouse and scheduled to depart tonight. I’ll push the tracking link as soon as the carrier scans it.",
    humanResponse:
      "It looks like the label was printed but the box is still waiting for pickup. I’ll nudge the warehouse and email when it moves.",
    knowledgeUsed: ["KB-2110: Replacement shipping SLAs", "Workflow: Warehouse follow-up ping"],
    reasoningSummary: {
      planning: "Confirm warehouse queue, reassure with outbound schedule, automate tracking alert.",
      knowledgeSearch:
        "Retrieved replacement order timeline, checked warehouse SLA for Dallas node, validated carrier pickup schedule.",
      responseStrategy:
        "Provide concrete departure window, trigger proactive tracking alert, log follow-up reminder.",
    },
    timeline: [
      { label: "Plan", timestamp: "0ms", durationMs: 95 },
      { label: "Knowledge Search", timestamp: "95ms", durationMs: 260, notes: "Warehouse: Dallas" },
      { label: "Draft Response", timestamp: "355ms", durationMs: 120 },
      { label: "Automation", timestamp: "475ms", durationMs: 150, notes: "Tracking alert webhook" },
      { label: "Deliver Reply", timestamp: "625ms", durationMs: 25 },
    ],
    conversation: {
      human: [
        {
          role: "Customer",
          message: "My replacement order shows 'label created' for two days. When will it ship?",
        },
        {
          role: "Agent",
          message:
            "The label is ready but the warehouse hasn’t handed it to UPS yet. I’ll ping them and update you soon.",
        },
        {
          role: "Customer",
          message: "Please let me know once it leaves. I’m heading out of town.",
        },
        {
          role: "Agent",
          message: "Will do—expect an email with tracking as soon as it moves.",
        },
      ],
      fini: [
        {
          role: "Customer",
          message: "My replacement order shows 'label created' for two days. When will it ship?",
        },
        {
          role: "Fini",
          message:
            "Your replacement is queued at the Dallas warehouse and scheduled to depart tonight. I’ll push the tracking link as soon as the carrier scans it.",
        },
        {
          role: "Customer",
          message: "Thanks. Can you confirm if it will arrive before Friday?",
        },
        {
          role: "Fini",
          message:
            "Based on the carrier route it’s due Thursday by 5pm. I’ll monitor the scan events and notify you if anything slips.",
        },
      ],
    },
  },
  {
    id: "CX-48391",
    timestamp: "2024-06-12T18:42:00Z",
    customer: "Amanda Chen",
    channel: "Email",
    language: "English",
    intent: "Refunds",
    resolutionOutcome: "Resolved",
    accuracyScore: 93,
    sentimentScore: 4.5,
    escalationCorrect: true,
    confidence: 88,
    userQuery: "The item you refunded was returned, but I only got half my money back. Why?",
    finiResponse:
      "The system kept a restocking fee because the box was missing accessories. I’ve reversed that fee and the remaining $18.50 will clear in 3 business days.",
    humanResponse:
      "Looks like there was a restocking fee. I’ll check with returns to see if we can refund the remainder.",
    knowledgeUsed: ["KB-3342: Restocking policy", "Macro: Restock fee reversal approval"],
    reasoningSummary: {
      planning: "Verify return inspection notes, determine restock fee validity, authorize reversal.",
      knowledgeSearch:
        "Pulled return QA photos, confirmed accessory checklist, referenced restocking waiver rules.",
      responseStrategy:
        "Explain deduction, waive the fee proactively, set expectation for payout timeline and log refund event.",
    },
    timeline: [
      { label: "Plan", timestamp: "0ms", durationMs: 120 },
      { label: "Knowledge Search", timestamp: "120ms", durationMs: 300, notes: "Found missing cable note" },
      { label: "Draft Response", timestamp: "420ms", durationMs: 130 },
      { label: "Automation", timestamp: "550ms", durationMs: 160, notes: "Fee reversal executed" },
      { label: "Deliver Reply", timestamp: "710ms", durationMs: 30 },
    ],
    conversation: {
      human: [
        {
          role: "Customer",
          message: "The item you refunded was returned, but I only got half my money back. Why?",
        },
        {
          role: "Agent",
          message: "Let me check with returns—there may have been a restocking deduction.",
        },
        {
          role: "Customer",
          message: "I sent everything back. Please credit the rest.",
        },
        {
          role: "Agent",
          message: "I’ll submit a request to refund the remainder once I confirm with the warehouse.",
        },
      ],
      fini: [
        {
          role: "Customer",
          message: "The item you refunded was returned, but I only got half my money back. Why?",
        },
        {
          role: "Fini",
          message:
            "The system kept a restocking fee because the box was missing accessories. I’ve reversed that fee and the remaining $18.50 will clear in 3 business days.",
        },
        {
          role: "Customer",
          message: "Appreciate it. Will I get a confirmation email?",
        },
        {
          role: "Fini",
          message:
            "Yes—an email receipt just went out and the refund event is logged in your account. I’ll notify you if the bank needs anything else.",
        },
      ],
    },
  },
  {
    id: "CX-48392",
    timestamp: "2024-06-12T19:18:00Z",
    customer: "Noah Patel",
    channel: "Chat",
    language: "English",
    intent: "Product Questions",
    resolutionOutcome: "Resolved",
    accuracyScore: 98,
    sentimentScore: 4.8,
    escalationCorrect: true,
    confidence: 95,
    userQuery: "Can the Pro plan support SSO for two different subsidiaries under one tenant?",
    finiResponse:
      "Yes. The Pro plan supports multiple SAML profiles per tenant. I’ve shared the guide and opened access for subsidiary mappings in your console.",
    humanResponse:
      "Our Pro tier supports SSO. I can send setup steps or schedule a call with solutions engineering.",
    knowledgeUsed: ["KB-4120: Multi-SAML configuration", "Guide: Tenant admin console"],
    reasoningSummary: {
      planning: "Confirm entitlement, share documentation, enable console toggle without escalation.",
      knowledgeSearch:
        "Checked plan entitlements, retrieved multi-SAML setup doc, verified tenant admin permissions.",
      responseStrategy:
        "Answer confidently, link guide, enable feature flag, invite follow-up if custom claim mapping needed.",
    },
    timeline: [
      { label: "Plan", timestamp: "0ms", durationMs: 80 },
      { label: "Knowledge Search", timestamp: "80ms", durationMs: 210, notes: "Located SAML doc" },
      { label: "Automation", timestamp: "290ms", durationMs: 160, notes: "Enabled multi-SAML toggle" },
      { label: "Draft Response", timestamp: "450ms", durationMs: 110 },
      { label: "Deliver Reply", timestamp: "560ms", durationMs: 20 },
    ],
    conversation: {
      human: [
        {
          role: "Customer",
          message: "Can the Pro plan support SSO for two different subsidiaries under one tenant?",
        },
        {
          role: "Agent",
          message: "Yes, though we might need solutions engineering to help. Want me to loop them in?",
        },
        {
          role: "Customer",
          message: "Please send me the doc. I’d like to try myself first.",
        },
        {
          role: "Agent",
          message: "I’ll email the SAML guide right after this chat.",
        },
      ],
      fini: [
        {
          role: "Customer",
          message: "Can the Pro plan support SSO for two different subsidiaries under one tenant?",
        },
        {
          role: "Fini",
          message:
            "Yes. The Pro plan supports multiple SAML profiles per tenant. I’ve shared the guide and opened access for subsidiary mappings in your console.",
        },
        {
          role: "Customer",
          message: "Great—do I need to contact anyone to add the second profile?",
        },
        {
          role: "Fini",
          message:
            "Nope, you can add it directly under Settings > Authentication. The guide I sent covers the extra entity ID fields. Ping me if you want us to review the metadata.",
        },
      ],
    },
  },
  {
    id: "CX-48393",
    timestamp: "2024-06-12T20:05:00Z",
    customer: "Elena Brooks",
    channel: "Email",
    language: "English",
    intent: "Login Issues",
    resolutionOutcome: "Resolved",
    accuracyScore: 97,
    sentimentScore: 4.7,
    escalationCorrect: true,
    confidence: 92,
    userQuery: "We had an outage this morning. Did you roll back my data? I lost a draft proposal.",
    finiResponse:
      "Your workspace was unaffected by the rollback. I restored the draft from version history and pinned it to your account at 09:17 UTC.",
    humanResponse:
      "The outage triggered a rollback, but I’m not sure if your workspace was impacted. I’ll ask engineering.",
    knowledgeUsed: ["KB-1905: Outage recovery checklist", "Audit Log: Workspace version history"],
    reasoningSummary: {
      planning: "Verify workspace rollback status, recover lost draft if possible, reassure about stability.",
      knowledgeSearch:
        "Pulled outage incident report, checked workspace snapshot log, retrieved draft from version history.",
      responseStrategy:
        "Confirm no rollback, restore draft proactively, document recovery and reassure about data integrity.",
    },
    timeline: [
      { label: "Plan", timestamp: "0ms", durationMs: 100 },
      { label: "Knowledge Search", timestamp: "100ms", durationMs: 280, notes: "Audit log review" },
      { label: "Automation", timestamp: "380ms", durationMs: 170, notes: "Restored version 17" },
      { label: "Draft Response", timestamp: "550ms", durationMs: 120 },
      { label: "Deliver Reply", timestamp: "670ms", durationMs: 25 },
    ],
    conversation: {
      human: [
        {
          role: "Customer",
          message: "We had an outage this morning. Did you roll back my data? I lost a draft proposal.",
        },
        {
          role: "Agent",
          message: "Let me confirm with engineering—there was a rollback for some tenants.",
        },
        {
          role: "Customer",
          message: "Please let me know ASAP. That draft took hours.",
        },
        {
          role: "Agent",
          message: "I’ll follow up once I hear back.",
        },
      ],
      fini: [
        {
          role: "Customer",
          message: "We had an outage this morning. Did you roll back my data? I lost a draft proposal.",
        },
        {
          role: "Fini",
          message:
            "Your workspace was unaffected by the rollback. I restored the draft from version history and pinned it to your account at 09:17 UTC.",
        },
        {
          role: "Customer",
          message: "Thank you! Where can I find it?",
        },
        {
          role: "Fini",
          message:
            "It’s in Recents > Restored Drafts with a star icon. I also emailed you a PDF copy just in case.",
        },
      ],
    },
  },
  {
    id: "CX-48394",
    timestamp: "2024-06-12T20:44:00Z",
    customer: "Marcus Rivera",
    channel: "Chat",
    language: "English",
    intent: "Payments",
    resolutionOutcome: "Resolved",
    accuracyScore: 96,
    sentimentScore: 4.6,
    escalationCorrect: true,
    confidence: 93,
    userQuery: "My invoice shows two annual renewals back to back. Can you void the duplicate?",
    finiResponse:
      "The duplicate charge triggered during yesterday’s failover retry. I’ve voided invoice #INV-7841 and sent an updated receipt reflecting a single renewal.",
    humanResponse:
      "Looks like billing tried to charge twice. I’ll alert finance so they can void the extra invoice.",
    knowledgeUsed: ["KB-2788: Duplicate renewal handling", "Billing Console: Invoice void workflow"],
    reasoningSummary: {
      planning: "Validate duplicate, void extra invoice, communicate receipt update and timeline.",
      knowledgeSearch:
        "Checked billing retries, confirmed duplicate invoice IDs, referenced void procedure.",
      responseStrategy:
        "Take ownership, void immediately, notify customer with confirmation and ledger note.",
    },
    timeline: [
      { label: "Plan", timestamp: "0ms", durationMs: 85 },
      { label: "Knowledge Search", timestamp: "85ms", durationMs: 200, notes: "Found duplicate invoice" },
      { label: "Automation", timestamp: "285ms", durationMs: 150, notes: "Voided INV-7841" },
      { label: "Draft Response", timestamp: "435ms", durationMs: 120 },
      { label: "Deliver Reply", timestamp: "555ms", durationMs: 25 },
    ],
    conversation: {
      human: [
        {
          role: "Customer",
          message: "My invoice shows two annual renewals back to back. Can you void the duplicate?",
        },
        {
          role: "Agent",
          message: "I see two charges—let me raise this with finance so they can void it.",
        },
        {
          role: "Customer",
          message: "Please confirm once it’s reversed.",
        },
        {
          role: "Agent",
          message: "I’ll email you once they process the void.",
        },
      ],
      fini: [
        {
          role: "Customer",
          message: "My invoice shows two annual renewals back to back. Can you void the duplicate?",
        },
        {
          role: "Fini",
          message:
            "The duplicate charge triggered during yesterday’s failover retry. I’ve voided invoice #INV-7841 and sent an updated receipt reflecting a single renewal.",
        },
        {
          role: "Customer",
          message: "Thanks. Will the card see a pending reversal?",
        },
        {
          role: "Fini",
          message:
            "Yes, you’ll notice the authorization drop within 1–2 business days. The ledger note is in your admin console under Billing > History.",
        },
      ],
    },
  },
];
