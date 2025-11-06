import { KnowledgeHeader } from "@/polymet/components/knowledge-header";
import { KnowledgeTable } from "@/polymet/components/knowledge-table";
import { knowledgeItems } from "@/polymet/data/knowledge-items-data";

export function KnowledgeDashboard() {
  return (
    <div className="h-full flex flex-col">
      <KnowledgeHeader />

      <div className="flex-1 overflow-auto">
        <KnowledgeTable items={knowledgeItems} />
      </div>
    </div>
  );
}
