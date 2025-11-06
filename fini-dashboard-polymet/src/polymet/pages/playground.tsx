import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ArrowUpIcon } from "lucide-react";

export function Playground() {
  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h1 className="text-xl font-semibold">Ask Fini</h1>
        <div className="flex items-center gap-3">
          <Select defaultValue="mariposa">
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mariposa">Mariposa</SelectItem>
              <SelectItem value="bot2">Bot 2</SelectItem>
              <SelectItem value="bot3">Bot 3</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">Start Again</Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-3xl">
          <div className="text-center mb-8">
            <p className="text-muted-foreground">Select bot</p>
          </div>
        </div>
      </div>

      {/* Chat Input */}
      <div className="border-t border-border px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="relative">
            <Input placeholder="Type your question" className="pr-12 h-12" />

            <Button
              size="icon"
              className="absolute right-1 top-1 h-10 w-10 rounded-full bg-blue-600 hover:bg-blue-700"
            >
              <ArrowUpIcon className="h-5 w-5 text-white" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
