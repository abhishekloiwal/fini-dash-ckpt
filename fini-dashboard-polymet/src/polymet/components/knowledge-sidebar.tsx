import {
  HomeIcon,
  BarChart3Icon,
  RocketIcon,
  PenToolIcon,
  SettingsIcon,
  SendIcon,
  BookOpenIcon,
  MessageSquareIcon,
  HistoryIcon,
  BeakerIcon,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  isBold?: boolean;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

export function KnowledgeSidebar() {
  const location = useLocation();

  const navSections: NavSection[] = [
    {
      items: [
        { icon: HomeIcon, label: "Home", href: "/" },
        { icon: BarChart3Icon, label: "Analytics", href: "/analytics" },
        { icon: BeakerIcon, label: "Test", href: "/test", isBold: true },
        { icon: RocketIcon, label: "Deploy", href: "/deploy" },
      ],
    },
    {
      title: "AI Agent Configuration",
      items: [
        {
          icon: PenToolIcon,
          label: "Prompt Configurator",
          href: "/prompt-configurator",
        },
        {
          icon: SettingsIcon,
          label: "Additional Settings",
          href: "/additional-settings",
        },
      ],
    },
    {
      title: "Knowledge Hub",
      items: [
        {
          icon: SendIcon,
          label: "External Knowledge",
          href: "/external-knowledge",
        },
        {
          icon: BookOpenIcon,
          label: "Knowledge Items",
          href: "/knowledge-items",
        },
      ],
    },
    {
      title: "Conversations",
      items: [
        { icon: MessageSquareIcon, label: "Playground", href: "/playground" },
        { icon: HistoryIcon, label: "History", href: "/history" },
      ],
    },
  ];

  return (
    <div className="w-64 h-screen bg-background border-r border-border flex flex-col">
      {/* Logo Section */}
      <div className="p-4 border-b border-border flex items-center gap-3">
        <div className="w-10 h-10 bg-foreground rounded-lg flex items-center justify-center">
          <BookOpenIcon className="w-6 h-6 text-background" />
        </div>
        <div>
          <h1 className="font-semibold text-sm">Monarch Money</h1>
          <p className="text-xs text-muted-foreground">Enterprise</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {navSections.map((section, sectionIdx) => (
          <div key={sectionIdx} className="space-y-1">
            {section.title && (
              <h3 className="text-xs font-medium text-muted-foreground px-3 mb-2">
                {section.title}
              </h3>
            )}
            {section.items.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  location.pathname === item.href
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                <item.icon className="w-4 h-4" />

                <span className={cn(item.isBold && "font-bold")}>
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        ))}
      </nav>
    </div>
  );
}
