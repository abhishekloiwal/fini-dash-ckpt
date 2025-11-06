const BASE = "https://api-prod.usefini.com/v2/bots";

const FINI_KEY = (import.meta.env.VITE_FINI_API_KEY || import.meta.env.NEXT_PUBLIC_FINI_API_KEY) as
  | string
  | undefined;

export type FiniAskResponse = {
  answer?: string;
  answer_uuid?: string;
  based_on?: unknown;
  function_call?: { name?: string; arguments?: unknown };
  conversation_id?: string;
  language?: string;
};

export async function finiAskQuestion(question: string) {
  if (!FINI_KEY) throw new Error("Fini API key missing: set VITE_FINI_API_KEY in .env.local");
  const res = await fetch(`${BASE}/ask-question`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${FINI_KEY}`,
    },
    body: JSON.stringify({ question, messageHistory: [], temperature: 0.2 }),
  });
  if (!res.ok) throw new Error((await res.text()) || `Fini ask failed (${res.status})`);
  return (await res.json()) as FiniAskResponse;
}

export type ApiConversation = {
  id: string;
  source?: string | null;
  channel?: string | null;
  escalation?: boolean;
  categories?: string[];
  createdAt?: number;
  updatedAt?: number;
  botRequests?: Array<{
    question?: string;
    answer?: string;
    reasoning?: string | null;
    escalation?: boolean;
    createdAt?: number;
  }>;
};

export async function finiListConversations(opts: { limit: number; startEpoch?: number; endEpoch?: number }) {
  if (!FINI_KEY) throw new Error("Fini API key missing: set VITE_FINI_API_KEY in .env.local");
  const url = new URL(`${BASE}/requests/public`);
  url.searchParams.set("limit", String(Math.max(1, Math.min(50, opts.limit))));
  if (opts.startEpoch) url.searchParams.set("startEpoch", String(opts.startEpoch));
  if (opts.endEpoch) url.searchParams.set("endEpoch", String(opts.endEpoch));
  const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${FINI_KEY}` } });
  if (!res.ok) throw new Error((await res.text()) || `Fini history failed (${res.status})`);
  const data = (await res.json()) as { conversations: ApiConversation[] };
  return data.conversations ?? [];
}
