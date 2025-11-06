export interface HistoryItem {
  id: string;
  source: string;
  question: string;
  categories: string;
  ticketId: string;
  receivedOn: string;
}

export const historyItems: HistoryItem[] = [
  {
    id: "1",
    source: "API",
    question:
      "New institution report for: Assiniboine Credit Union - Online Banking User's chosen option: Account dat...",
    categories: "Fini-Other",
    ticketId: "-",
    receivedOn: "2 minutes ago",
  },
  {
    id: "2",
    source: "API",
    question:
      "New institution report for: Mohela - Federal Student Loan User's chosen option: Account data is delaye...",
    categories: "fini-Other",
    ticketId: "-",
    receivedOn: "2 minutes ago",
  },
  {
    id: "3",
    source: "API",
    question:
      "New institution report for: Rogers Bank (Canada) User's chosen option: Cannot connect to institution A...",
    categories: "Fini-Other",
    ticketId: "-",
    receivedOn: "2 minutes ago",
  },
  {
    id: "4",
    source: "API",
    question:
      "New institution report for: Scotiabank User's chosen option: Account data is delayed or not updating A...",
    categories: "Fini-Other",
    ticketId: "-",
    receivedOn: "3 minutes ago",
  },
  {
    id: "5",
    source: "API",
    question:
      "Downloading Filtered Transactions Extremely frustrating situation. I carefully filter transactions from a p...",
    categories: "Fini-Other",
    ticketId: "-",
    receivedOn: "3 minutes ago",
  },
  {
    id: "6",
    source: "API",
    question:
      "This does not work. While I can upload .csv files to this account, that is not a permanent solution. I wou...",
    categories: "fini-Other",
    ticketId: "-",
    receivedOn: "3 minutes ago",
  },
  {
    id: "7",
    source: "API",
    question:
      "Hi Jhammy, Thanks for combining the tickets the chat bot kept generating duplicates by mistake. Cenla...",
    categories: "fini-Other",
    ticketId: "-",
    receivedOn: "3 minutes ago",
  },
  {
    id: "8",
    source: "API",
    question:
      "Hi - yes, I tried deleting the login and adding again. This time it worked. Please close the ticket. Thanks...",
    categories: "fini-Other",
    ticketId: "-",
    receivedOn: "3 minutes ago",
  },
  {
    id: "9",
    source: "API",
    question:
      "New institution report for: Morgan Stanley - StockPlan Connect / Benefit Access User's chosen option: ...",
    categories: "Fini-Other",
    ticketId: "-",
    receivedOn: "3 minutes ago",
  },
  {
    id: "10",
    source: "API",
    question:
      "I resolved the issue. I had added the categories as income versus expenses. Sent from my iPhone",
    categories: "fini-Other",
    ticketId: "-",
    receivedOn: "3 minutes ago",
  },
  {
    id: "11",
    source: "API",
    question:
      "New institution report for: Vanguard User's chosen option: Account data is delayed or not updating Ad...",
    categories: "Fini-Other",
    ticketId: "-",
    receivedOn: "3 minutes ago",
  },
  {
    id: "12",
    source: "API",
    question:
      "Monarch Money - Pilgrim Bank (TX) Hi Monarch Money, I am reaching out on behalf of Pilgrim Bank, wh...",
    categories: "fini-Other",
    ticketId: "-",
    receivedOn: "3 minutes ago",
  },
];
