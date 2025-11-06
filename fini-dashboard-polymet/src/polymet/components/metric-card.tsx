import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpIcon, ArrowDownIcon, InfoIcon } from "lucide-react";
import { Metric } from "@/polymet/data/analytics-data";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MetricCardProps {
  metric: Metric;
}

export function MetricCard({ metric }: MetricCardProps) {
  return (
    <Card className="bg-muted/50">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            {metric.label}
            {metric.info && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <InfoIcon className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{metric.info}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </h3>
        </div>

        <p className="text-3xl font-bold mb-2">{metric.value}</p>

        {metric.change && (
          <div className="flex items-center gap-1 text-sm">
            {metric.changeType === "increase" && (
              <ArrowUpIcon className="w-4 h-4 text-green-500" />
            )}
            {metric.changeType === "decrease" && (
              <ArrowDownIcon className="w-4 h-4 text-red-500" />
            )}
            <span
              className={
                metric.changeType === "increase"
                  ? "text-green-500"
                  : metric.changeType === "decrease"
                    ? "text-red-500"
                    : "text-muted-foreground"
              }
            >
              {metric.change}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
