export interface ExternalKnowledgeItem {
  id: string;
  type: "zendesk" | "link" | "file" | "google-drive" | "notion" | "confluence";
  title: string;
  status: "active" | "inactive";
  paragraphs: number;
}

export const externalKnowledgeItems: ExternalKnowledgeItem[] = [
  {
    id: "1",
    type: "zendesk",
    title: "Canadian Connection Statuses",
    status: "active",
    paragraphs: 0,
  },
  {
    id: "2",
    type: "zendesk",
    title: "US Connection Statuses",
    status: "active",
    paragraphs: 0,
  },
  {
    id: "3",
    type: "zendesk",
    title:
      "How clients can apply a sponsorship code to an existing Monarch account",
    status: "active",
    paragraphs: 0,
  },
  {
    id: "4",
    type: "zendesk",
    title: "Using Reports",
    status: "active",
    paragraphs: 0,
  },
  {
    id: "5",
    type: "zendesk",
    title: "Using the Monarch Retail Sync Extension",
    status: "active",
    paragraphs: 0,
  },
  {
    id: "6",
    type: "zendesk",
    title: "FAQ: Login Security & Issues",
    status: "active",
    paragraphs: 0,
  },
  {
    id: "7",
    type: "zendesk",
    title: "AI in Monarch",
    status: "active",
    paragraphs: 0,
  },
  {
    id: "8",
    type: "zendesk",
    title: "Transfer Balance and/or Transaction History to Another Account",
    status: "active",
    paragraphs: 0,
  },
  {
    id: "9",
    type: "zendesk",
    title: "Creating Transaction Rules",
    status: "active",
    paragraphs: 0,
  },
  {
    id: "10",
    type: "zendesk",
    title: "Switch to Direct Sign-In or Disconnect Your Apple/Google Sign-In",
    status: "active",
    paragraphs: 0,
  },
  {
    id: "11",
    type: "zendesk",
    title: "Professionals Program",
    status: "active",
    paragraphs: 0,
  },
  {
    id: "12",
    type: "zendesk",
    title: "Monarch for Advisors is now Monarch for Professionals",
    status: "active",
    paragraphs: 0,
  },
];

export type KnowledgeTab =
  | "all"
  | "links"
  | "files"
  | "google-drive"
  | "notion"
  | "confluence"
  | "zendesk";

export const knowledgeTabs: { id: KnowledgeTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "links", label: "Links" },
  { id: "files", label: "Files" },
  { id: "google-drive", label: "Google Drive" },
  { id: "notion", label: "Notion" },
  { id: "confluence", label: "Confluence" },
  { id: "zendesk", label: "Zendesk" },
];
