import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FilterIcon, CalendarIcon, XIcon } from "lucide-react";
import { historyItems } from "@/polymet/data/history-data";

export function History() {
  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold">Chat History</h1>
          <Button variant="outline" size="sm">
            <FilterIcon className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
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
          <div className="flex items-center gap-2 px-3 py-2 border border-border rounded-md">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />

            <span className="text-sm">2025-10-03 ~ 2025-11-03</span>
            <Button variant="ghost" size="icon" className="h-5 w-5 ml-2">
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Source</TableHead>
              <TableHead className="min-w-[400px]">Question</TableHead>
              <TableHead className="w-[150px]">Categories</TableHead>
              <TableHead className="w-[120px]">Ticket ID</TableHead>
              <TableHead className="w-[150px]">Received on</TableHead>
              <TableHead className="w-[150px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {historyItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.source}</TableCell>
                <TableCell className="max-w-[400px] truncate">
                  {item.question}
                </TableCell>
                <TableCell>{item.categories}</TableCell>
                <TableCell>{item.ticketId}</TableCell>
                <TableCell>{item.receivedOn}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-blue-600"
                    >
                      View
                    </Button>
                    <span className="text-muted-foreground">|</span>
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-blue-600"
                    >
                      Details
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
