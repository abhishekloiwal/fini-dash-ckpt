import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PencilIcon, SendIcon, CopyIcon, PlusIcon } from "lucide-react";
import { Bot } from "@/polymet/data/bots-data";

interface BotCardProps {
  bot?: Bot;
  isCreateNew?: boolean;
}

export function BotCard({ bot, isCreateNew }: BotCardProps) {
  if (isCreateNew) {
    return (
      <Card className="hover:border-foreground/20 transition-colors cursor-pointer">
        <CardContent className="p-6 flex flex-col items-center justify-center min-h-[200px]">
          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mb-3">
            <PlusIcon className="w-6 h-6 text-foreground" />
          </div>
          <h3 className="font-semibold text-foreground">Create new bot</h3>
        </CardContent>
      </Card>
    );
  }

  if (!bot) return null;

  return (
    <Card className="hover:border-foreground/20 transition-colors">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">{bot.name}</h3>
            {bot.status === "active" && (
              <div className="w-2 h-2 rounded-full bg-green-500" />
            )}
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-1">Deployments</p>
          <p className="text-2xl font-semibold">{bot.deployments}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="icon"
            className="h-9 w-9 bg-foreground hover:bg-foreground/90 text-background"
          >
            <PencilIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="default"
            size="icon"
            className="h-9 w-9 bg-foreground hover:bg-foreground/90 text-background"
          >
            <SendIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="default"
            size="icon"
            className="h-9 w-9 bg-foreground hover:bg-foreground/90 text-background"
          >
            <CopyIcon className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
