import { RefreshCwIcon, ExternalLinkIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ExternalKnowledgeItem } from "@/polymet/data/external-knowledge-data";

interface ExternalKnowledgeTableProps {
  items: ExternalKnowledgeItem[];
}

export function ExternalKnowledgeTable({ items }: ExternalKnowledgeTableProps) {
  return (
    <div className="border border-border rounded-lg bg-card">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-border hover:bg-transparent">
            <TableHead className="w-12">
              <Checkbox />
            </TableHead>
            <TableHead className="w-16">Type</TableHead>
            <TableHead>Link</TableHead>
            <TableHead className="text-right">Paragraphs</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} className="border-b border-border">
              <TableCell>
                <Checkbox />
              </TableCell>
              <TableCell>
                <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                  <span className="text-xs font-bold">Z</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />

                  <span className="bg-muted px-3 py-1 rounded text-sm">
                    {item.title}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" className="text-sm">
                  Preview data
                </Button>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 border-blue-500 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950"
                  >
                    <RefreshCwIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 border-blue-500 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950"
                  >
                    <ExternalLinkIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
