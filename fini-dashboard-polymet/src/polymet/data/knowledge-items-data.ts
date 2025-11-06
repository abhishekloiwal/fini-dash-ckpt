export interface KnowledgeItem {
  id: number;
  question: string;
  answer: string;
  status: "LIVE" | "DRAFT" | "ARCHIVED";
  categories?: string[];
  subcategories?: string[];
  keywords?: string[];
}

export const knowledgeItems: KnowledgeItem[] = [
  {
    id: 137,
    question: "How do I export my data out of ...",
    answer: "You can use our Mint Data Expo...",
    status: "LIVE",
  },
  {
    id: 136,
    question: "How do I make sure my .CSV is ...",
    answer: "If you are importing directly fro...",
    status: "LIVE",
  },
  {
    id: 135,
    question: "How do I import my data from ...",
    answer: "To import your Mint data into M...",
    status: "LIVE",
  },
  {
    id: 134,
    question: "Can I import my balance history...",
    answer: "You can import all your Mint acc...",
    status: "LIVE",
  },
  {
    id: 133,
    question: "Can I filter and search for Mint T...",
    answer: "You can on web! If you have syn...",
    status: "LIVE",
  },
  {
    id: 132,
    question: "Why am I getting an error when ...",
    answer: "Because one error can unfortun...",
    status: "LIVE",
  },
  {
    id: 131,
    question: "Can I have gaps in my balance h...",
    answer: "You can have gaps in the dates ...",
    status: "LIVE",
  },
  {
    id: 130,
    question: "What do I do when I can't conn...",
    answer: "If you are experiencing issues w...",
    status: "LIVE",
  },
  {
    id: 129,
    question: "What if my bank institution is no...",
    answer: "You can request that we suppor...",
    status: "LIVE",
  },
  {
    id: 128,
    question: "Monarch v/s Mint",
    answer: "-- Monarch Flexible budgeting t...",
    status: "LIVE",
  },
  {
    id: 127,
    question: "In cash flow, which transactions...",
    answer: "In cash flow, Total Savings and ...",
    status: "LIVE",
  },
  {
    id: 126,
    question: "I have a loan account with Earn...",
    answer: "Have you attempted a force refr...",
    status: "LIVE",
  },
  {
    id: 125,
    question: "John Hancock Retirement Plan ...",
    answer: "I recommend trying to add the i...",
    status: "LIVE",
  },
];
