import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Integration } from "@/polymet/data/integrations-data";

interface IntegrationCardProps {
  integration: Integration;
}

export function IntegrationCard({ integration }: IntegrationCardProps) {
  return (
    <Card className="hover:border-foreground/20 transition-colors">
      <CardContent className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <div
            className={`w-12 h-12 rounded-lg ${integration.iconBg} flex items-center justify-center text-2xl flex-shrink-0`}
          >
            {integration.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground mb-2">
              {integration.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {integration.description}
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            variant="ghost"
            className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
          >
            {integration.actionLabel}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
