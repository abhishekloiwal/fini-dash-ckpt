import { BeakerIcon, MessagesSquareIcon, SparklesIcon, FileTextIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function Test() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 p-4">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="rounded-lg bg-foreground p-2 text-background">
            <BeakerIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Batch test</h1>
            <p className="text-sm text-muted-foreground">
              Launch guided simulations to stress‑test Fini with historical transcripts, manual prompts, or simulated scenarios. Pick a path below to start assembling your dataset.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-6">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 place-items-stretch">
          <OptionCard
            icon={MessagesSquareIcon}
            title="Generate from conversations"
            subtitle="Connect Zendesk and replay real customer conversations so you can compare Fini’s answers to your agents’ replies."
            cta="Generate"
            onClick={() => navigate("/test/from-conversations")}
          />
          <OptionCard
            icon={FileTextIcon}
            title="Add manually"
            subtitle="Paste or upload your own questions to seed the batch test set one‑by‑one."
            cta="Add"
            onClick={() => navigate("/test/add-manually")}
          />
          <OptionCard
            icon={SparklesIcon}
            title="Generate questions"
            subtitle="Draft additional simulated scenarios beyond your historical conversations to evaluate fresh coverage gaps."
            cta="Generate"
            onClick={() => navigate("/test/ai-expansion")}
          />
          </div>
        </div>
      </main>
    </div>
  );
}

function OptionCard({
  icon: Icon,
  title,
  subtitle,
  cta,
  onClick,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  cta: string;
  onClick: () => void;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-3 shadow-sm">
      <div className="rounded-2xl border border-border bg-background p-5 h-full flex flex-col">
        <div className="mb-3 inline-flex items-center justify-center rounded-xl bg-secondary p-2.5">
          <Icon className="h-5 w-5 text-foreground" />
        </div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground flex-1">{subtitle}</p>
        <button
          type="button"
          onClick={onClick}
          className="mt-5 w-full rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-background"
        >
          {cta}
        </button>
      </div>
    </div>
  );
}
