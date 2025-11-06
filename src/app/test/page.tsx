"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import {
  Beaker,
  BookOpen,
  Boxes,
  FileText,
  FlaskConical,
  History,
  Home,
  MessageSquare,
  PenLine,
  PlayCircle,
  Rocket,
  Settings,
  Sparkles,
  Wand2,
} from "lucide-react";

type NavItem = {
  label: string;
  icon: ReactNode;
  href?: string;
  active?: boolean;
};

type NavSection = {
  heading: string;
  items: NavItem[];
};

const navSections: NavSection[] = [
  {
    heading: "",
    items: [
      { label: "Home", icon: <Home className="h-4 w-4" /> },
      { label: "Analytics", icon: <Boxes className="h-4 w-4" /> },
      {
        label: "Test",
        icon: <FlaskConical className="h-4 w-4" />,
        href: "/test",
        active: true,
      },
      { label: "Deploy", icon: <Rocket className="h-4 w-4" /> },
    ],
  },
  {
    heading: "AI Agent Configuration",
    items: [
      { label: "Prompt Configurator", icon: <Wand2 className="h-4 w-4" /> },
      { label: "Additional Settings", icon: <Settings className="h-4 w-4" /> },
    ],
  },
  {
    heading: "Knowledge Hub",
    items: [
      { label: "External Knowledge", icon: <BookOpen className="h-4 w-4" /> },
      { label: "Knowledge Items", icon: <FileText className="h-4 w-4" /> },
    ],
  },
  {
    heading: "Conversations",
    items: [
      { label: "Playground", icon: <PlayCircle className="h-4 w-4" /> },
      { label: "History", icon: <History className="h-4 w-4" /> },
    ],
  },
];

type ActionCard = {
  icon: ReactNode;
  title: string;
  description: ReactNode;
  actionLabel: string;
  onClick: () => void;
};

export default function TestDashboardPage() {
  const router = useRouter();

  const actions: ActionCard[] = [
    {
      icon: <Beaker className="h-6 w-6 text-slate-700" />,
      title: "Generate from conversations",
      description:
        "Connect Zendesk and replay real customer conversations so you can compare Fini’s answers to your agents’ replies.",
      actionLabel: "Generate",
      onClick: () => router.push("/test/from-conversations"),
    },
    {
      icon: <PenLine className="h-6 w-6 text-slate-700" />,
      title: "Add manually",
      description: "Paste or upload your own questions to seed the batch test set one-by-one.",
      actionLabel: "Add",
      onClick: () => router.push("/test/add-manually"),
    },
    {
      icon: <Sparkles className="h-6 w-6 text-slate-700" />,
      title: "Generate questions",
      description:
        "Draft additional simulated scenarios beyond your historical conversations to evaluate fresh coverage gaps.",
      actionLabel: "Generate",
      onClick: () => router.push("/test/ai-expansion"),
    },
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-[#f5f7fb] via-white to-white text-slate-900">
      <aside className="flex w-72 flex-col border-r border-slate-200 bg-white/95 px-6 py-8 shadow-sm shadow-slate-100 backdrop-blur">
        <div className="mb-8 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-inner">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
            <FlaskConical className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Monarch Money</p>
            <p className="text-xs text-slate-500">Enterprise</p>
          </div>
        </div>

        <nav className="space-y-7 overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.heading || "main"} className="space-y-3">
              {section.heading ? (
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  {section.heading}
                </p>
              ) : null}
              <ul className="space-y-1">
                {section.items.map((item) => (
                  <li key={item.label}>
                    <button
                      type="button"
                      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                        item.active
                          ? "bg-slate-900 text-white shadow-sm"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                      onClick={() => {
                        if (item.href) {
                          router.push(item.href);
                        }
                      }}
                    >
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                          item.active ? "bg-white/20" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {item.icon}
                      </span>
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="mt-auto flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 shadow-inner">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white">
            <MessageSquare className="h-4 w-4" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">Mariposa</p>
            <p className="text-xs text-slate-500">Support Lead</p>
          </div>
        </div>
      </aside>

      <main className="flex flex-1 flex-col items-center px-12 py-10">
        <header className="mb-8 w-full border-b border-slate-200 pb-6">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Batch test</h1>
          <p className="mt-2 text-sm text-slate-600">
            Launch guided simulations to stress-test Fini with historical transcripts, manual prompts, or simulated
            scenarios. Pick a path below to start assembling your dataset.
          </p>
        </header>
        <section className="flex w-full max-w-[960px] flex-col items-center justify-start">
          <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-sm shadow-slate-100">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {actions.map((action) => (
                <article
                  key={action.title}
                  className="flex min-h-[220px] flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="space-y-2">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                      {action.icon}
                    </span>
                    <h2 className="text-lg font-semibold text-slate-900">{action.title}</h2>
                    <p className="text-sm leading-relaxed text-slate-600">{action.description}</p>
                  </div>
                  <button
                    type="button"
                    className="mt-6 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                    onClick={action.onClick}
                  >
                    {action.actionLabel}
                  </button>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
