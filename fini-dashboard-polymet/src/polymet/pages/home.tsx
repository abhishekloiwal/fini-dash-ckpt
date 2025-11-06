import { BotCard } from "@/polymet/components/bot-card";
import { bots } from "@/polymet/data/bots-data";
import { LayoutGridIcon } from "lucide-react";

export function Home() {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-background px-6 py-4">
        <div className="flex items-center gap-3">
          <LayoutGridIcon className="w-5 h-5 text-muted-foreground" />

          <h1 className="text-lg font-semibold">Home</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <BotCard isCreateNew />

          {bots.map((bot) => (
            <BotCard key={bot.id} bot={bot} />
          ))}
        </div>
      </div>
    </div>
  );
}
