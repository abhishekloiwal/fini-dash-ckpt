import { KnowledgeItem } from "@/polymet/data/knowledge-items-data";
import { Button } from "@/components/ui/button";
import { PencilIcon, TrashIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface KnowledgeTableProps {
  items: KnowledgeItem[];
}

export function KnowledgeTable({ items }: KnowledgeTableProps) {
  return (
    <div className="bg-background">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground w-16"></th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                Question
              </th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                Answer
              </th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                Status
              </th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                Categories
              </th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                Subcategories
              </th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                Keywords
              </th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.id}
                className="border-b border-border hover:bg-accent/50 transition-colors"
              >
                <td className="py-4 px-6 text-sm text-muted-foreground">
                  {item.id}
                </td>
                <td className="py-4 px-6 text-sm max-w-xs">
                  <div className="truncate">{item.question}</div>
                </td>
                <td className="py-4 px-6 text-sm max-w-xs">
                  <div className="truncate text-muted-foreground">
                    {item.answer}
                  </div>
                </td>
                <td className="py-4 px-6">
                  <Badge className="bg-teal-600 hover:bg-teal-700 text-white border-0 font-medium">
                    {item.status}
                  </Badge>
                </td>
                <td className="py-4 px-6 text-sm text-muted-foreground">
                  {item.categories?.join(", ") || ""}
                </td>
                <td className="py-4 px-6 text-sm text-muted-foreground">
                  {item.subcategories?.join(", ") || ""}
                </td>
                <td className="py-4 px-6 text-sm text-muted-foreground">
                  {item.keywords?.join(", ") || ""}
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
