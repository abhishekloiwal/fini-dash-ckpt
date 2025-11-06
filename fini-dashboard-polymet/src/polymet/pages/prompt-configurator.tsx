import { useState } from "react";
import { ChevronRightIcon, HistoryIcon, UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PromptCard } from "@/polymet/components/prompt-card";
import { promptTypes, basePromptContent } from "@/polymet/data/prompt-data";

export function PromptConfigurator() {
  const [selectedPrompt, setSelectedPrompt] = useState("base");
  const [promptText, setPromptText] = useState(basePromptContent);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border bg-background px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Prompt Method</span>
            <ChevronRightIcon className="w-4 h-4" />

            <span className="text-foreground">Custom Prompt</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm">
              <HistoryIcon className="w-4 h-4 mr-2" />
            </Button>
            <Select defaultValue="mariposa">
              <SelectTrigger className="w-[180px]">
                <div className="flex items-center gap-2">
                  <UploadIcon className="w-4 h-4" />

                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mariposa">Mariposa</SelectItem>
              </SelectContent>
            </Select>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              Save Prompt
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Choose a prompt section */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Choose a prompt</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {promptTypes.map((prompt) => (
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  isSelected={selectedPrompt === prompt.id}
                  onClick={() => setSelectedPrompt(prompt.id)}
                />
              ))}
            </div>
          </div>

          {/* Base Prompt section */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Base Prompt <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              className="min-h-[400px] font-mono text-sm resize-none"
              placeholder="Enter your prompt here..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
