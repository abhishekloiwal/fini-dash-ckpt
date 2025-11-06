export interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  iconBg: string;
  actionLabel: string;
  category: "internal" | "external";
}

export const integrations: Integration[] = [
  {
    id: "1",
    name: "API Key",
    description: "Generate an API key to use public endpoints of Fini.",
    icon: "☁️",
    iconBg: "bg-gray-100 dark:bg-gray-800",
    actionLabel: "Generate",
    category: "internal",
  },
  {
    id: "2",
    name: "Chrome Extension",
    description: "Have Fini with you on your every tab.",
    icon: "🌐",
    iconBg: "bg-green-100 dark:bg-green-900",
    actionLabel: "Download",
    category: "internal",
  },
  {
    id: "3",
    name: "Chat Widget",
    description:
      "Add Fini to your own app as a widget or standalone seamlessly with a code snippet.",
    icon: "💬",
    iconBg: "bg-blue-100 dark:bg-blue-900",
    actionLabel: "Generate",
    category: "internal",
  },
  {
    id: "4",
    name: "Zendesk",
    description:
      "Personalized AI responses with seamless handoff for Zendesk chat and email",
    icon: "🎫",
    iconBg: "bg-gray-100 dark:bg-gray-800",
    actionLabel: "Connect",
    category: "external",
  },
  {
    id: "5",
    name: "Intercom",
    description:
      "AI-driven personalized support and seamless handoff for Intercom chat and email",
    icon: "💼",
    iconBg: "bg-blue-100 dark:bg-blue-900",
    actionLabel: "Connect",
    category: "external",
  },
  {
    id: "6",
    name: "Front",
    description:
      "AI-powered responses with seamless human handoff for Front chat and email",
    icon: "📧",
    iconBg: "bg-purple-100 dark:bg-purple-900",
    actionLabel: "Connect",
    category: "external",
  },
  {
    id: "7",
    name: "HubSpot",
    description:
      "Personalized AI responses and effortless handoff for HubSpot chat and email",
    icon: "🔶",
    iconBg: "bg-orange-100 dark:bg-orange-900",
    actionLabel: "Connect",
    category: "external",
  },
  {
    id: "8",
    name: "Slack",
    description:
      "Help your teams get AI responses on your internal data within Slack.",
    icon: "💬",
    iconBg: "bg-purple-100 dark:bg-purple-900",
    actionLabel: "Connect",
    category: "external",
  },
  {
    id: "9",
    name: "Discord",
    description: "AI-driven customer support within your Discord community.",
    icon: "🎮",
    iconBg: "bg-indigo-100 dark:bg-indigo-900",
    actionLabel: "Connect",
    category: "external",
  },
];
