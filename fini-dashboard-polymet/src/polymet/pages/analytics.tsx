import { MetricCard } from "@/polymet/components/metric-card";
import { metrics, usageData } from "@/polymet/data/analytics-data";
import { Button } from "@/components/ui/button";
import { FilterIcon, LayoutGridIcon, CalendarIcon, XIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, ResponsiveContainer } from "recharts";

export function Analytics() {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-background">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LayoutGridIcon className="w-5 h-5 text-muted-foreground" />

            <h1 className="text-lg font-semibold">Analytics</h1>
          </div>

          <div className="flex items-center gap-3">
            <Select defaultValue="mariposa">
              <SelectTrigger className="w-[180px] bg-background">
                <LayoutGridIcon className="w-4 h-4 mr-2" />

                <SelectValue placeholder="Select bot" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mariposa">Mariposa</SelectItem>
                <SelectItem value="zendesk">DO NOT USE - Zendesk</SelectItem>
                <SelectItem value="test">DO NOT USE - test</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 px-3 py-2 border border-border rounded-md bg-background">
              <CalendarIcon className="w-4 h-4 text-muted-foreground" />

              <span className="text-sm">2025-10-03 ~ 2025-11-03</span>
              <XIcon className="w-4 h-4 text-muted-foreground cursor-pointer" />
            </div>
          </div>
        </div>

        {/* Filter Row */}
        <div className="px-6 py-3 border-t border-border flex items-center justify-between">
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <FilterIcon className="w-4 h-4 mr-2" />
            Filter
          </Button>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Track By:</span>
            <Button variant="ghost" size="sm" className="text-foreground">
              Message
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              Conversation
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {metrics.map((metric, index) => (
            <MetricCard key={index} metric={metric} />
          ))}
        </div>

        {/* Usage Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={usageData}>
                  <ChartTooltip content={<ChartTooltipContent />} />

                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      });
                    }}
                  />

                  <Bar
                    dataKey="value"
                    fill="hsl(var(--chart-1))"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
