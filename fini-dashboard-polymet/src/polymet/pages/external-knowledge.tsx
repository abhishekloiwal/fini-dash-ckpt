import { useState } from "react";
import { UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExternalKnowledgeTable } from "@/polymet/components/external-knowledge-table";
import {
  externalKnowledgeItems,
  knowledgeTabs,
  type KnowledgeTab,
} from "@/polymet/data/external-knowledge-data";

export function ExternalKnowledge() {
  const [activeTab, setActiveTab] = useState<KnowledgeTab>("all");

  const filteredItems =
    activeTab === "all"
      ? externalKnowledgeItems
      : externalKnowledgeItems.filter((item) => item.type === activeTab);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border bg-background px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">External Knowledge</h1>
          <div className="flex items-center gap-3">
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
              Add Knowledge
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Tabs */}
          <div className="flex items-center gap-1 mb-6 border-b border-border">
            {knowledgeTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                  activeTab === tab.id
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            ))}
          </div>

          {/* Table */}
          <ExternalKnowledgeTable items={filteredItems} />
        </div>
      </div>
    </div>
  );
}
