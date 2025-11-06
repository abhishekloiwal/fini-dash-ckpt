import { Button } from "@/components/ui/button";
import { FilterIcon, LayoutGridIcon, ChevronDownIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function KnowledgeHeader() {
  return (
    <div className="border-b border-border bg-background">
      <div className="px-6 py-4 flex items-center justify-between">
        {/* Left side - Title and Icon */}
        <div className="flex items-center gap-3">
          <LayoutGridIcon className="w-5 h-5 text-muted-foreground" />

          <h1 className="text-lg font-semibold">Knowledge Items</h1>
        </div>

        {/* Right side - Filter and Actions */}
        <div className="flex items-center gap-3">
          <Select defaultValue="all">
            <SelectTrigger className="w-[140px] bg-background">
              <LayoutGridIcon className="w-4 h-4 mr-2" />

              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="live">Live</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="default"
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            Default bots
          </Button>

          <Button
            variant="default"
            className="bg-foreground hover:bg-foreground/90 text-background"
          >
            Create new
          </Button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="px-6 py-3 border-t border-border">
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <FilterIcon className="w-4 h-4 mr-2" />
          Filter
        </Button>
      </div>
    </div>
  );
}
